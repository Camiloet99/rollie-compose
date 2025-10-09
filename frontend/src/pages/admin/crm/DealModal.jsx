import { useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Stack } from "react-bootstrap";
import { useCrm } from "./CrmProvider";

export default function DealModal({ show, onHide }) {
  const { state, actions } = useCrm();
  const [form, setForm] = useState({
    watchId: "",
    contactId: "",
    stage: "prospect",
    proposedPrice: "",
    expectedClose: "",
  });

  const availableWatches = useMemo(
    () => state.inventory.filter((w) => w.status === "available"),
    [state.inventory]
  );

  const selectedWatch = state.inventory.find((w) => w.id === form.watchId);
  const potentialProfit = selectedWatch
    ? Number(form.proposedPrice || 0) - (selectedWatch.cost || 0)
    : 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.watchId || !form.contactId || !form.proposedPrice) return;
    actions.saveDeal({
      watchId: form.watchId,
      contactId: Number(form.contactId),
      stage: form.stage,
      proposedPrice: Number(form.proposedPrice),
      expectedClose: form.expectedClose,
    });
    onHide();
    setForm({
      watchId: "",
      contactId: "",
      stage: "prospect",
      proposedPrice: "",
      expectedClose: "",
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Deal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Watch *</Form.Label>
                <Form.Select
                  name="watchId"
                  value={form.watchId}
                  onChange={onChange}
                  required
                >
                  <option value="">Select from inventory</option>
                  {availableWatches.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.brand} {w.model} — {w.reference}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Contact *</Form.Label>
                <Form.Select
                  name="contactId"
                  value={form.contactId}
                  onChange={onChange}
                  required
                >
                  <option value="">Select contact</option>
                  {state.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Stage *</Form.Label>
                <Form.Select
                  name="stage"
                  value={form.stage}
                  onChange={onChange}
                  required
                >
                  <option value="prospect">Prospect</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closing">Closing</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Proposed Price *</Form.Label>
                <Form.Control
                  type="number"
                  name="proposedPrice"
                  value={form.proposedPrice}
                  onChange={onChange}
                  min={0}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Expected Close Date</Form.Label>
                <Form.Control
                  type="date"
                  name="expectedClose"
                  value={form.expectedClose}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Stack
            direction="horizontal"
            gap={2}
            className="text-success fw-semibold"
          >
            <span>Potential Profit:</span>
            <span>${potentialProfit.toLocaleString()}</span>
          </Stack>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button type="submit">Create Deal</Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
