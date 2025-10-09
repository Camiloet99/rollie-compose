import { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useCrm } from "./CrmProvider";

export default function WatchAddModal({ show, onHide }) {
  const { actions } = useCrm();
  const [form, setForm] = useState({
    id: "", // opcional; lo generamos si viene vacío
    serialNumber: "",
    brand: "",
    model: "",
    reference: "",
    year: "",
    purchaseDate: "",
    cost: "",
    retailPrice: "",
    status: "available",
    condition: "New",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        ["year", "cost", "retailPrice"].includes(name) && value !== ""
          ? Number(value)
          : value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Validación mínima
    if (!form.brand || !form.model || !form.reference || !form.purchaseDate)
      return;
    actions.addWatch(form);
    onHide();
    setForm({
      id: "",
      serialNumber: "",
      brand: "",
      model: "",
      reference: "",
      year: "",
      purchaseDate: "",
      cost: "",
      retailPrice: "",
      status: "available",
      condition: "New",
    });
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
      fullscreen="sm-down" // full screen en móviles (xs/sm)
    >
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Add Watch</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Internal Code (optional)</Form.Label>
                <Form.Control
                  name="id"
                  value={form.id}
                  onChange={onChange}
                  placeholder="WD-001"
                />
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group>
                <Form.Label>Serial Number</Form.Label>
                <Form.Control
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Brand *</Form.Label>
                <Form.Control
                  name="brand"
                  value={form.brand}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Model *</Form.Label>
                <Form.Control
                  name="model"
                  value={form.model}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Reference *</Form.Label>
                <Form.Control
                  name="reference"
                  value={form.reference}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Control
                  type="number"
                  name="year"
                  value={form.year}
                  onChange={onChange}
                  min={1900}
                  max={2100}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Purchase Date *</Form.Label>
                <Form.Control
                  type="date"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={form.status}
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
                  value={form.cost}
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
                  value={form.retailPrice}
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
                  value={form.condition}
                  onChange={onChange}
                  placeholder="New, Like New, Excellent..."
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-white">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit">Save Watch</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
