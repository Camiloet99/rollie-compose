// src/services/watchService.js
import api from "./api";

// Aceptamos solo these keys; fallback a 'today'
const normalizeWindow = (win) => {
  const v = String(win ?? "").toLowerCase();
  if (v === "" || v === "today" || v === "7d" || v === "15d") return v;
  return ""; // cualquier otra cosa => no average
};

// === 1) GET: por referencia con window como path ===
export const getWatchByReference = async (reference, userId, page = 0, size = 20) => {
  const ref = encodeURIComponent(reference?.trim?.() || "");
  try {
    const res = await api.get(`/watches/${ref}`, { params: { userId, page, size } });    // Ahora el backend devuelve PageResult
    return res.data?.result || { items: [], total: 0, page, size, pages: 1, hasNext: false, hasPrev: false };
  } catch (err) {
    console.error("Error getting watch by reference:", err);
    throw err?.response ?? err;
  }
};

// === 2) POST: búsqueda avanzada, window como query param (NO en body) ===
export const searchWatches = async (payload, userId, window = "today", page = 0, size = 20) => {
  try {
    const win = normalizeWindow(window);
    const { window: _ignoreWindow, ...body } = payload || {};
    const params = { userId };
    if (win) params.window = win; // solo si hay average
    const res = await api.post(`/watches/search`, body, { params });
    return res.data?.result || { items: [], total: 0, page, size, pages: 1, hasNext: false, hasPrev: false };
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
