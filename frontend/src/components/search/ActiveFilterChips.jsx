import { Button } from "react-bootstrap";

// Capitalizado “suave” para textos que puedan venir en mayúsculas
const capitalizeSmart = (text = "") =>
  text
    .split(",")
    .map((w) => {
      const t = w.trim();
      return t === t.toUpperCase()
        ? t
        : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    })
    .join(", ");

// Etiquetas bonitas
const labelOf = (key) => {
  const map = {
    brand: "Brand",
    estado: "Status",
    color: "Bracelet / Color",
    condition: "Condition",
    year: "Production Year",
    currency: "Currency",
    window: "Data from",
  };
  return map[key] || key;
};

// Texto amigable para “window”
const prettyWindow = (val = "") => {
  const v = String(val).toLowerCase().trim();
  if (v === "today") return "Today";
  if (v === "7d") return "Last 7 days";
  if (v === "15d") return "Last 15 days";
  return "";
};

export default function ActiveFilterChips({ filters, setFilters }) {
  // Construimos chips manualmente para controlar cómo se limpian
  const chips = [];

  // Brand
  if (filters.brand?.trim()) {
    chips.push({
      key: "brand",
      label: labelOf("brand"),
      value: capitalizeSmart(filters.brand),
      onClear: () => setFilters((p) => ({ ...p, brand: "" })),
    });
  }

  // Status (estado)
  if (filters.estado?.trim()) {
    chips.push({
      key: "estado",
      label: labelOf("estado"),
      value: capitalizeSmart(filters.estado),
      onClear: () => setFilters((p) => ({ ...p, estado: "" })),
    });
  }

  // Bracelet / Color (color)
  if (filters.color?.trim()) {
    chips.push({
      key: "color",
      label: labelOf("color"),
      value: capitalizeSmart(filters.color),
      onClear: () => setFilters((p) => ({ ...p, color: "" })),
    });
  }

  // Condition
  if (filters.condition?.trim()) {
    chips.push({
      key: "condition",
      label: labelOf("condition"),
      value: capitalizeSmart(filters.condition),
      onClear: () => setFilters((p) => ({ ...p, condition: "" })),
    });
  }

  // Year
  if (String(filters.year || "").trim()) {
    chips.push({
      key: "year",
      label: labelOf("year"),
      value: String(filters.year),
      onClear: () => setFilters((p) => ({ ...p, year: "" })),
    });
  }

  // Price (min/max) → un solo chip
  const hasMin = String(filters.priceMin || "").trim() !== "";
  const hasMax = String(filters.priceMax || "").trim() !== "";
  if (hasMin || hasMax) {
    const minTxt = hasMin ? Number(filters.priceMin) : null;
    const maxTxt = hasMax ? Number(filters.priceMax) : null;
    const rangeTxt =
      minTxt !== null && maxTxt !== null
        ? `${minTxt} – ${maxTxt}`
        : minTxt !== null
        ? `≥ ${minTxt}`
        : `≤ ${maxTxt}`;

    chips.push({
      key: "price",
      label: "Price",
      value: rangeTxt,
      onClear: () => setFilters((p) => ({ ...p, priceMin: "", priceMax: "" })),
    });
  }

  // Currency (solo si no lo mostramos dentro de Price)
  if (filters.currency?.trim()) {
    chips.push({
      key: "currency",
      label: labelOf("currency"),
      value: String(filters.currency).toUpperCase(),
      onClear: () => setFilters((p) => ({ ...p, currency: "" })),
    });
  }

  // Data window
  const win = prettyWindow(filters.window);
  if (win) {
    chips.push({
      key: "window",
      label: labelOf("window"),
      value: win,
      onClear: () => setFilters((p) => ({ ...p, window: "" })),
    });
  }

  // Sort (opcional: solo mostramos si existe y no es el default)
  if (filters.sort && filters.sort !== "date_desc") {
    const prettySort = (() => {
      switch (filters.sort) {
        case "price_asc":
          return "Price ↑";
        case "price_desc":
          return "Price ↓";
        case "year_asc":
          return "Year ↑";
        case "year_desc":
          return "Year ↓";
        case "date_asc":
          return "Date ↑";
        case "date_desc":
          return "Date ↓";
        default:
          return filters.sort;
      }
    })();

    chips.push({
      key: "sort",
      label: "Sort",
      value: prettySort,
      onClear: () => setFilters((p) => ({ ...p, sort: "" })),
    });
  }

  if (!chips.length) return null;

  const clearAll = () =>
    setFilters((prev) => {
      const next = { ...prev };
      // limpiamos todo excepto `reference` y `adv`
      delete next.reference; // opcional: puedes mantenerlo si prefieres
      next.reference = prev.reference; // conservar referencia escrita
      next.adv = prev.adv; // conservar flag del panel avanzado

      next.brand = "";
      next.estado = "";
      next.color = "";
      next.condition = "";
      next.year = "";
      next.priceMin = "";
      next.priceMax = "";
      next.currency = "";
      next.window = "";
      next.sort = "";
      return next;
    });

  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      {chips.map((chip) => (
        <span key={chip.key} className="badge bg-light text-dark border">
          <strong className="text-muted me-1">{chip.label}:</strong>{" "}
          {chip.value}
          <button
            className="btn btn-sm btn-link ms-2 p-0"
            onClick={chip.onClear}
            aria-label={`Remove filter ${chip.key}`}
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
