import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";

const CrmContext = createContext(null);

const initialState = {
  inventory: [],
  contacts: [],
  deals: [],
  sales: [],
  currentStageFilter: null,
  contactViewMode: "grid",
};

function daysBetween(fromISO) {
  const d = new Date(fromISO);
  const today = new Date();
  return Math.floor((today - d) / (1000 * 60 * 60 * 24));
}

function initWithSamples(state) {
  // Si no hay datos en localStorage, inyecta samples (tomados de tu HTML)
  return {
    ...state,
    inventory: [
      {
        id: "WD-001",
        serialNumber: "RLX2023-4567",
        brand: "Rolex",
        model: "Daytona",
        reference: "116500LN",
        year: 2023,
        purchaseDate: "2024-10-15",
        cost: 35000,
        retailPrice: 42000,
        status: "available",
        daysInStock: daysBetween("2024-10-15"),
        condition: "Like New",
      },
      {
        id: "WD-002",
        serialNumber: "PP2021-8934",
        brand: "Patek Philippe",
        model: "Nautilus",
        reference: "5711/1A",
        year: 2021,
        purchaseDate: "2024-10-01",
        cost: 95000,
        retailPrice: 130000,
        status: "available",
        daysInStock: daysBetween("2024-10-01"),
        condition: "Excellent",
      },
      {
        id: "WD-003",
        serialNumber: "AP2022-1234",
        brand: "Audemars Piguet",
        model: "Royal Oak",
        reference: "15500ST",
        year: 2022,
        purchaseDate: "2024-09-20",
        cost: 48000,
        retailPrice: 58000,
        status: "sold",
        daysInStock: 25,
        condition: "New",
      },
    ],
    contacts: [
      {
        id: 1,
        firstName: "John",
        lastName: "Smith",
        phone: "+1 (555) 123-4567",
        email: "john.smith@email.com",
        address: "123 Park Ave",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "United States",
        dob: "1985-03-15",
        type: "buyer",
        totalPurchases: 285000,
        transactions: 3,
        lastTransaction: "2024-10-15",
        notes: "Prefers Rolex sports models, quick payment",
      },
      {
        id: 2,
        firstName: "Michael",
        lastName: "Chen",
        phone: "+1 (555) 987-6543",
        email: "m.chen@luxurytime.com",
        address: "456 Rodeo Drive",
        city: "Los Angeles",
        state: "CA",
        zip: "90210",
        country: "United States",
        dob: "1978-11-22",
        type: "dealer",
        totalPurchases: 520000,
        transactions: 8,
        lastTransaction: "2024-10-28",
        notes: "Bulk buyer, interested in rare pieces",
      },
    ],
    deals: [
      {
        id: 1,
        watchId: "WD-001",
        contactId: 1,
        stage: "closing",
        proposedPrice: 41000,
        expectedClose: "2024-11-05",
        createdDate: "2024-10-25",
      },
      {
        id: 2,
        watchId: "WD-002",
        contactId: 2,
        stage: "negotiation",
        proposedPrice: 125000,
        expectedClose: "2024-11-10",
        createdDate: "2024-10-20",
      },
    ],
    sales: [],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_FROM_STORAGE":
      return { ...state, ...action.payload };
    case "SAVE_CONTACT": {
      const contact = {
        ...action.payload,
        id: Date.now(),
        totalPurchases: 0,
        transactions: 0,
        lastTransaction: null,
      };
      return { ...state, contacts: [...state.contacts, contact] };
    }
    case "UPDATE_WATCH": {
      const w = action.payload; // {id, ...campos}
      return {
        ...state,
        inventory: state.inventory.map((x) =>
          x.id === w.id ? { ...x, ...w } : x
        ),
      };
    }
    case "UPDATE_DEAL": {
      const d = action.payload; // {id, ...campos}
      return {
        ...state,
        deals: state.deals.map((x) => (x.id === d.id ? { ...x, ...d } : x)),
      };
    }
    case "SAVE_DEAL": {
      const deal = {
        ...action.payload,
        id: Date.now(),
        createdDate: new Date().toISOString(),
      };
      return { ...state, deals: [...state.deals, deal] };
    }
    case "SET_STAGE_FILTER":
      return { ...state, currentStageFilter: action.payload };
    case "SET_CONTACT_VIEW":
      return { ...state, contactViewMode: action.payload };
    default:
      return state;
  }
}

const STORAGE_KEY = "watchDealerSystem";

export function CrmProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, initWithSamples);

  // cargar de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        dispatch({ type: "LOAD_FROM_STORAGE", payload: data });
      }
    } catch {}
  }, []);

  // persistir
  useEffect(() => {
    const toSave = {
      inventory: state.inventory,
      contacts: state.contacts,
      deals: state.deals,
      sales: state.sales,
      lastSync: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state.inventory, state.contacts, state.deals, state.sales]);

  // SELECTORS
  const selectors = useMemo(() => {
    const getInventoryStats = () => {
      const available = state.inventory.filter((w) => w.status === "available");
      const totalOwnedCost = available.reduce((s, w) => s + w.cost, 0);
      const totalRetailValue = available.reduce((s, w) => s + w.retailPrice, 0);
      const avgDays = available.length
        ? Math.round(
            available.reduce((s, w) => s + w.daysInStock, 0) / available.length
          )
        : 0;
      return {
        totalOwnedCost,
        totalRetailValue,
        availableCount: available.length,
        avgDaysInStock: avgDays,
      };
    };

    const getPipelineStats = () => {
      const stages = {
        prospect: { count: 0, value: 0 },
        qualified: { count: 0, value: 0 },
        negotiation: { count: 0, value: 0 },
        closing: { count: 0, value: 0 },
        "closed-won": { count: 0, value: 0 },
      };
      state.deals.forEach((d) => {
        if (stages[d.stage]) {
          stages[d.stage].count++;
          stages[d.stage].value += d.proposedPrice || 0;
        }
      });
      const now = new Date();
      const monthlySales = state.sales.filter((s) => {
        const dt = new Date(s.saleDate);
        return (
          dt.getMonth() === now.getMonth() &&
          dt.getFullYear() === now.getFullYear()
        );
      });
      stages["closed-won"].count = monthlySales.length;
      stages["closed-won"].value = monthlySales.reduce(
        (s, x) => s + (x.salePrice || 0),
        0
      );
      return stages;
    };

    const getDealsList = (stage) => {
      if (!stage || stage === "all") {
        return [
          ...state.deals,
          ...state.sales.map((s) => ({ ...s, stage: "closed-won" })),
        ];
      }
      if (stage === "closed-won")
        return state.sales.map((s) => ({ ...s, stage: "closed-won" }));
      return state.deals.filter((d) => d.stage === stage);
    };

    return { getInventoryStats, getPipelineStats, getDealsList };
  }, [state.deals, state.inventory, state.sales]);

  const actions = {
    saveContact: (payload) => dispatch({ type: "SAVE_CONTACT", payload }),
    saveDeal: (payload) => dispatch({ type: "SAVE_DEAL", payload }),
    updateWatch: (payload) => dispatch({ type: "UPDATE_WATCH", payload }),
    updateDeal: (payload) => dispatch({ type: "UPDATE_DEAL", payload }),
    setStageFilter: (stage) =>
      dispatch({ type: "SET_STAGE_FILTER", payload: stage }),
    setContactView: (view) =>
      dispatch({ type: "SET_CONTACT_VIEW", payload: view }),
  };

  const value = { state, actions, selectors };
  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export const useCrm = () => useContext(CrmContext);
