export default function Table({ head, children, title, right }) {
  return (
    <div className="table-container">
      <div className="table-header">
        <span className="table-title">{title}</span>
        <div className="table-actions">{right}</div>
      </div>
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
