import { useMemo, useState } from "react";
import { useCrm } from "./CrmProvider";
import DealModal from "./DealModal";
import { Badge, Button } from "react-bootstrap";

function stageClass(stage) {
  return stage === "closed-won" ? "status-available" : "status-pending";
}

export default function SalesDashboard() {
  const { state, selectors, actions } = useCrm();
  const [showDeal, setShowDeal] = useState(false);

  const pipeline = selectors.getPipelineStats();
  const totalPipeline = useMemo(
    () =>
      ["prospect", "qualified", "negotiation", "closing"].reduce(
        (s, k) => s + pipeline[k].value,
        0
      ),
    [pipeline]
  );
  const deals = selectors.getDealsList(state.currentStageFilter);

  return (
    <>
      <div className="dashboard-header">
        <h2 className="dashboard-title">Sales Pipeline</h2>
        <div className="date-filter">
          <select className="filter-select" defaultValue="This Month">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowDeal(true)}
          >
            + New Deal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Pipeline Value</span>
            <div className="stat-icon">💎</div>
          </div>
          <div className="stat-value">${totalPipeline.toLocaleString()}</div>
          <div className="stat-change positive">
            <span>{state.deals.length} active deals</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Closed This Month</span>
            <div className="stat-icon">✅</div>
          </div>
          <div className="stat-value">
            ${pipeline["closed-won"].value.toLocaleString()}
          </div>
          <div className="stat-change positive">
            <span>{pipeline["closed-won"].count} deals closed</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Average Deal Size</span>
            <div className="stat-icon">📊</div>
          </div>
          <div className="stat-value">
            $
            {state.deals.length
              ? Math.round(totalPipeline / state.deals.length).toLocaleString()
              : 0}
          </div>
          <div className="stat-change">
            <span>Based on active deals</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Win Rate</span>
            <div className="stat-icon">🎯</div>
          </div>
          <div className="stat-value">
            {(() => {
              const closed = pipeline["closed-won"].count;
              const denom = state.deals.length + closed;
              return denom ? Math.round((closed / denom) * 100) : 0;
            })()}
            %
          </div>
          <div className="stat-change positive">
            <span>Last 30 days</span>
          </div>
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="pipeline-container">
        <div className="pipeline-header">
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Pipeline Stages</h3>
          <span style={{ fontSize: 13, color: "var(--gray-500)" }}>
            Click stage to filter deals
          </span>
        </div>

        <div className="pipeline-stages">
          {[
            "prospect",
            "qualified",
            "negotiation",
            "closing",
            "closed-won",
          ].map((stage) => (
            <div
              key={stage}
              className={`stage-card ${
                stage === "closed-won" ? "closed-won" : ""
              } ${state.currentStageFilter === stage ? "active" : ""}`}
              onClick={() => actions.setStageFilter(stage)}
            >
              <div className="stage-header">
                <span className="stage-name">
                  {stage
                    .replace("-", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
                <span className="stage-count">{pipeline[stage].count}</span>
              </div>
              <div className="stage-value">
                ${pipeline[stage].value.toLocaleString()}
              </div>
              <div className="stage-deals">{pipeline[stage].count} deals</div>
            </div>
          ))}
        </div>
      </div>

      {/* Deals Table */}
      <div className="table-container">
        <div className="table-header">
          <span className="table-title">
            {state.currentStageFilter
              ? `${state.currentStageFilter} Deals`
              : "All Deals"}
          </span>
          <div className="table-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => actions.setStageFilter(null)}
            >
              Clear Filter
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => alert("Export sales data to CSV")}
            >
              Export
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Stage</th>
              <th>Watch</th>
              <th>Reference</th>
              <th>Contact</th>
              <th>Cost</th>
              <th>Proposed Price</th>
              <th>Expected Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const watch = state.inventory.find((w) => w.id === deal.watchId);
              const contact = state.contacts.find(
                (c) => c.id === deal.contactId
              );
              if (!watch) return null;
              const price = deal.proposedPrice || deal.salePrice || 0;
              const profit = price - (watch.cost || 0);
              return (
                <tr key={deal.id}>
                  <td>
                    {new Date(
                      deal.createdDate || deal.saleDate
                    ).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge ${stageClass(deal.stage)}`}>
                      {deal.stage.replace("-", " ")}
                    </span>
                  </td>
                  <td>
                    {watch.brand} {watch.model}
                  </td>
                  <td>{watch.reference}</td>
                  <td>
                    {contact
                      ? `${contact.firstName} ${contact.lastName}`
                      : "Unknown"}
                  </td>
                  <td>${watch.cost.toLocaleString()}</td>
                  <td>${price.toLocaleString()}</td>
                  <td
                    style={{
                      color: profit >= 0 ? "var(--success)" : "var(--danger)",
                    }}
                  >
                    ${profit.toLocaleString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => alert("Deal detail modal")}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showDeal && <DealModal onClose={() => setShowDeal(false)} />}
    </>
  );
}
