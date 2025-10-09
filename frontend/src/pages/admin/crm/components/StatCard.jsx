export default function StatCard({ label, icon, value, hint, positive }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className={`stat-change ${positive ? "positive" : ""}`}>{hint}</div>
    </div>
  );
}
