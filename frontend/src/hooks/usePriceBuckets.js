import { useMemo } from 'react';
import { computeBuckets, classifyByBuckets } from '../utils/priceBuckets';

export default function usePriceBuckets(
  watchesUSD = [],
  {
    method = 'quantile',     // 'quantile' | 'std' | 'fixed'
    fixed = { low: 0, high: Infinity },
    byReference = true,
    minGroup = 12            // si un reference_code tiene < minGroup, usa global
  } = {}
){
  const { globalBuckets, perRefBuckets } = useMemo(() => {
    const prices = watchesUSD.map(w => w.cost).filter(Number.isFinite);
    const globalBuckets = computeBuckets(prices, method, fixed);

    let perRefBuckets = {};
    if (byReference) {
      const groups = watchesUSD.reduce((acc, w) => {
        const key = w.reference_code || 'NOREF';
        (acc[key] ||= []).push(w.cost);
        return acc;
      }, {});
      for (const [ref, vals] of Object.entries(groups)) {
        perRefBuckets[ref] = (vals.length >= minGroup)
          ? computeBuckets(vals, method, fixed)
          : null; // señal de usar global
      }
    }
    return { globalBuckets, perRefBuckets };
  }, [watchesUSD, method, fixed.low, fixed.high, byReference, minGroup]);

  function classify(watch){
    const ref = watch.reference_code || 'NOREF';
    const buckets = (perRefBuckets[ref] || globalBuckets);
    return classifyByBuckets(watch.cost, buckets);
  }

  return { classify, globalBuckets, perRefBuckets };
}
