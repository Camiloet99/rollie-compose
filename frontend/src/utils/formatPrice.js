// Siempre muestra $ y jamás decimales

export function formatPrice(amount, _currency, { locale } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";

  // redondea para evitar decimales
  const rounded = Math.round(n);

  // soporta negativos con prefijo "-$1,234"
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(abs);

  return `${sign}$${formatted}`;
}

// Si te hace falta en algún lado solo el número (sin $)
export function formatNumber(amount, { locale } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "—";
  const rounded = Math.round(n);
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(rounded);
}
