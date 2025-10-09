import { useMemo, useState } from "react";
import { useCrm } from "./CrmProvider";

export default function ContactsPage() {
  const { state } = useCrm();
  const [type, setType] = useState("all");
  const [view, setView] = useState("grid");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return state.contacts.filter((c) => {
      const byType = type === "all" ? true : c.type === type;
      const haystack =
        `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.city} ${c.state}`.toLowerCase();
      const byQuery = haystack.includes(q.toLowerCase());
      return byType && byQuery;
    });
  }, [state.contacts, type, q]);

  return (
    <>
      <div className="contacts-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h2 className="contacts-title">Contacts</h2>
          <span className="contacts-count">{filtered.length} Total</span>
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${view === "grid" ? "active" : ""}`}
            onClick={() => setView("grid")}
          >
            □□ Grid
          </button>
          <button
            className={`view-btn ${view === "list" ? "active" : ""}`}
            onClick={() => setView("list")}
          >
            ☰ List
          </button>
        </div>
      </div>

      <div className="action-bar">
        <div className="action-group">
          <button
            className="btn btn-primary"
            onClick={() => alert("New contact modal")}
          >
            ➕ Add Contact
          </button>
          <select
            className="filter-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="dealer">Dealers</option>
          </select>
        </div>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search contacts..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {view === "grid" ? (
        <div className="contacts-grid">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="contact-card"
              onClick={() => alert("Contact detail")}
            >
              <div className="contact-header">
                <div className="contact-info">
                  <div className="contact-name">
                    {c.firstName} {c.lastName}
                  </div>
                  <div className="contact-company">
                    {c.city}, {c.state}
                  </div>
                </div>
                <span className={`contact-type ${c.type}`}>{c.type}</span>
              </div>
              <div className="contact-stats">
                <div className="contact-stat">
                  <div className="contact-stat-value">
                    ${(c.totalPurchases || 0).toLocaleString()}
                  </div>
                  <div className="contact-stat-label">
                    Total Retail Purchases
                  </div>
                </div>
                <div className="contact-stat">
                  <div className="contact-stat-value">
                    {c.transactions || 0}
                  </div>
                  <div className="contact-stat-label">Transactions</div>
                </div>
              </div>
              <div className="contact-details">
                <div className="contact-detail">📧 {c.email}</div>
                <div className="contact-detail">📱 {c.phone}</div>
                <div className="contact-detail">📍 {c.address}</div>
                <div className="contact-detail">
                  🎂{" "}
                  {c.dob
                    ? new Date(c.dob).toLocaleDateString()
                    : "Not provided"}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ color: "var(--gray-500)" }}>No contacts</div>
          )}
        </div>
      ) : (
        <div className="contacts-list active">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Total Purchases</th>
                  <th>Last Transaction</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      {c.firstName} {c.lastName}
                    </td>
                    <td>
                      <span className={`contact-type ${c.type}`}>{c.type}</span>
                    </td>
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
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => alert("Contact detail")}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: 16, color: "var(--gray-500)" }}
                    >
                      No results
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
