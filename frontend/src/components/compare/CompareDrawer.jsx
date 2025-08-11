import { useMemo, useState } from "react";
import {
  Offcanvas,
  Table,
  Button,
  ButtonGroup,
  Badge,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import { useCompareStore } from "../../store/compareStore";
import "./CompareDrawer.css";
import { formatPrice } from "../../utils/formatPrice";

const fmt = (v) => (v ?? "") || "—";
const chips = (csv, variant = "secondary") =>
  (csv || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => (
      <Badge key={`${t}-${i}`} bg={variant} className="me-1">
        {t}
      </Badge>
    ));

function toCsv(items) {
  const headers = [
    "referenceCode",
    "productionYear",
    "condition",
    "colorDial",
    "extraInfo",
    "cost",
    "currency",
  ];
  const escape = (val) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(","),
    ...items.map((w) => headers.map((h) => escape(w[h])).join(",")),
  ];
  return lines.join("\n");
}

export default function CompareDrawer() {
  const { items, isOpen, close, clear, remove } = useCompareStore();
  const [view, setView] = useState("table"); // "table" | "cards"

  // ---- métricas para resaltar (mejor precio y año más nuevo)
  const metrics = useMemo(() => {
    const numeric = (x) =>
      x === null || x === undefined || x === "" ? undefined : Number(x);
    const prices = items
      .map((w) => numeric(w.cost))
      .filter((n) => Number.isFinite(n));
    const years = items
      .map((w) => numeric(w.productionYear))
      .filter((n) => Number.isFinite(n));
    return {
      minPrice: prices.length ? Math.min(...prices) : undefined,
      maxYear: years.length ? Math.max(...years) : undefined,
    };
  }, [items]);

  const downloadCsv = () => {
    const csv = toCsv(items);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "compare.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Offcanvas
      show={isOpen}
      onHide={close}
      placement="end"
      scroll={false}
      backdrop
      className="compare-offcanvas" // 👈 controla ancho máx con CSS
    >
      <Offcanvas.Header closeButton className="pb-0">
        <div className="d-flex align-items-center w-100 justify-content-between">
          <Offcanvas.Title className="fw-semibold">
            Compare watches
          </Offcanvas.Title>

          <div className="d-flex align-items-center gap-2">
            <ButtonGroup aria-label="View mode">
              <Button
                variant={view === "table" ? "dark" : "outline-dark"}
                size="sm"
                onClick={() => setView("table")}
              >
                Table
              </Button>
              <Button
                variant={view === "cards" ? "dark" : "outline-dark"}
                size="sm"
                onClick={() => setView("cards")}
              >
                Cards
              </Button>
            </ButtonGroup>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={downloadCsv}
              disabled={!items.length}
            >
              Export CSV
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={clear}
              disabled={!items.length}
            >
              Clear all
            </Button>
          </div>
        </div>
      </Offcanvas.Header>

      <Offcanvas.Body className="pt-3">
        {!items.length ? (
          <div className="compare-empty">
            <div className="compare-empty-inner">
              <div className="compare-empty-icon">⌚</div>
              <h5 className="mt-2 mb-1">No items selected</h5>
              <p className="text-muted mb-0">
                Add watches to compare from the results list.
              </p>
            </div>
          </div>
        ) : view === "table" ? (
          <div className="compare-table-wrapper">
            <Table
              hover
              responsive={false}
              className="compare-table align-middle"
            >
              <thead>
                <tr>
                  <th className="sticky-col">Field</th>
                  {items.map((w, i) => (
                    <th key={i} className="text-center">
                      <div className="d-flex flex-column align-items-center">
                        <div className="fw-semibold">
                          {w.referenceCode || w.id}
                        </div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="mt-1"
                          onClick={() => remove(w)}
                        >
                          Remove
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sticky-col">Production Year</td>
                  {items.map((w, i) => {
                    const val = w.productionYear;
                    const highlight =
                      Number(val) === metrics.maxYear ? "hl-good" : "";
                    return (
                      <td key={i} className={highlight}>
                        {fmt(val)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="sticky-col">Condition</td>
                  {items.map((w, i) => (
                    <td key={i}>{chips(w.condition, "info")}</td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky-col">Color</td>
                  {items.map((w, i) => (
                    <td key={i}>{fmt(w.colorDial)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky-col">Extra Info</td>
                  {items.map((w, i) => (
                    <td key={i}>{chips(w.extraInfo, "warning")}</td>
                  ))}
                </tr>
                <tr>
                  <td className="sticky-col">Price</td>
                  {items.map((w, i) => {
                    const n = Number(w.cost);
                    const highlight =
                      Number.isFinite(n) && n === metrics.minPrice
                        ? "hl-good"
                        : "";
                    return (
                      <td key={i} className={highlight}>
                        <strong>{formatPrice(w.cost, w.currency)}</strong>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </Table>
          </div>
        ) : (
          // ---- Vista tarjetas (grid) ----
          <div className="compare-grid">
            <Row className="g-3">
              {items.map((w, idx) => {
                const isBestPrice =
                  Number.isFinite(Number(w.cost)) &&
                  Number(w.cost) === metrics.minPrice;
                const isNewest =
                  Number.isFinite(Number(w.productionYear)) &&
                  Number(w.productionYear) === metrics.maxYear;
                return (
                  <Col key={idx} xs={12} md={6} xl={4}>
                    <Card className="shadow-sm border-0 rounded-4 compare-card">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Card.Title className="mb-0">
                            {w.referenceCode || w.id}
                          </Card.Title>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => remove(w)}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="text-muted small mb-2">
                          <strong>Year:</strong>{" "}
                          <span
                            className={isNewest ? "hl-good px-1 rounded-2" : ""}
                          >
                            {fmt(w.productionYear)}
                          </span>
                        </div>
                        {w.condition && (
                          <div className="mb-2">
                            <strong>Condition:</strong>{" "}
                            {chips(w.condition, "info")}
                          </div>
                        )}
                        {w.colorDial && (
                          <div className="mb-2">
                            <strong>Color:</strong> {fmt(w.colorDial)}
                          </div>
                        )}
                        {w.extraInfo && (
                          <div className="mb-3">
                            <strong>Extra:</strong>{" "}
                            {chips(w.extraInfo, "warning")}
                          </div>
                        )}
                        <div className="d-flex align-items-baseline gap-2">
                          <div
                            className={`fs-5 fw-semibold ${
                              isBestPrice ? "hl-good px-2 rounded-2" : ""
                            }`}
                          >
                            ${(w.cost ?? 0).toLocaleString()}
                          </div>
                          <div className="text-muted text-uppercase small">
                            {w.currency || ""}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}
