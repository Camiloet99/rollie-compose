import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

// De la URL => objeto (todo string)
function parseSearch(search, defaults) {
  const sp = new URLSearchParams(search);
  const out = { ...defaults };
  for (const [k, v] of sp.entries()) {
    out[k] = v; // 👈 no convertir a número aquí
  }
  return out;
}

// Objeto => ?a=1&b=...
function toSearchString(obj) {
  const sp = new URLSearchParams();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (s === "") return;
    sp.set(k, s);
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function usePersistentSearchParams(defaultFilters = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = useMemo(() => parseSearch(location.search, defaultFilters), []); // solo al montar
  const [filters, setFilters] = useState(initial);
  const lastSearchRef = useRef(toSearchString(initial));

  // estado -> URL
  useEffect(() => {
    const next = toSearchString(filters);
    if (next !== lastSearchRef.current) {
      lastSearchRef.current = next;
      navigate({ search: next }, { replace: true });
    }
  }, [filters, navigate]);

  // URL (back/forward) -> estado
  useEffect(() => {
    const incoming = toSearchString(parseSearch(location.search, defaultFilters));
    if (incoming !== lastSearchRef.current) {
      lastSearchRef.current = incoming;
      setFilters(parseSearch(location.search, defaultFilters));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  return [filters, setFilters];
}
