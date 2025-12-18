import { Modal, Button, Form } from "react-bootstrap";
import { useMemo, useState, useEffect } from "react";
import useResultFilters from "./useResultFilters";
import FiltersRow from "./FiltersRow";
import ReferencePills from "./ReferencePills";
import WatchCard from "./WatchCard";
import WatchCardSkeleton from "./WatchCardSkeleton";
import { useFavoritesOptimistic } from "../../hooks/useFavoritesOptimistic";
import "./SearchResultsModal.css";
import { onlyUSD } from "../../utils/currency";
import usePriceBuckets from "../../hooks/usePriceBuckets";

export default function SearchResultsModal({
  show,
  onHide,
  pageResult = { items: [], total: 0 },
  loading = false,
}) {
  // ✅ Backend ya no pagina: items contiene TODO
  const results = pageResult.items || [];

  // Favoritos (optimistic)
  const { isFavorite, toggleFavorite, isInFlight } = useFavoritesOptimistic();

  // Filtros dentro del modal sobre TODO el set
  const { filters, setFilters, options, filteredResults } = useResultFilters(
    results,
    show
  );

  const { colorFilter, conditionFilter, brandFilter, estadoFilter } = filters;
  const { setColorFilter, setConditionFilter, setEstadoFilter, setBrandFilter } =
    setFilters;

  const { colorOptions, conditionOptions, estadoOptions, brandOptions } =
    options;

  // Base list: filtrada o completa
  const displayResults = useMemo(() => {
    return Array.isArray(filteredResults) ? filteredResults : results;
  }, [filteredResults, results]);

  // Referencias únicas para pills (sobre lista filtrada)
  const uniqueReferences = useMemo(() => {
    const set = new Set(
      (displayResults || [])
        .map((w) => (w.modelo ?? "").trim())
        .filter(Boolean)
    );
    return Array.from(set);
  }, [displayResults]);

  // === BUCKETS (USD) ===
  const usdForBuckets = useMemo(() => {
    const usd = onlyUSD(displayResults ?? []);
    return (usd || []).map((w) => ({
      ...w,
      cost: w.montoFinal ?? w.monto ?? null,
      reference_code: w.modelo ?? "NOREF",
    }));
  }, [displayResults]);

  const { classify } = usePriceBuckets(usdForBuckets, {
    method: "quantile",
    byReference: true,
    minGroup: 12,
  });

  // Orden local (price/year)
  const [sort, setSort] = useState("price_desc");
  const sortedResults = useMemo(() => {
    const arr = [...(displayResults || [])];
    const num = (x) =>
      x === null || x === undefined || x === "" ? NaN : Number(x);
    const priceOf = (w) => num(w.montoFinal ?? w.monto);
    const yearOf = (w) => num(w.anio);

    switch (sort) {
      case "price_asc":
        return arr.sort((a, b) => (priceOf(a) || 0) - (priceOf(b) || 0));
      case "price_desc":
        return arr.sort((a, b) => (priceOf(b) || 0) - (priceOf(a) || 0));
      case "year_asc":
        return arr.sort((a, b) => (yearOf(a) || 0) - (yearOf(b) || 0));
      case "year_desc":
        return arr.sort((a, b) => (yearOf(b) || 0) - (yearOf(a) || 0));
      default:
        return arr;
    }
  }, [displayResults, sort]);

  // ✅ Paginación LOCAL
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const total = sortedResults.length;
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const hasPrev = page > 0;
  const hasNext = page < pages - 1;

  // Cuando cambian filtros/resultados o se abre modal, vuelve a page 0
  useEffect(() => {
    if (show) setPage(0);
  }, [show, brandFilter, estadoFilter, colorFilter, conditionFilter, sort, size, total]);

  const paginatedResults = useMemo(() => {
    const start = page * size;
    const end = start + size;
    return sortedResults.slice(start, end);
  }, [sortedResults, page, size]);

  const fromN = total === 0 ? 0 : page * size + 1;
  const toN = Math.min((page + 1) * size, total);

  const PaginationBar = () => (
    <div className="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2">
      <div className="text-muted small">
        Showing <strong>{fromN}-{toN}</strong> of <strong>{total}</strong>
      </div>

      <div className="d-flex align-items-center gap-2">
        <Form.Select
          size="sm"
          value={size}
          onChange={(e) => {
            const next = parseInt(e.target.value, 10);
            setSize(next);
            setPage(0);
          }}
          style={{ width: 120 }}
          aria-label="Page size"
        >
          {[10, 20, 50, 100].map((opt) => (
            <option key={opt} value={opt}>
              {opt} / page
            </option>
          ))}
        </Form.Select>

        <div className="d-flex align-items-center gap-2">
          <Button
            size="sm"
            variant="outline-secondary"
            disabled={!hasPrev || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ‹ Prev
          </Button>

          <span className="small text-muted">
            Page <strong>{page + 1}</strong> / {pages}
          </span>

          <Button
            size="sm"
            variant="outline-secondary"
            disabled={!hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next ›
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4 fw-semibold">Search Results</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-0">
        {!loading && displayResults.length > 0 && (
          <div className="filter-row-sticky">
            <div className="results-toolbar d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <Form.Select
                  size="sm"
                  className="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort results"
                >
                  <option value="price_desc">Price: high → low</option>
                  <option value="price_asc">Price: low → high</option>
                  <option value="year_desc">Year: new → old</option>
                  <option value="year_asc">Year: old → new</option>
                </Form.Select>
              </div>

              <PaginationBar />
            </div>

            <div className="filters-section">
              <FiltersRow
                brandFilter={brandFilter}
                estadoFilter={estadoFilter}
                colorFilter={colorFilter}
                conditionFilter={conditionFilter}
                setBrandFilter={setBrandFilter}
                setEstadoFilter={setEstadoFilter}
                setColorFilter={setColorFilter}
                setConditionFilter={setConditionFilter}
                brandOptions={brandOptions}
                estadoOptions={estadoOptions}
                colorOptions={colorOptions}
                conditionOptions={conditionOptions}
              />

              <ReferencePills
                references={uniqueReferences}
                isFavorite={isFavorite}
                toggleFavorite={toggleFavorite}
                isInFlight={isInFlight}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <WatchCardSkeleton key={i} />
            ))}
          </div>
        ) : total === 0 ? (
          <p className="text-center text-muted mt-4">No results found.</p>
        ) : (
          <div className="mt-3">
            {paginatedResults.map((watch) => {
              const priceTier = classify({
                cost: watch.montoFinal ?? watch.monto ?? null,
                reference_code: watch.modelo ?? "NOREF",
              });

              return (
                <WatchCard
                  key={watch.id ?? `${watch.modelo}-${watch.createdAt ?? Math.random()}`}
                  watch={watch}
                  priceTier={priceTier}
                />
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        {!loading && total > 0 && <PaginationBar />}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
