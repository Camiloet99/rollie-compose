import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Row, Col, Badge, Stack } from "react-bootstrap";
import { useCrm } from "./CrmProvider";

export default function DealViewModal({ show, onHide, dealId }) {
  const { state, actions } = useCrm();
  const [form, setForm] = useState(null);

  const availableWatches = useMemo(
    () =>
      state.inventory.filter(
        (w) => w.status === "available" || w.id === form?.watchId
      ),
    // incluye el reloj actual aunque esté vendido, para no desaparecerlo
    [state.inventory, form?.watchId]
  );

  useEffect(() => {
    if (show && dealId) {
      const d = state.deals.find((x) => x.id === dealId);
      if (d) setForm({ ...d });
    }
  }, [show, dealId, state.deals]);

  if (!form) return null;

  const watch = state.inventory.find((w) => w.id === form.watchId);
  const contact = state.contacts.find((c) => c.id === Number(form.contactId));
  const profit = watch
    ? Number(form.proposedPrice || 0) - (watch.cost || 0)
    : 0;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]:
        name === "proposedPrice"
          ? Number(value)
          : name === "contactId"
          ? Number(value)
          : value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    actions.updateDeal(form);
    onHide();
  };

  const stageBadge =
    form.stage === "closing" ? (
      <Badge bg="primary">closing</Badge>
    ) : form.stage === "negotiation" ? (
      <Badge bg="info" text="dark">
        negotiation
      </Badge>
    ) : form.stage === "qualified" ? (
      <Badge bg="warning" text="dark">
        qualified
      </Badge>
    ) : form.stage === "prospect" ? (
      <Badge bg="secondary">prospect</Badge>
    ) : (
      <Badge bg="success">closed-won</Badge>
    );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            Deal #{form.id} {stageBadge}
            <div className="small text-muted">
              {new Date(form.createdDate).toLocaleString()}
            </div>
          </Modal.Title>
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
                  {state.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Stage *</Form.Label>
                <Form.Select
                  name="stage"
                  value={form.stage}
                  onChange={onChange}
                >
                  <option value="prospect">Prospect</option>
                  <option value="qualified">Qualified</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="closing">Closing</option>
                  <option value="closed-won">Closed Won</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Proposed Price *</Form.Label>
                <Form.Control
                  type="number"
                  name="proposedPrice"
                  value={form.proposedPrice || 0}
                  onChange={onChange}
                  min={0}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Expected Close Date</Form.Label>
                <Form.Control
                  type="date"
                  name="expectedClose"
                  value={form.expectedClose || ""}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>

            {watch && (
              <Col xs={12}>
                <Stack
                  direction="horizontal"
                  gap={3}
                  className="small text-muted"
                >
                  <div>
                    <strong>Watch Cost:</strong> ${watch.cost.toLocaleString()}
                  </div>
                  <div>
                    <strong>Potential Profit:</strong>{" "}
                    <span
                      className={profit >= 0 ? "text-success" : "text-danger"}
                    >
                      ${profit.toLocaleString()}
                    </span>
                  </div>
                  {contact && (
                    <div>
                      <strong>Contact:</strong> {contact.firstName}{" "}
                      {contact.lastName}
                    </div>
                  )}
                </Stack>
              </Col>
            )}
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
