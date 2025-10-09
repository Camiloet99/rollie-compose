export default function StageCard({
  title,
  count,
  value,
  active,
  won,
  onClick,
}) {
  return (
    <div
      className={`stage-card ${won ? "closed-won" : ""} ${
        active ? "active" : ""
      }`}
      onClick={onClick}
    >
      <div className="stage-header">
        <span className="stage-name">{title}</span>
        <span className="stage-count">{count}</span>
      </div>
      <div className="stage-value">${value.toLocaleString()}</div>
      <div className="stage-deals">{count} deals</div>
    </div>
  );
}
