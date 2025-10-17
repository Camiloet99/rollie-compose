import { useEffect, useMemo, useState } from "react";

export default function useResultFilters(results, show) {
  // Filtros activos
  const [brandFilter, setBrandFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [colorFilter, setColorFilter] = useState(""); // Bracelet/Color
  const [conditionFilter, setConditionFilter] = useState("");

  // Reset de filtros al cerrar modal
  useEffect(() => {
    if (!show) {
      setBrandFilter("");
      setEstadoFilter("");
      setColorFilter("");
      setConditionFilter("");
    }
  }, [show]);

  // === Opciones (a partir de los resultados completos, sin “auto-filtrarse”) ===
  const brandOptions = useMemo(() => {
    const all = (results || []).map((r) => r.brand).filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [results]);

  const estadoOptions = useMemo(() => {
    const all = (results || []).map((r) => r.estado).filter(Boolean);
    return Array.from(new Set(all)).sort();
  }, [results]);

  // Unificamos bracelet/color para el combo “Bracelet / Color”
  const colorOptions = useMemo(() => {
    const allBracelet = (results || []).map((r) => r.bracelet).filter(Boolean);
    const allColor = (results || []).map((r) => r.color).filter(Boolean);
    return Array.from(new Set([...allBracelet, ...allColor])).sort();
  }, [results]);

  const conditionOptions = useMemo(() => {
    // condicion puede venir como string simple o coma-separada
    const all = (results || []).flatMap((r) => {
      if (!r?.condicion) return [];
      return String(r.condicion)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    });
    return Array.from(new Set(all)).sort();
  }, [results]);

  // === Aplicamos filtros sobre los resultados ===
  const filteredResults = useMemo(() => {
    return (results || []).filter((w) => {
      const brandOk = brandFilter ? w.brand === brandFilter : true;
      const estadoOk = estadoFilter ? w.estado === estadoFilter : true;
      const colorOk = colorFilter
        ? w.bracelet === colorFilter || w.color === colorFilter
        : true;
      const condOk = conditionFilter
        ? w.condicion
          ? String(w.condicion)
              .split(",")
              .map((s) => s.trim())
              .includes(conditionFilter)
          : false
        : true;

      return brandOk && estadoOk && colorOk && condOk;
    });
  }, [results, brandFilter, estadoFilter, colorFilter, conditionFilter]);

  return {
    filters: { brandFilter, estadoFilter, colorFilter, conditionFilter },
    setFilters: {
      setBrandFilter,
      setEstadoFilter,
      setColorFilter,
      setConditionFilter,
    },
    options: { brandOptions, estadoOptions, colorOptions, conditionOptions },
    filteredResults,
  };
}
