export function onlyUSD(watches = [], { acceptUSDT = true } = {}) {
  return watches
    .filter((w) => {
      const cur = (w?.currency || "").trim().toUpperCase();
      const isUSD = cur === "USD";
      const isUSDT = acceptUSDT && cur === "USDT";
      const hasFiniteCost = Number.isFinite(Number(w?.cost));
      return (isUSD || isUSDT) && hasFiniteCost;
    })
    .map((w) => ({
      ...w,
      // Normalizamos la moneda a USD para los buckets
      currency: "USD",
      cost: Number(w.cost),
    }));
}
