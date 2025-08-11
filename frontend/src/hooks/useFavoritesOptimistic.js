import { useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { addFavorite, removeFavoriteCall } from "../services/favoriteService";
import { notify } from "../utils/notify";

export function useFavoritesOptimistic() {
  const { user, favorites, setFavorites } = useAuth();
  const inFlight = useRef(new Set()); // evita dobles clics

  const isFavorite = useCallback(
    (reference) => favorites?.some((f) => f.referenceCode === reference),
    [favorites]
  );

  const toggleFavorite = useCallback(async (reference) => {
    if (!user?.userId) return;
    if (inFlight.current.has(reference)) return;
    inFlight.current.add(reference);

    const prev = favorites || [];

    // estado optimista
    let optimistic;
    if (isFavorite(reference)) {
      optimistic = prev.filter((f) => f.referenceCode !== reference);
      setFavorites(optimistic);
    } else {
      optimistic = [...prev, { referenceCode: reference }];
      setFavorites(optimistic);
    }

    try {
      if (isFavorite(reference)) {
        // en realidad estaba ON; vamos a apagarlo
        await removeFavoriteCall(user.userId, reference);
        notify.info("Removed from favorites");
      } else {
        await addFavorite(user.userId, reference);
        notify.success("Added to favorites");
      }
    } catch (e) {
      // rollback
      setFavorites(prev);
      notify.error("Couldn't update favorites");
      console.error(e);
    } finally {
      inFlight.current.delete(reference);
    }
  }, [favorites, isFavorite, setFavorites, user?.userId]);

  const isInFlight = (reference) => inFlight.current.has(reference);

  return { isFavorite, toggleFavorite, isInFlight };
}
