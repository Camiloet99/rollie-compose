import { Button } from "react-bootstrap";

export default function ActiveFilterChips({ filters, setFilters }) {
  const entries = Object.entries(filters).filter(([k, v]) => {
    if (k === "adv" || k === "reference") return false; // excluye estos
    const s = String(v ?? "").trim();
    return s !== "";
  });

  if (!entries.length) return null;

  const clearOne = (key) => setFilters((prev) => ({ ...prev, [key]: "" }));

  const clearAll = () =>
    setFilters((prev) => {
      const next = { ...prev };
      for (const [k] of entries) next[k] = "";
      return next;
    });

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {entries.map(([k, v]) => (
        <span key={k} className="badge bg-light text-dark border">
          <strong className="text-muted me-1">{labelOf(k)}:</strong> {String(v)}
          <button
            className="btn btn-sm btn-link ms-2 p-0"
            onClick={() => clearOne(k)}
            aria-label={`Remove filter ${k}`}
          >
            ×
          </button>
        </span>
      ))}
      <Button size="sm" variant="outline-secondary" onClick={clearAll}>
        Clear all
      </Button>
    </div>
  );
}

// Pequeño mapeo de etiquetas “bonitas”
function labelOf(key) {
  const map = {
    condition: "Condition",
    color: "Color",
    material: "Material",
    year: "Production Year",
    priceMin: "Min Price",
    priceMax: "Max Price",
    currency: "Currency",
    extraInfo: "Extra Info",
    brand: "Brand",
  };
  return map[key] || key;
}
