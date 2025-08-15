function quantile(sortedArr, q) {
  if (!sortedArr.length) return 0;
  const pos = (sortedArr.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sortedArr[base] + (sortedArr[base + 1] - sortedArr[base]) * rest || sortedArr[base];
}

function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function std(arr){
  const m = mean(arr);
  const v = mean(arr.map(x => (x - m) ** 2));
  return Math.sqrt(v);
}

export function computeBuckets(valuesUSD = [], method = 'quantile', fixed = {low: 0, high: Infinity}) {
  const clean = valuesUSD.filter(v => Number.isFinite(v)).sort((a,b)=>a-b);
  if (clean.length === 0) return { lowMax: 0, highMin: Infinity };

  if (method === 'fixed') {
    return { lowMax: fixed.low, highMin: fixed.high };
  }

  if (method === 'std') {
    const m = mean(clean);
    const s = std(clean);
    // low: <= m - 0.5σ ; mid: (m - 0.5σ, m + 0.5σ] ; high: > m + 0.5σ
    return { lowMax: m - 0.5*s, highMin: m + 0.5*s };
  }

  // default 'quantile' — bajo costo computacional y robusto
  const p33 = quantile(clean, 1/3);
  const p66 = quantile(clean, 2/3);
  return { lowMax: p33, highMin: p66 };
}

export function classifyByBuckets(priceUSD, { lowMax, highMin }) {
  if (!Number.isFinite(priceUSD)) return 'mid';
  if (priceUSD <= lowMax) return 'low';
  if (priceUSD >  highMin) return 'high';
  return 'mid';
}
