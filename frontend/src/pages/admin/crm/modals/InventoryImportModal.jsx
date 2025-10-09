// src/pages/admin/crm/modals/InventoryImportModal.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Table,
  Alert,
  Badge,
} from "react-bootstrap";
import Papa from "papaparse";
import { useCrm } from "../CrmProvider";

// Target inventory fields
const TARGET_FIELDS = [
  { key: "id", label: "Internal Code (id)", req: false },
  { key: "serialNumber", label: "Serial Number", req: false },
  { key: "brand", label: "Brand", req: true },
  { key: "model", label: "Model", req: true },
  { key: "reference", label: "Reference", req: true },
  { key: "year", label: "Year", req: false },
  { key: "purchaseDate", label: "Purchase Date (YYYY-MM-DD)", req: true },
  { key: "cost", label: "Cost", req: false },
  { key: "retailPrice", label: "Retail Price", req: false },
  { key: "status", label: "Status (available/sold/pending)", req: false },
  { key: "condition", label: "Condition", req: false },
];

// Auto-map hints by column name
const GUESS_MAP = {
  id: ["id", "code", "internal code", "watch id"],
  serialNumber: ["serial", "serial number", "sn"],
  brand: ["brand"],
  model: ["model"],
  reference: ["reference", "ref", "ref."],
  year: ["year"],
  purchaseDate: ["purchase date", "buy date", "date purchased"],
  cost: ["cost", "purchase price"],
  retailPrice: ["retail", "retail price", "asking", "price"],
  status: ["status", "availability", "available"],
  condition: ["condition"],
};

function normHeader(s) {
  return (s || "").toString().trim().toLowerCase();
}
function guessFor(key, headers) {
  const candidates = GUESS_MAP[key] || [];
  const hNorm = headers.map(normHeader);
  const idx = hNorm.findIndex((h) => candidates.includes(h));
  return idx >= 0 ? headers[idx] : "";
}

function parseNumber(v) {
  if (v === null || v === undefined || v === "") return "";
  // strip currency, spaces, and thousand separators
  const s = String(v)
    .replace(/[^0-9.,-]/g, "")
    .replace(/\.(?=.*\.)/g, "")
    .replace(/,(?=.*,)/g, "");
  // case 1: "1.234,56" -> remove dots, comma as decimal
  if (s.includes(",") && s.includes(".")) {
    const cleaned = s.replace(/\./g, "").replace(",", ".");
    return Number(cleaned);
  }
  // case 2: only comma as decimal
  if (s.includes(",") && !s.includes(".")) return Number(s.replace(",", "."));
  return Number(s);
}
function parseYear(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : "";
}
function parseDateISO(v) {
  if (!v) return "";
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // YYYY-MM-DD
  const ddmmyyyy = s.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/); // DD/MM/YYYY
  if (ddmmyyyy) {
    const [_, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  const mdyyyy = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); // M/D/YYYY
  if (mdyyyy) {
    let [_, mm, dd, yyyy] = mdyyyy;
    mm = mm.padStart(2, "0");
    dd = dd.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}
function normStatus(v) {
  const s = normHeader(v);
  if (["available", "avail"].includes(s)) return "available";
  if (["sold"].includes(s)) return "sold";
  if (["pending", "hold", "reserved"].includes(s)) return "pending";
  return "available";
}

export default function InventoryImportModal({ show, onHide }) {
  const { actions } = useCrm();
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]); // raw objects by header
  const [mapping, setMapping] = useState({}); // {targetKey: headerName}
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!show) {
      setFile(null);
      setHeaders([]);
      setRows([]);
      setMapping({});
      setErrors([]);
    }
  }, [show]);

  const handleFile = (f) => {
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        const hs = res.meta.fields || [];
        setHeaders(hs);
        setRows(res.data || []);
        // auto-guess mapping
        const auto = {};
        TARGET_FIELDS.forEach(({ key }) => {
          auto[key] = guessFor(key, hs);
        });
        setMapping(auto);
      },
      error: (e) => setErrors([e.message || "Error parsing CSV"]),
    });
  };

  const setMap = (key, value) => setMapping((m) => ({ ...m, [key]: value }));

  const normalized = useMemo(() => {
    if (!rows.length) return [];
    return rows.map((r, idx) => {
      const get = (key) => {
        const h = mapping[key];
        return h ? r[h] : "";
      };
      const o = {
        id: get("id") || "",
        serialNumber: get("serialNumber") || "",
        brand: get("brand") || "",
        model: get("model") || "",
        reference: get("reference") || "",
        year: parseYear(get("year")),
        purchaseDate: parseDateISO(get("purchaseDate")),
        cost: get("cost") !== "" ? parseNumber(get("cost")) : "",
        retailPrice:
          get("retailPrice") !== "" ? parseNumber(get("retailPrice")) : "",
        status: get("status") ? normStatus(get("status")) : "available",
        condition: get("condition") || "",
      };
      // generate id if missing
      if (!o.id) o.id = `WD-${String(Date.now() + idx).slice(-5)}`;
      return o;
    });
  }, [rows, mapping]);

  const mappingMissingRequired = useMemo(() => {
    if (!rows.length) return [];
    return TARGET_FIELDS.filter((f) => f.req && !mapping[f.key]).map(
      (f) => f.label
    );
  }, [mapping, rows.length]);

  const rowValidation = (o) => {
    const missing = [];
    if (!o.brand) missing.push("brand");
    if (!o.model) missing.push("model");
    if (!o.reference) missing.push("reference");
    if (!o.purchaseDate) missing.push("purchaseDate");
    return missing;
  };

  const canImport = rows.length > 0 && mappingMissingRequired.length === 0;

  const onImport = () => {
    const invalid = [];
    normalized.forEach((o, i) => {
      const miss = rowValidation(o);
      if (miss.length) invalid.push({ index: i, missing: miss });
    });
    if (invalid.length) {
      setErrors([
        `There are ${invalid.length} rows with missing required fields. Please review the mapping or your CSV.`,
      ]);
      return;
    }
    normalized.forEach((w) => actions.addWatch(w));
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
      fullscreen="sm-down"
    >
      <Modal.Header closeButton>
        <Modal.Title>Import Inventory (CSV)</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {errors.length > 0 && (
          <Alert variant="danger" className="mb-3">
            {errors.map((e, i) => (
              <div key={i}>{e}</div>
            ))}
          </Alert>
        )}

        {/* Step 1: file */}
        <Row className="g-3 mb-3">
          <Col md={8}>
            <Form.Group>
              <Form.Label>CSV file</Form.Label>
              <Form.Control
                type="file"
                accept=".csv,text/csv"
                onChange={(e) =>
                  e.target.files?.[0] && handleFile(e.target.files[0])
                }
              />
              <Form.Text className="text-muted">
                Accepts headers; comma as separator. Handles quotes and
                currency-formatted numbers.
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Detected rows</Form.Label>
              <div className="form-control bg-light">{rows.length}</div>
            </Form.Group>
          </Col>
        </Row>

        {/* Step 2: mapping */}
        {headers.length > 0 && (
          <>
            <h6 className="mb-2">Map CSV columns to inventory fields</h6>
            {mappingMissingRequired.length > 0 && (
              <Alert variant="warning" className="py-2">
                Missing required fields:{" "}
                {mappingMissingRequired.map((l, i) => (
                  <Badge key={i} bg="warning" text="dark" className="me-1">
                    {l}
                  </Badge>
                ))}
              </Alert>
            )}
            <Row className="g-2">
              {TARGET_FIELDS.map(({ key, label, req }) => (
                <Col key={key} md={6}>
                  <Form.Group>
                    <Form.Label className="small">
                      {label}
                      {req && <span className="text-danger"> *</span>}
                    </Form.Label>
                    <Form.Select
                      value={mapping[key] || ""}
                      onChange={(e) => setMap(key, e.target.value)}
                    >
                      <option value="">— Do not map —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              ))}
            </Row>
          </>
        )}

        {/* Step 3: preview */}
        {normalized.length > 0 && (
          <>
            <hr />
            <h6 className="mb-2">Preview (first 10 rows)</h6>
            <div className="table-responsive">
              <Table hover bordered size="sm" className="mb-0">
                <thead className="table-light">
                  <tr>
                    {TARGET_FIELDS.map((f) => (
                      <th key={f.key}>{f.key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {normalized.slice(0, 10).map((o, i) => (
                    <tr key={i}>
                      {TARGET_FIELDS.map((f) => (
                        <td key={f.key}>{String(o[f.key] ?? "")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-white">
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          onClick={onImport}
          disabled={!canImport || normalized.length === 0}
        >
          Import {normalized.length ? `(${normalized.length})` : ""}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
