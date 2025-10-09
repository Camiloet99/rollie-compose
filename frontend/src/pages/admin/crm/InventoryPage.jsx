import { useMemo, useState } from "react";
import { useCrm } from "./CrmProvider";

export default function InventoryPage() {
  const { state } = useCrm();
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return state.inventory.filter((w) => {
      const byStatus = status === "all" ? true : w.status === status;
      const haystack =
        `${w.id} ${w.serialNumber} ${w.brand} ${w.model} ${w.reference}`.toLowerCase();
      const byQuery = haystack.includes(q.toLowerCase());
      return byStatus && byQuery;
    });
  }, [state.inventory, status, q]);

  return (
    <>
      <div className="action-bar">
        <div className="action-group">
          <button
            className="btn btn-primary"
            onClick={() => alert("Add Watch form")}
          >
            ➕ Add Watch
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => alert("Import CSV")}
          >
            📤 Import CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => alert("Export CSV")}
          >
            💾 Export
          </button>
        </div>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search inventory..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <span className="table-title">Current Inventory</span>
          <div className="table-actions">
            <select
              className="filter-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Serial Number</th>
              <th>Brand</th>
              <th>Model</th>
              <th>Reference</th>
              <th>Year</th>
              <th>Purchase Date</th>
              <th>Cost</th>
              <th>Retail Price</th>
              <th>Days</th>
              <th>Status</th>
              <th>Actions</th>
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
                <td>
                  <span className={`status-badge status-${w.status}`}>
                    {w.status}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => alert("View watch")}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  style={{ padding: 16, color: "var(--gray-500)" }}
                >
                  No results
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
