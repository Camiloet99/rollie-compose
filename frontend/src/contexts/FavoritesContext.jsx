// src/contexts/FavoritesContext.js
import { createContext, useContext, useState, useEffect } from "react";
const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  // Cargar favoritos del localStorage (simulado para MVP)
  useEffect(() => {
    const stored = localStorage.getItem("lux_favorites");
    if (stored) setFavorites(JSON.parse(stored));
  }, []);

  const addFavorite = (watch) => {
    const updated = [...favorites, watch];
    setFavorites(updated);
    localStorage.setItem("lux_favorites", JSON.stringify(updated));
  };

  const removeFavorite = (reference) => {
    const updated = favorites.filter((w) => w.reference !== reference);
    setFavorites(updated);
    localStorage.setItem("lux_favorites", JSON.stringify(updated));
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
