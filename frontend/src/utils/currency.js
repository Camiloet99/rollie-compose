export function onlyUSD(watches = []) {
  return watches
    .filter(w => (w?.currency || '').toUpperCase() === 'USD')
    .map(w => ({ ...w, currency: 'USD' }));
}