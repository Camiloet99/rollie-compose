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
    size: 20,
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

  // Filtros dentro del modal (color / condition / extraInfo, etc.)
  const { filters, setFilters, options, filteredResults } = useResultFilters(
    results,
    show
  );
  const { colorFilter, conditionFilter, extraInfoFilter } = filters;
  const { setColorFilter, setConditionFilter, setExtraInfoFilter } = setFilters;
  const { colorOptions, conditionOptions, extraInfoOptions } = options;

  // === LISTA QUE SE MUESTRA ===
  // No filtramos a USD aquí: mostramos TODO lo que vino del backend (tras filtros del modal)
  const displayResults = useMemo(
    () =>
      filteredResults && Array.isArray(filteredResults)
        ? filteredResults
        : results,
    [filteredResults, results]
  );

  // Referencias únicas de esta página (para las pills)
  const uniqueReferences = useMemo(() => {
    const set = new Set(
      (displayResults || [])
        .map((w) => (w.referenceCode ?? w.reference_code ?? "").trim())
        .filter(Boolean)
    );
    return Array.from(set);
  }, [displayResults]);

  // === SOLO PARA BUCKETS/CLASIFICACIÓN ===
  // Trabaja con USD únicamente para construir buckets (sin afectar lo que se muestra)
  const usdForBuckets = useMemo(() => {
    const usd = onlyUSD(displayResults ?? []);
    return (usd || []).map((w) => ({
      ...w,
      reference_code: w.reference_code ?? w.referenceCode ?? "NOREF",
    }));
  }, [displayResults]);

  const { classify } = usePriceBuckets(usdForBuckets, {
    method: "quantile",
    byReference: true,
    minGroup: 12,
  });

  // Ordenar SOLO lo que se muestra (no uses usdResults aquí)
  const [sort, setSort] = useState("price_desc");
  const sortedResults = useMemo(() => {
    const arr = [...(displayResults || [])];
    const num = (x) =>
      x === null || x === undefined || x === "" ? NaN : Number(x);
    switch (sort) {
      case "price_asc":
        return arr.sort((a, b) => (num(a.cost) || 0) - (num(b.cost) || 0));
      case "price_desc":
        return arr.sort((a, b) => (num(b.cost) || 0) - (num(a.cost) || 0));
      case "year_asc":
        return arr.sort(
          (a, b) => (num(a.productionYear) || 0) - (num(b.productionYear) || 0)
        );
      case "year_desc":
        return arr.sort(
          (a, b) => (num(b.productionYear) || 0) - (num(a.productionYear) || 0)
        );
      default:
        return arr;
    }
  }, [displayResults, sort]);

  // Barra de paginación (arriba/abajo)
  const PaginationBar = () => {
    const { page, pages, hasPrev, hasNext, size, total } = pageResult;

    return (
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
  };

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
                colorFilter={colorFilter}
                conditionFilter={conditionFilter}
                extraInfoFilter={extraInfoFilter}
                setColorFilter={setColorFilter}
                setConditionFilter={setConditionFilter}
                setExtraInfoFilter={setExtraInfoFilter}
                colorOptions={colorOptions}
                conditionOptions={conditionOptions}
                extraInfoOptions={extraInfoOptions}
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
                cost: watch.cost,
                reference_code:
                  watch.reference_code ?? watch.referenceCode ?? "NOREF",
              });
              return (
                <WatchCard
                  key={
                    watch.id ??
                    `${watch.referenceCode || watch.reference_code}-${
                      watch.createdAt ?? Math.random()
                    }`
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
