// src/services/watchService.js
import api from "./api";

// 1) Búsqueda simple por modelo exacto
export const getWatchByReference = async (reference, _userId, page = 0, size = 20, sort = "date_desc") => {
  const modelo = (reference ?? "").trim();
  if (!modelo) {
    return { items: [], total: 0, page, size, pages: 1, hasNext: false, hasPrev: false };
  }
  try {
    const params = { page, size, sort: normalizeSort(sort) };
    const body = { modelo };
    const res = await api.post(`/watches/query`, body, { params });
    return res.data?.result || { items: [], total: 0, page, size, pages: 1, hasNext: false, hasPrev: false };
  } catch (err) {
    console.error("Error getting watch by reference:", err);
    throw err?.response ?? err;
  }
};

// services/watchService.js
export const searchWatches = async (
  payload,
  _userId,
  window = "",
  page = 0,
  size = 20,
  sort = "date_desc"
) => {
  try {
    const win = normalizeWindow(window); // "", "today", "7d", "15d"
    const isAverage = Boolean(win);

    // Mapeo legacy -> nuevo WatchFilter (backend)
    const bodyBase = {
      modelo: safeTrim(payload?.referenceCode ?? payload?.modelo) || null,
      brand: safeTrim(payload?.brand) || null,
      bracelet: safeTrim(payload?.bracelet) || null,
      estado: safeTrim(payload?.estado) || null,

      color: safeTrim(payload?.colorDial ?? payload?.color) || null,
      anio: payload?.productionYear ?? payload?.year ?? null,
      condicion: safeTrim(payload?.condition) || null,

      priceMin: payload?.minPrice ?? payload?.priceMin ?? null,
      priceMax: payload?.maxPrice ?? payload?.priceMax ?? null,
      currency: safeTrim(payload?.currency) || null,
      info: safeTrim(payload?.watchInfo ?? payload?.extraInfo) || null,
    };

    // Si NO es average, permitimos filtrar por rango explícito
    const range = isAverage ? {} : windowToRange(win); // { asOfFrom, asOfTo } o {}
    const body = { ...bodyBase, ...range };

    // Params comunes
    const params = {
      page,
      size,
      sort: normalizeSort(sort),
    };

    // Activar modo average en backend
    if (isAverage) {
      // Validación opcional en cliente: evitar request inválida
      if (!bodyBase.modelo && !bodyBase.brand) {
        throw {
          response: {
            data: { error: "Average requires at least brand or modelo" },
            status: 400,
          },
        };
      }
      params.window = win; // <-- clave: dispara el endpoint de promedio
    }

    const res = await api.post(`/watches/query`, body, { params });
    return (
      res.data?.result || {
        items: [],
        total: 0,
        page,
        size,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      }
    );
  } catch (err) {
    console.error("Error searching watches:", err);
    throw err?.response ?? err;
  }
};

// Helpers (si no los tienes ya en tu utils)
function safeTrim(v) {
  return typeof v === "string" ? v.trim() : "";
}
function normalizeWindow(w) {
  const s = safeTrim(w).toLowerCase();
  return s === "today" || s === "7d" || s === "15d" ? s : "";
}
function normalizeSort(s) {
  const v = safeTrim(s).toLowerCase();
  // soportados por el backend: date_desc (default), price_asc, price_desc, brand_asc, brand_desc
  if (["price_asc", "price_desc", "brand_asc", "brand_desc", "date_desc"].includes(v))
    return v;
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
  // "today" => mismo día
  return { asOfFrom: from, asOfTo: to };
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmt(d) {
  // YYYY-MM-DD
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}


// === 3) POST: múltiples referencias ===
export const getWatchesByReferences = async (references) => {
  try {
    const res = await api.post("/watches/by-references", { references });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error fetching watches by references:", err);
    throw err?.response ?? err;
  }
};

// === 4) GET: rango de precios ===
export const getWatchesByPriceRange = async (min, max) => {
  try {
    const res = await api.get("/watches/price-range", { params: { min, max } });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error getting watches by price range:", err);
    throw err?.response ?? err;
  }
};

// === 5) GET: historial de precios ===
export const getPriceHistory = async (reference) => {
  try {
    const res = await api.get("/watches/price-history", { params: { reference } });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error getting price history:", err);
    throw err?.response ?? err;
  }
};

// === 6) GET: autocomplete de referencias ===
// Ojo: aquí usas 'prefix'. Asegúrate que tu backend tenga @RequestParam("prefix").
// Si tu backend espera 'q', cambia a { params: { q: prefix } }.
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
