export default function CrmNavTabs({ tab, onChange }) {
  const Btn = ({ id, icon, label }) => (
    <div
      className={`nav-tab ${tab === id ? "active" : ""}`}
      onClick={() => onChange(id)}
      role="button"
    >
      <span className="nav-tab-icon">{icon}</span>
      <span className="nav-tab-label">{label}</span>
    </div>
  );

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Btn id="sales" icon="💰" label="Sales" />
        <Btn id="inventory" icon="📦" label="Inventory" />
        <Btn id="contacts" icon="👥" label="Contacts" />
      </div>
    </nav>
  );
}
