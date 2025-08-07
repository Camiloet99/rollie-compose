import { useEffect, useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { getSearchHistory, clearSearchHistory } from "../utils/history";

export default function SearchHistory({
  onSearchRepeat,
  refreshToggle,
  onClear,
  searchHistoryLimit = 10,
}) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, [refreshToggle]);

  const handleClear = () => {
    clearSearchHistory();
    setHistory([]);
    onClear();
  };

  if (history.length === 0) return null;

  return (
    <Card className="p-3 mt-4 shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Search History</h5>
        <Button variant="outline-danger" size="sm" onClick={handleClear}>
          Clear History
        </Button>
      </div>

      {/* ✅ Mostrar advertencia si alcanzó el límite */}
      {history.length >= searchHistoryLimit && (
        <Alert variant="info" className="small py-2 px-3 mb-3">
          You’ve reached your search history limit.{" "}
          <strong>Upgrade your plan</strong> to keep more searches!
        </Alert>
      )}

      {history.map((entry, idx) => (
        <div key={idx} className="border-bottom py-2 small">
          <div>
            <strong>{entry.reference || "Unknown Reference"}</strong>{" "}
            <span className="text-muted">
              ({new Date(entry.timestamp).toLocaleString()})
            </span>
          </div>
          <div className="text-muted">
            {entry.brand && `Brand: ${entry.brand}, `}
            {entry.condition && `Condition: ${entry.condition}, `}
            {entry.color && `Color: ${entry.color}, `}
            {entry.material && `Material: ${entry.material}`}
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            className="mt-1"
            onClick={() => onSearchRepeat(entry)}
          >
            Repeat Search
          </Button>
        </div>
      ))}
    </Card>
  );
}
