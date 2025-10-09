import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  InputGroup,
  Row,
  Table,
} from "react-bootstrap";
import { useCrm } from "./CrmProvider";
import ContactModal from "./ContactModal";

export default function ContactsPage() {
  const { state } = useCrm();
  const [view, setView] = useState("grid");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");
  const [showContact, setShowContact] = useState(false);

  const filtered = useMemo(
    () =>
      state.contacts.filter((c) => {
        const byType = type === "all" ? true : c.type === type;
        const hay =
          `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.city} ${c.state}`.toLowerCase();
        return byType && hay.includes(q.toLowerCase());
      }),
    [state.contacts, type, q]
  );

  const typeBadge = (t) =>
    t === "buyer" ? (
      <Badge bg="success">buyer</Badge>
    ) : t === "seller" ? (
      <Badge bg="danger">seller</Badge>
    ) : (
      <Badge bg="primary">dealer</Badge>
    );

  return (
    <>
      <Row className="align-items-center mb-3">
        <Col xs="auto">
          <h4 className="mb-0 fw-bold">Contacts</h4>
        </Col>
        <Col xs="auto">
          <Badge bg="dark">{filtered.length} Total</Badge>
        </Col>
        <Col className="ms-auto" md={6}>
          <InputGroup>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search contacts..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Form.Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ maxWidth: 160 }}
            >
              <option value="all">All Types</option>
              <option value="buyer">Buyers</option>
              <option value="seller">Sellers</option>
              <option value="dealer">Dealers</option>
            </Form.Select>
            <Button onClick={() => setShowContact(true)}>+ Add</Button>
          </InputGroup>
        </Col>
        <Col xs="auto">
          <ButtonGroup>
            <Button
              variant={view === "grid" ? "dark" : "outline-dark"}
              onClick={() => setView("grid")}
            >
              Grid
            </Button>
            <Button
              variant={view === "list" ? "dark" : "outline-dark"}
              onClick={() => setView("list")}
            >
              List
            </Button>
          </ButtonGroup>
        </Col>
      </Row>

      {view === "grid" ? (
        <Row xs={1} md={2} lg={3} className="g-3">
          {filtered.map((c) => (
            <Col key={c.id}>
              <Card
                className="shadow-sm h-100"
                role="button"
                onClick={() => alert("Contact detail")}
              >
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="fw-semibold">
                        {c.firstName} {c.lastName}
                      </div>
                      <small className="text-muted">
                        {c.city}, {c.state}
                      </small>
                    </div>
                    {typeBadge(c.type)}
                  </div>
                  <Row xs={2} className="g-2 my-2">
                    <Col>
                      <div className="h6 mb-0">
                        ${(c.totalPurchases || 0).toLocaleString()}
                      </div>
                      <small className="text-muted">Total Purchases</small>
                    </Col>
                    <Col>
                      <div className="h6 mb-0">{c.transactions || 0}</div>
                      <small className="text-muted">Transactions</small>
                    </Col>
                  </Row>
                  <div className="small text-muted">
                    📧 {c.email}
                    <br />
                    📱 {c.phone}
                    <br />
                    📍 {c.address}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
          {filtered.length === 0 && (
            <Col>
              <Card body className="text-center text-muted">
                No contacts
              </Card>
            </Col>
          )}
        </Row>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover bordered className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Total Purchases</th>
                    <th>Last Transaction</th>
                    <th style={{ width: 110 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.firstName} {c.lastName}
                      </td>
                      <td>{typeBadge(c.type)}</td>
                      <td>{c.phone}</td>
                      <td>{c.email}</td>
                      <td>
                        {c.address}, {c.city}, {c.state} {c.zip}
                      </td>
                      <td>${(c.totalPurchases || 0).toLocaleString()}</td>
                      <td>
                        {c.lastTransaction
                          ? new Date(c.lastTransaction).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => alert("Contact detail")}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-muted py-4">
                        No results
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
      <ContactModal show={showContact} onHide={() => setShowContact(false)} />
    </>
  );
}
