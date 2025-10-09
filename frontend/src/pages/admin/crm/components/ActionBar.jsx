export default function ActionBar({ left, right }) {
  return (
    <div className="action-bar">
      <div className="action-group">{left}</div>
      <div className="search-box">{right}</div>
    </div>
  );
}
