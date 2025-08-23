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
  results = [],
  loading = false,
}) {
  const { isFavorite, toggleFavorite, isInFlight } = useFavoritesOptimistic();

  const { filters, setFilters, options, filteredResults } = useResultFilters(
    results,
    show
  );
  const { colorFilter, conditionFilter, extraInfoFilter } = filters;
  const { setColorFilter, setConditionFilter, setExtraInfoFilter } = setFilters;
  const { colorOptions, conditionOptions, extraInfoOptions } = options;

  const uniqueReferences = useMemo(() => {
    const set = new Set(
      results.map((w) => w.referenceCode?.trim()).filter(Boolean)
    );
    return Array.from(set);
  }, [results]);

  // Filtrar solo USD
  const usdResults = useMemo(
    () => onlyUSD(filteredResults ?? []),
    [filteredResults]
  );

  // Clasificación de precios
  const { classify } = usePriceBuckets(usdResults, {
    method: "quantile",
    byReference: true,
    minGroup: 12,
  });

  // Orden
  const [sort, setSort] = useState("price_desc");
  const sortedResults = useMemo(() => {
    const arr = [...usdResults];
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
  }, [usdResults, sort]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4 fw-semibold">Search Results</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-0">
        {!loading && results.length > 0 && (
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
            </div>

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

        {loading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <WatchCardSkeleton key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-muted mt-4">No results found.</p>
        ) : (
          <div className="mt-3">
            {sortedResults.map((watch) => (
              <WatchCard
                key={
                  watch.id ??
                  `${watch.referenceCode}-${watch.createdAt ?? Math.random()}`
                }
                watch={watch}
                priceTier={classify(watch)}
              />
            ))}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
