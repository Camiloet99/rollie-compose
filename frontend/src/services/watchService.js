import api from "./api"; // este es tu wrapper de axios con headers y baseURL configurados

export const getWatchByReference = async (reference, userId, window = "today") => {
  const win = (window || "today").toLowerCase();
  try {
    const res = await api.get(`/watches/${reference}/window/${win}`, {
      params: { userId },
    });
    return res.data?.result ;
  } catch (err) {
    console.error("Error getting watch by reference:", err);
    throw err.response || err;
  }
};

export const searchWatches = async (payload, userId, window = "today") => {
  try {
    const win = (window || "today").toLowerCase();
    const {
      window: _ignoreWindow, 
      ...body
    } = payload || {};
    const res = await api.post(`/watches/search`, body, {
      params: { userId, window: win },
    });
    return res.data?.result;
  } catch (err) {
    console.error("Error searching watches:", err);
    throw err.response || err;
  }
};


// === 3. POST: Get multiple watches by reference codes ===
export const getWatchesByReferences = async (references) => {
  try {
    const res = await api.post("/watches/by-references", {
      references,
    });
    return res.data?.result;
  } catch (err) {
    console.error("Error fetching watches by references:", err);
    throw err.response || err;
  }
};

// === 4. GET: Get watches within a price range ===
export const getWatchesByPriceRange = async (min, max) => {
  try {
    const res = await api.get("/watches/price-range", {
      params: { min, max },
    });
    return res.data?.result;
  } catch (err) {
    console.error("Error getting watches by price range:", err);
    throw err.response || err;
  }
};

// === 5. GET: Get price history for a reference ===
export const getPriceHistory = async (reference) => {
  try {
    const res = await api.get("/watches/price-history", {
      params: { reference },
    });
    return res.data?.result;
  } catch (err) {
    console.error("Error getting price history:", err);
    throw err.response || err;
  }
};

// === 6. GET: Autocomplete reference search ===
export const autocompleteReference = async (prefix) => {
  try {
    const res = await api.get("/watches/autocomplete", {
      params: { prefix },
    });
    return res.data?.result || [];
  } catch (err) {
    console.error("Error with autocomplete:", err);
    throw err.response || err;
  }
};

// === 7. GET: Get summary of a watch reference (price range, conditions, etc.) ===
export const getWatchSummaryByReference = async (reference) => {
  try {
    const res = await api.get(`/watches/summary/${reference}`);
    return res.data?.result;
  } catch (err) {
    console.error("Error getting watch summary by reference:", err);
    throw err.response || err;
  }
};
