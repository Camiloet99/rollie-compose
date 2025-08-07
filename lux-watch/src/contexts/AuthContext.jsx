import { createContext, useContext, useState, useEffect } from "react";
import {
  getUserFavorites,
  removeFavoriteCall,
} from "../services/favoriteService";
import { getAllTiers } from "../services/tierService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("lux_user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        fetchTiers();
        fetchFavorites(parsedUser.userId);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("lux_user");
      }
    }
    setLoading(false);
  }, []);

  const removeFavorite = async (reference) => {
    if (!user) return;
    try {
      await removeFavoriteCall(user.userId, reference);
      setFavorites((prev) =>
        prev.filter((fav) => fav.referenceCode !== reference)
      );
    } catch (err) {
      console.error("Failed to remove favorite:", err);
    }
  };

  const fetchFavorites = async (userId) => {
    try {
      const favs = await getUserFavorites(userId);
      setFavorites(favs || []);
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  };

  const fetchTiers = async () => {
    try {
      const response = await getAllTiers();
      const activeTiers = response.filter((t) => t.active);
      setTiers(activeTiers);
    } catch (error) {
      console.error("Failed to fetch tiers:", error);
    }
  };

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem("lux_user", JSON.stringify(userData));
    await fetchTiers(); // carga tiers al hacer login
  };

  const upgradeToPremium = () => {
    if (!user) return;
    const updatedUser = { ...user, plan: "premium" };
    setUser(updatedUser);
    localStorage.setItem("lux_user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    localStorage.removeItem("lux_user");
    setUser(null);
    setTiers([]);
    setFavorites([]);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        upgradeToPremium,
        isAuthenticated,
        loading,
        tiers,
        setTiers,
        favorites,
        setFavorites,
        removeFavorite,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
