import { Modal, Button, Form } from "react-bootstrap";
import { useMemo, useState } from "react";
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
  pageResult = {
    items: [],
    total: 0,
    page: 0,
    size: 50,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  },
  loading = false,
  onChangePage = () => {},
  onChangeSize = () => {},
}) {
  // Items de la página actual (ya paginados por el backend)
  const results = pageResult.items || [];

  // Favoritos (optimistic)
  const { isFavorite, toggleFavorite, isInFlight } = useFavoritesOptimistic();

  // Filtros dentro del modal — ahora con brand/color/condicion/cleanText
  const { filters, setFilters, options, filteredResults } = useResultFilters(
    results,
    show
  );
  const { colorFilter, conditionFilter, brandFilter, estadoFilter } = filters;
  const {
    setColorFilter,
    setConditionFilter,
    setEstadoFilter,
    setBrandFilter,
  } = setFilters;
  const { colorOptions, conditionOptions, estadoOptions, brandOptions } =
    options;

  // === LISTA QUE SE MUESTRA ===
  const displayResults = useMemo(
    () =>
      filteredResults && Array.isArray(filteredResults)
        ? filteredResults
        : results,
    [filteredResults, results]
  );

  // Referencias (modelos) únicas de esta página (para las pills)
  const uniqueReferences = useMemo(() => {
    const set = new Set(
      (displayResults || []).map((w) => (w.modelo ?? "").trim()).filter(Boolean)
    );
    return Array.from(set);
  }, [displayResults]);

  // === SOLO PARA BUCKETS/CLASIFICACIÓN (USD) ===
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

  // Orden local (price/year) con campos reales del backend
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

  // === Paginación: calcular localmente ===
  const { page = 0, size = 20, total = 0 } = pageResult;
  const pages = Math.max(1, Math.ceil(total / Math.max(1, size)));
  const hasPrev = page > 0;
  const hasNext = page < pages - 1;

  const PaginationBar = () => (
    <div className="d-flex flex-wrap align-items-center justify-content-between w-100 gap-2">
      <div className="text-muted small">
        Showing <strong>{displayResults.length}</strong> of{" "}
        <strong>{total}</strong>
      </div>

      <div className="d-flex align-items-center gap-2">
        <Form.Select
          size="sm"
          value={size}
          onChange={(e) => onChangeSize(parseInt(e.target.value, 10))}
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
            onClick={() => onChangePage(Math.max(0, page - 1))}
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
            onClick={() => onChangePage(page + 1)}
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
        {/* Toolbar superior (orden/paginación/filtros) */}
        {!loading && displayResults.length > 0 && (
          <div className="filter-row-sticky">
            <div className="results-toolbar d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
              {/* Orden */}
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

              {/* Paginación arriba */}
              <PaginationBar />
            </div>

            {/* Filtros internos + referencia pills */}
            <div className="filters-section">
              <FiltersRow
                // activos
                brandFilter={brandFilter}
                estadoFilter={estadoFilter}
                colorFilter={colorFilter}
                conditionFilter={conditionFilter}
                // setters
                setBrandFilter={setBrandFilter}
                setEstadoFilter={setEstadoFilter}
                setColorFilter={setColorFilter}
                setConditionFilter={setConditionFilter}
                // opciones
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

        {/* Cuerpo (skeleton / vacío / cards) */}
        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <WatchCardSkeleton key={i} />
            ))}
          </div>
        ) : displayResults.length === 0 ? (
          <p className="text-center text-muted mt-4">No results found.</p>
        ) : (
          <div className="mt-3">
            {sortedResults.map((watch) => {
              // Clasificación por buckets — espera { cost, reference_code }
              const priceTier = classify({
                cost: watch.montoFinal ?? watch.monto ?? null,
                reference_code: watch.modelo ?? "NOREF",
              });
              return (
                <WatchCard
                  key={
                    watch.id ??
                    `${watch.modelo}-${watch.createdAt ?? Math.random()}`
                  }
                  watch={watch}
                  priceTier={priceTier}
                />
              );
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        {/* Paginación abajo */}
        {!loading && displayResults.length > 0 && <PaginationBar />}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
