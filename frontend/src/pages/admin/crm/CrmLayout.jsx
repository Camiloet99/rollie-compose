import { Card, Container, Nav, Stack } from "react-bootstrap";
import "./crm.css";
import SalesDashboard from "./SalesDashboard";
import InventoryPage from "./InventoryPage";
import ContactsPage from "./ContactsPage";
import { useState } from "react";

export default function CrmLayout() {
  const [tab, setTab] = useState("sales");

  return (
    <div className="crm-root">
      <Card className="bg-dark text-white rounded-0">
        <Card.Body>
          <Container className="d-flex align-items-center justify-content-between">
            <Stack direction="horizontal" gap={3}>
              <div className="crm-logo d-inline-flex align-items-center justify-content-center">
                ⌚
              </div>
              <div>
                <h5 className="mb-0 fw-bold">Watch Dealer Pro</h5>
                <small className="text-white-50">
                  Complete Management System
                </small>
              </div>
            </Stack>
            <Stack direction="horizontal" gap={2} className="text-white-50">
              <span className="crm-dot bg-success" />
              <small>AWS S3 Connected · Auto-sync ON</small>
            </Stack>
          </Container>
        </Card.Body>
        <Nav
          variant="tabs"
          className="bg-light ps-3"
          activeKey={tab}
          onSelect={(k) => setTab(k || "sales")}
        >
          <Nav.Item>
            <Nav.Link eventKey="sales">💰 Sales</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="inventory">📦 Inventory</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="contacts">👥 Contacts</Nav.Link>
          </Nav.Item>
        </Nav>
      </Card>

      <Container className="py-4">
        {tab === "sales" && <SalesDashboard />}
        {tab === "inventory" && <InventoryPage />}
        {tab === "contacts" && <ContactsPage />}
      </Container>
    </div>
  );
}
