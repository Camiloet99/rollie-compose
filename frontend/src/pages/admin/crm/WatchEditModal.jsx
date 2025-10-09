import { useEffect, useState } from "react";
import { Modal, Button, Form, Row, Col, Badge } from "react-bootstrap";
import { useCrm } from "./CrmProvider";

export default function WatchEditModal({ show, onHide, watchId }) {
  const { state, actions } = useCrm();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (show && watchId) {
      const w = state.inventory.find((x) => x.id === watchId);
      setForm(w ? { ...w } : null);
    }
  }, [show, watchId, state.inventory]);

  if (!form) return null;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        name === "cost" || name === "retailPrice" || name === "year"
          ? Number(value)
          : value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    actions.updateWatch(form);
    onHide();
  };

  const statusBadge =
    form.status === "available" ? (
      <Badge bg="success">available</Badge>
    ) : form.status === "sold" ? (
      <Badge bg="danger">sold</Badge>
    ) : (
      <Badge bg="warning" text="dark">
        pending
      </Badge>
    );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            Edit Watch · <small className="text-muted">{form.id}</small>{" "}
            {statusBadge}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Brand</Form.Label>
                <Form.Control
                  name="brand"
                  value={form.brand || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Model</Form.Label>
                <Form.Control
                  name="model"
                  value={form.model || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Reference</Form.Label>
                <Form.Control
                  name="reference"
                  value={form.reference || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Serial Number</Form.Label>
                <Form.Control
                  name="serialNumber"
                  value={form.serialNumber || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Control
                  type="number"
                  name="year"
                  value={form.year || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Purchase Date</Form.Label>
                <Form.Control
                  type="date"
                  name="purchaseDate"
                  value={form.purchaseDate || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={form.status || "available"}
                  onChange={onChange}
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Cost</Form.Label>
                <Form.Control
                  type="number"
                  name="cost"
                  value={form.cost ?? ""}
                  onChange={onChange}
                  min={0}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Retail Price</Form.Label>
                <Form.Control
                  type="number"
                  name="retailPrice"
                  value={form.retailPrice ?? ""}
                  onChange={onChange}
                  min={0}
                />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group>
                <Form.Label>Condition</Form.Label>
                <Form.Control
                  name="condition"
                  value={form.condition || ""}
                  onChange={onChange}
                  placeholder="New, Like New, Excellent..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button type="submit">Save changes</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
