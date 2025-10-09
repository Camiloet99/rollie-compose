import { useState, useMemo } from "react";
import { useCrm } from "./CrmProvider";

export default function DealModal({ onClose }) {
  const { state, actions } = useCrm();
  const availableWatches = useMemo(
    () => state.inventory.filter((w) => w.status === "available"),
    [state.inventory]
  );

  const [form, setForm] = useState({
    watchId: "",
    contactId: "",
    stage: "prospect",
    proposedPrice: "",
    expectedClose: "",
  });

  const watch = state.inventory.find((w) => w.id === form.watchId);
  const potentialProfit = watch
    ? Number(form.proposedPrice || 0) - (watch.cost || 0)
    : 0;

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.watchId || !form.contactId || !form.proposedPrice)
      return alert("Please fill in required fields");
    actions.saveDeal({
      watchId: form.watchId,
      contactId: Number(form.contactId),
      stage: form.stage,
      proposedPrice: Number(form.proposedPrice),
      expectedClose: form.expectedClose,
    });
    onClose();
  };

  return (
    <div className="modal active">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Create New Deal</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="form-section">
            <h4 className="section-title">Deal Information</h4>
            <form onSubmit={onSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Watch *</label>
                  <select
                    className="form-select"
                    name="watchId"
                    value={form.watchId}
                    onChange={onChange}
                  >
                    <option value="">Select from inventory</option>
                    {availableWatches.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.brand} {w.model} - {w.reference}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact *</label>
                  <select
                    className="form-select"
                    name="contactId"
                    value={form.contactId}
                    onChange={onChange}
                  >
                    <option value="">Select contact</option>
                    {state.contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Stage *</label>
                  <select
                    className="form-select"
                    name="stage"
                    value={form.stage}
                    onChange={onChange}
                  >
                    <option value="prospect">Prospect</option>
                    <option value="qualified">Qualified</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closing">Closing</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Proposed Price *</label>
                  <input
                    className="form-input"
                    type="number"
                    name="proposedPrice"
                    value={form.proposedPrice}
                    onChange={onChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Close Date</label>
                  <input
                    className="form-input"
                    type="date"
                    name="expectedClose"
                    value={form.expectedClose}
                    onChange={onChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <div>
                  <span
                    id="dealProfit"
                    style={{ color: "var(--success)", fontWeight: 600 }}
                  >
                    Potential Profit: ${potentialProfit.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Deal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
