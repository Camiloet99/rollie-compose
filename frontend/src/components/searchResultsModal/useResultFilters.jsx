import { useEffect, useMemo, useState } from "react";

export default function useResultFilters(results, show) {
  const [colorFilter, setColorFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [extraInfoFilter, setExtraInfoFilter] = useState("");

  // Reset de filtros al cerrar modal
  useEffect(() => {
    if (!show) {
      setColorFilter("");
      setConditionFilter("");
      setExtraInfoFilter("");
    }
  }, [show]);

  const filteredResults = useMemo(() => {
    return results.filter((watch) => {
      const colorMatch = colorFilter ? watch.colorDial === colorFilter : true;
      const conditionMatch = conditionFilter
        ? watch.condition?.includes(conditionFilter)
        : true;
      const extraMatch = extraInfoFilter
        ? watch.extraInfo?.toUpperCase().includes(extraInfoFilter)
        : true;
      return colorMatch && conditionMatch && extraMatch;
    });
  }, [results, colorFilter, conditionFilter, extraInfoFilter]);

  const filteredByAllExceptColor = useMemo(() => {
    return results.filter((r) => {
      const conditionMatch = conditionFilter
        ? r.condition?.includes(conditionFilter)
        : true;
      const extraMatch = extraInfoFilter
        ? r.extraInfo?.toUpperCase().includes(extraInfoFilter)
        : true;
      return conditionMatch && extraMatch;
    });
  }, [results, conditionFilter, extraInfoFilter]);

  const filteredByAllExceptCondition = useMemo(() => {
    return results.filter((r) => {
      const colorMatch = colorFilter ? r.colorDial === colorFilter : true;
      const extraMatch = extraInfoFilter
        ? r.extraInfo?.toUpperCase().includes(extraInfoFilter)
        : true;
      return colorMatch && extraMatch;
    });
  }, [results, colorFilter, extraInfoFilter]);

  const filteredByAllExceptExtra = useMemo(() => {
    return results.filter((r) => {
      const colorMatch = colorFilter ? r.colorDial === colorFilter : true;
      const conditionMatch = conditionFilter
        ? r.condition?.includes(conditionFilter)
        : true;
      return colorMatch && conditionMatch;
    });
  }, [results, colorFilter, conditionFilter]);

  const colorOptions = useMemo(() => {
    const all = filteredByAllExceptColor
      .map((r) => r.colorDial)
      .filter(Boolean);
    return [...new Set(all)];
  }, [filteredByAllExceptColor]);

  const conditionOptions = useMemo(() => {
    const all = filteredByAllExceptCondition.flatMap((r) =>
      r.condition ? r.condition.split(",").map((c) => c.trim()) : []
    );
    return [...new Set(all.filter(Boolean))];
  }, [filteredByAllExceptCondition]);

  const extraInfoOptions = useMemo(() => {
    const all = filteredByAllExceptExtra.flatMap((r) =>
      r.extraInfo
        ? r.extraInfo.split(",").map((e) => e.trim().toUpperCase())
        : []
    );
    return [...new Set(all.filter(Boolean))];
  }, [filteredByAllExceptExtra]);

  // Resetea si la opción elegida desaparece
  useEffect(() => {
    if (colorFilter && !colorOptions.includes(colorFilter)) setColorFilter("");
    if (conditionFilter && !conditionOptions.includes(conditionFilter))
      setConditionFilter("");
    if (extraInfoFilter && !extraInfoOptions.includes(extraInfoFilter))
      setExtraInfoFilter("");
  }, [colorOptions, conditionOptions, extraInfoOptions]);

  return {
    filters: { colorFilter, conditionFilter, extraInfoFilter },
    setFilters: { setColorFilter, setConditionFilter, setExtraInfoFilter },
    options: { colorOptions, conditionOptions, extraInfoOptions },
    filteredResults,
  };
}
