import {
  Card,
  Button,
  ButtonGroup,
  InputGroup,
  Form,
  Table,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { useMemo, useState } from "react";
import { useCrm } from "./CrmProvider";
import WatchEditModal from "./WatchEditModal";
import WatchAddModal from "./WatchAddModal";

export default function InventoryPage() {
  const { state } = useCrm();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedWatchId, setSelectedWatchId] = useState(null);

  const filtered = useMemo(
    () =>
      state.inventory.filter((w) => {
        const byStatus = status === "all" ? true : w.status === status;
        const hay =
          `${w.id} ${w.serialNumber} ${w.brand} ${w.model} ${w.reference}`.toLowerCase();
        return byStatus && hay.includes(q.toLowerCase());
      }),
    [state.inventory, q, status]
  );

  const statusBadge = (s) =>
    s === "available" ? (
      <Badge bg="success">available</Badge>
    ) : s === "sold" ? (
      <Badge bg="danger">sold</Badge>
    ) : (
      <Badge bg="warning" text="dark">
        pending
      </Badge>
    );

  return (
    <>
      <Row className="g-2 mb-3">
        <Col xs="auto">
          <ButtonGroup>
            <Button onClick={() => setAddOpen(true)}>➕ Add Watch</Button>
            <Button
              variant="outline-secondary"
              onClick={() => alert("Import CSV")}
            >
              📤 Import
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => alert("Export CSV")}
            >
              💾 Export
            </Button>
          </ButtonGroup>
        </Col>
        <Col xs={12} md={5} className="ms-auto">
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search inventory..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ maxWidth: 170 }}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </Form.Select>
          </InputGroup>
        </Col>
      </Row>

      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <strong>Current Inventory</strong>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table striped bordered hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Code</th>
                  <th>Serial</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>Reference</th>
                  <th>Year</th>
                  <th>Purchase</th>
                  <th>Cost</th>
                  <th>Retail</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th style={{ width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <strong>{w.id}</strong>
                    </td>
                    <td>{w.serialNumber}</td>
                    <td>{w.brand}</td>
                    <td>{w.model}</td>
                    <td>{w.reference}</td>
                    <td>{w.year}</td>
                    <td>{new Date(w.purchaseDate).toLocaleDateString()}</td>
                    <td>${w.cost.toLocaleString()}</td>
                    <td>${w.retailPrice.toLocaleString()}</td>
                    <td>{w.daysInStock}</td>
                    <td>{statusBadge(w.status)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => {
                          setSelectedWatchId(w.id);
                          setEditOpen(true);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center text-muted py-4">
                      No results
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      <WatchAddModal show={addOpen} onHide={() => setAddOpen(false)} />
      <WatchEditModal
        show={editOpen}
        watchId={selectedWatchId}
        onHide={() => setEditOpen(false)}
      />
    </>
  );
}
