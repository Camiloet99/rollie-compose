// src/services/watchService.js
import api from "./api";

/** ===== Helpers ===== */
function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}

function normalizeWindow(w) {
  const s = safeTrim(w).toLowerCase();
  return s === "today" || s === "7d" || s === "15d" ? s : "";
}

function normalizeSort(s) {
  const v = safeTrim(s).toLowerCase();
  if (
    ["price_asc", "price_desc", "brand_asc", "brand_desc", "date_asc", "date_desc"].includes(v)
  ) return v;
  return "date_desc";
}

// Si quieres mapear “today/7d/15d” a asOfFrom/asOfTo cuando NO es average:
function windowToRange(w) {
  if (!w) return {};
  const now = new Date();
  const to = fmt(now);
  let from = to;
  if (w === "7d") from = fmt(addDays(now, -6));
  else if (w === "15d") from = fmt(addDays(now, -14));
  return { asOfFrom: from, asOfTo: to };
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function fmt(d) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Backend ahora puede devolver:
 * - { result: [...] }
 * - { result: { items: [...] } } (legacy)
 * - o algo raro -> []
 */
function extractArrayResult(resData) {
  const r = resData?.result ?? resData;
  if (Array.isArray(r)) return r;
  if (r?.items && Array.isArray(r.items)) return r.items;
  return [];
}

/** Crea una estructura compatible con tu UI anterior, pero sin paginar desde backend */
function toLocalPageResult(items, page = 0, size = 20) {
  const total = Array.isArray(items) ? items.length : 0;
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  return {
    items: items || [], // <- lista completa (sin paginar)
    total,
    page,
    size,
    pages,
    hasNext: page < pages - 1,
    hasPrev: page > 0,
  };
}

/** =========================
 *  1) Búsqueda simple por modelo exacto
 *  ========================= */
export const getWatchByReference = async (
  reference,
  _userId,
  page = 0,
  size = 20,
  sort = "date_desc"
) => {
  const modelo = safeTrim(reference);
  if (!modelo) return toLocalPageResult([], page, size);

  try {
    // ⬇️ ya NO mandamos page/size al backend
    const params = { sort: normalizeSort(sort) };
    const body = { modelo };

    const res = await api.post(`/watches/query`, body, { params });

    const items = extractArrayResult(res.data);
    return toLocalPageResult(items, page, size);
  } catch (err) {
    console.error("Error getting watch by reference:", err);
    throw err?.response ?? err;
  }
};

/** =========================
 *  2) Búsqueda avanzada
 *  ========================= */
export const searchWatches = async (
  payload,
  _userId,
  window = "",
  page = 0,
  size = 20,
  sort = "date_desc",
  avgMode = ""
) => {
  try {
    const win = normalizeWindow(window); // "", "today", "7d", "15d"
    const isAverage = Boolean(win);

    const bodyBase = {
      modelo: safeTrim(payload?.referenceCode ?? payload?.modelo) || null,
      brand: safeTrim(payload?.brand) || null,
      bracelet: safeTrim(payload?.bracelet) || null,
      estado: safeTrim(payload?.estado) || null,

      color: safeTrim(payload?.colorDial ?? payload?.color) || null,
      anio: payload?.productionYear ?? payload?.year ?? payload?.anio ?? null,
      condicion: safeTrim(payload?.condition ?? payload?.condicion) || null,

      priceMin: payload?.minPrice ?? payload?.priceMin ?? null,
      priceMax: payload?.maxPrice ?? payload?.priceMax ?? null,
      currency: safeTrim(payload?.currency) || null,

      text: safeTrim(payload?.text) || null,
      info:
        safeTrim(payload?.watchInfo ?? payload?.extraInfo ?? payload?.info) ||
        null,
    };

    const range = isAverage ? {} : windowToRange(win);
    const body = { ...bodyBase, ...range };

    // ⬇️ params ahora sin page/size
    const params = { sort: normalizeSort(sort) };

    if (isAverage) {
      if (!bodyBase.modelo && !bodyBase.brand) {
        throw {
          response: {
            data: { error: "Average requires at least brand or modelo" },
            status: 400,
          },
        };
      }
      params.window = win;
      if (avgMode) params.avgMode = safeTrim(avgMode);
    }

    const res = await api.post(`/watches/query`, body, { params });

    const items = extractArrayResult(res.data);
    return toLocalPageResult(items, page, size);
  } catch (err) {
    console.error("Error searching watches:", err);
    throw err?.response ?? err;
  }
};

/** === 3) POST: múltiples referencias === */
export const getWatchesByReferences = async (references) => {
  try {
    const res = await api.post("/watches/by-references", { references });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error fetching watches by references:", err);
    throw err?.response ?? err;
  }
};

/** === 4) GET: rango de precios === */
export const getWatchesByPriceRange = async (min, max) => {
  try {
    const res = await api.get("/watches/price-range", { params: { min, max } });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error getting watches by price range:", err);
    throw err?.response ?? err;
  }
};

/** === 5) GET: historial de precios === */
export const getPriceHistory = async (reference) => {
  try {
    const res = await api.get("/watches/price-history", {
      params: { reference },
    });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error getting price history:", err);
    throw err?.response ?? err;
  }
};

/** === 6) GET: autocomplete de referencias === */
export const autocompleteReference = async (prefix) => {
  try {
    const res = await api.get("/watches/autocomplete", {
      params: { prefix },
    });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error with autocomplete:", err);
    throw err?.response ?? err;
  }
};

export const getWatchSummaryByReference = async (reference) => {
  try {
    const ref = encodeURIComponent(reference?.trim?.() || "");
    const res = await api.get(`/watches/summary/${ref}`);
    return res.data?.result || null;
  } catch (err) {
    console.error("Error getting watch summary by reference:", err);
    throw err?.response ?? err;
  }
};
