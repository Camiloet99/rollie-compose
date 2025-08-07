import api from "./api";
import { getWatchSummaryByReference } from "./watchService";

// === GET: Get favorite references and map to full data if needed ===
export const getUserFavorites = async (userId) => {
  try {
    const res = await api.get(`/favorites/${userId}`);
    const references = res.data?.result || [];

    if (!references || references.length === 0) {
      return [];
    }

    // Obtener resumen para cada referencia de forma paralela
    const summaries = await Promise.all(
      references.map((ref) => getWatchSummaryByReference(ref))
    );

    // Filtramos posibles nulls si alguna falla
    return summaries.filter((summary) => summary != null);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    return [];
  }
};

// === PUT: Add reference as favorite ===
export const addFavorite = async (userId, reference) => {
  try {
    await api.put(`/favorites/${userId}/add`, { reference: reference },);
    return getUserFavorites(userId); // refresca lista
  } catch (err) {
    console.error("Error adding favorite:", err);
    return [];
  }
};

// === PUT: Remove reference from favorites ===
export const removeFavoriteCall = async (userId, reference) => {
  try {
    await api.put(`/favorites/${userId}/remove`, { reference });
    return getUserFavorites(userId); // refresca lista
  } catch (err) {
    console.error("Error removing favorite:", err);
    return [];
  }
};
