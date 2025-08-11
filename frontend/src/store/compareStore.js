import { create } from "zustand";

export const MAX_ITEMS = 4;

// Usaremos la MISMA clave en toda la app para identificar relojes
export const keyOf = (w) =>
  w?.id ?? `${w?.referenceCode ?? ""}-${w?.currency ?? ""}-${w?.cost ?? ""}`;

export const useCompareStore = create((set, get) => ({
  items: [],
  isOpen: false,
  toggleItem: (watch) => {
    const items = get().items;
    const k = keyOf(watch);
    const exists = items.some((w) => keyOf(w) === k);

    if (exists) {
      set({ items: items.filter((w) => keyOf(w) !== k) });
      return { action: "removed" };
    } else {
      if (items.length >= MAX_ITEMS) return { action: "limit" };
      set({ items: [...items, watch] });
      return { action: "added" };
    }
  },
  remove: (watch) =>
    set({ items: get().items.filter((w) => keyOf(w) !== keyOf(watch)) }),
  clear: () => set({ items: [] }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
