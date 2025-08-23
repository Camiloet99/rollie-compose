// src/services/watchService.js
import api from "./api";

// Aceptamos solo these keys; fallback a 'today'
const normalizeWindow = (win) => {
  const v = String(win || "today").toLowerCase();
  return v === "7d" || v === "15d" ? v : "today";
};

// === 1) GET: por referencia con window como path ===
export const getWatchByReference = async (reference, userId, window = "today") => {
  const ref = encodeURIComponent(reference?.trim?.() || "");
  const win = normalizeWindow(window);
  try {
    const res = await api.get(`/watches/${ref}/window/${win}`, {
      params: { userId },
    });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error getting watch by reference:", err);
    throw err?.response ?? err;
  }
};

// === 2) POST: búsqueda avanzada, window como query param (NO en body) ===
export const searchWatches = async (payload, userId, window = "today") => {
  try {
    const win = normalizeWindow(window);
    const { window: _ignoreWindow, ...body } = payload || {};
    const res = await api.post(`/watches/search`, body, {
      params: { userId, window: win },
    });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error searching watches:", err);
    throw err?.response ?? err;
  }
};

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

// === 7) GET: resumen por referencia ===
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
