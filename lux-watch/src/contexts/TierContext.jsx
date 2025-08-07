import { createContext, useContext, useState } from "react";

const TierContext = createContext();

export const useTier = () => useContext(TierContext);

export const TierProvider = ({ children }) => {
  const [tiers, setTiers] = useState([]);

  return (
    <TierContext.Provider value={{ tiers, setTiers }}>
      {children}
    </TierContext.Provider>
  );
};
