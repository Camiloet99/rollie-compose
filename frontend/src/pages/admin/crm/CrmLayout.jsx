import { useState } from "react";
import "./crm.css";
import CrmNavTabs from "./CrmNavTabs";
import SalesDashboard from "./SalesDashboard";
import InventoryPage from "./InventoryPage";
import ContactsPage from "./ContactsPage";

export default function CrmLayout() {
  const [tab, setTab] = useState("sales"); // "sales" | "inventory" | "contacts"

  return (
    <div className="crm-root">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">⌚</div>
            <div className="logo-text">
              <h1>Watch Dealer Pro</h1>
            </div>
          </div>
          <div className="sync-status">
            <div className="sync-indicator" />
            <span>AWS S3 Connected</span>
            <span style={{ opacity: 0.7, fontSize: 12 }}>Auto-sync: ON</span>
          </div>
        </div>
      </header>

      <CrmNavTabs tab={tab} onChange={setTab} />

      <div className="content-container">
        {tab === "sales" && <SalesDashboard />}
        {tab === "inventory" && <InventoryPage />}
        {tab === "contacts" && <ContactsPage />}
      </div>
    </div>
  );
}
