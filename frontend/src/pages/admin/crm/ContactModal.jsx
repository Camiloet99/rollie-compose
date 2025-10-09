import { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useCrm } from "../CrmProvider";

export default function ContactModal({ show, onHide }) {
  const { actions } = useCrm();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dob: "",
    type: "buyer",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    notes: "",
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.phone || !form.email) return;
    actions.saveContact(form);
    onHide();
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      dob: "",
      type: "buyer",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "United States",
      notes: "",
    });
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered scrollable>
      <Form onSubmit={onSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>First Name *</Form.Label>
                <Form.Control
                  name="firstName"
                  value={form.firstName}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Last Name *</Form.Label>
                <Form.Control
                  name="lastName"
                  value={form.lastName}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Phone *</Form.Label>
                <Form.Control
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Contact Type</Form.Label>
                <Form.Select name="type" value={form.type} onChange={onChange}>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="dealer">Dealer</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <hr className="text-muted" />
            </Col>

            <Col md={12}>
              <Form.Group>
                <Form.Label>Street Address</Form.Label>
                <Form.Control
                  name="address"
                  value={form.address}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>City</Form.Label>
                <Form.Control
                  name="city"
                  value={form.city}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>State/Province</Form.Label>
                <Form.Control
                  name="state"
                  value={form.state}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>ZIP/Postal Code</Form.Label>
                <Form.Control name="zip" value={form.zip} onChange={onChange} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Country</Form.Label>
                <Form.Control
                  name="country"
                  value={form.country}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={form.notes}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit">Save Contact</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
