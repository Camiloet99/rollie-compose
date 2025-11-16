import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../../contexts/AuthContext";
import {
  Button,
  Form,
  Container,
  Row,
  Col,
  Card,
  Alert,
} from "react-bootstrap";
import PageTransition from "../../components/PageTransition";
import { saveSearchToHistory } from "../../utils/history";
import SearchHistory from "../../components/SearchHistory";
import {
  autocompleteReference,
  searchWatches,
  getWatchByReference,
} from "../../services/watchService";
import ActiveFilterChips from "../../components/search/ActiveFilterChips";
import SearchResultsModal from "../../components/searchResultsModal/SearchResultsModal";
import AdvancedFilters from "../../components/AdvancedFilters";
import SearchForm from "../../components/search/SearchForm";
import { usePersistentSearchParams } from "../../hooks/usePersistentSearchParams";
import "./Search.css";
import CompareButton from "../../components/compare/CompareButton";
import CompareDrawer from "../../components/compare/CompareDrawer";

const DEFAULT_FILTERS = {
  reference: "", // se mapea a modelo / referencia principal
  brand: "",
  estado: "",
  condition: "", // se mapea a 'condicion'
  year: "",
  bracelet: "",
  color: "",
  currency: "",
  priceMin: "",
  priceMax: "",
  text: "", // texto libre -> clean_text u otros campos
  window: "",
  avgMode: "", // ⬅️ NEW
  adv: "",
  sort: "",
};

export default function Search() {
  const { user, tiers } = useAuth();
  const DEFAULT_PAGE = 0;
  const DEFAULT_SIZE = 20;
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [size, setSize] = useState(DEFAULT_SIZE);

  const [pageResult, setPageResult] = useState({
    items: [],
    total: 0,
    page: DEFAULT_PAGE,
    size: DEFAULT_SIZE,
    pages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // ---- deep links ----
  const [filters, setFilters] = usePersistentSearchParams(DEFAULT_FILTERS);

  const [showAdvanced, setShowAdvanced] = useState(Boolean(filters.adv));
  const [showModal, setShowModal] = useState(false);
  const [historyRefreshToggle, setHistoryRefreshToggle] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---- features por tier ----
  const userTier = useMemo(
    () => tiers?.find((t) => t.id === user?.planId),
    [tiers, user?.planId]
  );
  const [showAdvancedEnabled, setShowAdvancedEnabled] = useState(false);
  const [searchHistoryLimit, setSearchHistoryLimit] = useState(0);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(false);

  useEffect(() => {
    if (userTier) {
      setShowAdvancedEnabled(Boolean(userTier.advancedSearch));
      setSearchHistoryLimit(userTier.searchHistoryLimit || 0);
      setAutocompleteEnabled(Boolean(userTier.autocompleteReference));
    }
  }, [userTier]);

  useEffect(() => {
    setPage(0);
  }, [
    filters.reference,
    filters.color,
    filters.brand,
    filters.estado,
    filters.year,
    filters.condition,
    filters.priceMin,
    filters.priceMax,
    filters.currency,
    filters.bracelet,
    filters.text,
    filters.sort,
    filters.window, // ⬅️ importante
    filters.avgMode, // ⬅️ también
    showAdvanced,
  ]);

  const [referenceSuggestions, setReferenceSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const [suppressNextAutocomplete, setSuppressNextAutocomplete] =
    useState(false);

  useEffect(() => {
    if (!filters.window && filters.avgMode) {
      setFilters((prev) => ({ ...prev, avgMode: "" }));
    }
  }, [filters.window, filters.avgMode, setFilters]);

  useEffect(() => {
    if (!autocompleteEnabled) {
      setReferenceSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    // ⬅️ si acabamos de seleccionar una sugerencia, saltamos este ciclo
    if (suppressNextAutocomplete) {
      setSuppressNextAutocomplete(false);
      return;
    }

    const value = `${filters.reference ?? ""}`.trim();
    if (value.length < 3) {
      setReferenceSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    setSuggestionsLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const suggestions = await autocompleteReference(value, {
          signal: controller.signal,
        });
        setReferenceSuggestions(suggestions || []);
        setSuggestionsOpen(true);
      } catch (_e) {
        setReferenceSuggestions([]);
        setSuggestionsOpen(true);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.reference, autocompleteEnabled, suppressNextAutocomplete]);

  const onPickSuggestion = (val, _setFilters) => {
    // NEW: evita que el useEffect vuelva a abrir el dropdown en este cambio
    setSuppressNextAutocomplete(true);

    _setFilters((prev) => ({ ...prev, reference: val }));
    setReferenceSuggestions([]);
    setSuggestionsOpen(false);
  };

  // Persistir el flag "adv" en la URL
  useEffect(() => {
    setFilters((prev) => ({ ...prev, adv: showAdvanced ? "1" : "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAdvanced]);

  const runSearch = async (activeFilters, p = page, s = size) => {
    const ref = activeFilters.reference?.trim();
    const sort = activeFilters.sort || "date_desc";

    const win =
      showAdvancedEnabled && showAdvanced
        ? String(activeFilters.window ?? "").toLowerCase()
        : "";

    // Búsqueda simple por referencia (modelo)
    if (!showAdvancedEnabled || !showAdvanced) {
      if (!ref) {
        return {
          items: [],
          total: 0,
          page: p,
          size: s,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        };
      }
      // este endpoint sigue igual
      return await getWatchByReference(ref, user.userId, p, s, sort);
    }

    // ==== BÚSQUEDA AVANZADA: WatchFilter ALIGNADO CON BACKEND ====
    const payload = {
      // referencia principal: el backend la mapea a modelo
      modelo: ref || null,

      // Campos directos según WatchFilter
      brand: activeFilters.brand || null,
      color: activeFilters.color || null,
      condicion: activeFilters.condition || null,
      bracelet: activeFilters.bracelet || null,
      estado: activeFilters.estado || null,

      // Año exacto (si quisieras rangos, usarías anioFrom/anioTo)
      anio: activeFilters.year ? parseInt(activeFilters.year, 10) : null,

      // Rango de precio sobre monto_final
      priceMin: activeFilters.priceMin
        ? parseFloat(activeFilters.priceMin)
        : null,
      priceMax: activeFilters.priceMax
        ? parseFloat(activeFilters.priceMax)
        : null,

      // Moneda
      currency: activeFilters.currency || null,

      // Texto libre -> clean_text
      text: activeFilters.text || null,
    };

    const avgMode = activeFilters.avgMode || null;

    return await searchWatches(
      payload,
      user.userId,
      win,
      p,
      s,
      sort,
      avgMode // ⬅️ NEW
    );
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();

    setSuggestionsOpen(false);
    if (!Object.values(filters).some((val) => val)) return;

    try {
      setLoading(true);
      // siempre arranca en page 0 cuando dispara manual
      const fetched = await runSearch(filters, 0, size);
      setPage(0);

      setLimitExceeded(false);
      if (searchHistoryLimit > 0) {
        const toSave = { ...filters };
        delete toSave.adv;
        saveSearchToHistory(toSave, searchHistoryLimit);
        setHistoryRefreshToggle((prev) => !prev);
      }

      setPageResult(fetched);
      setShowModal(true);
    } catch (err) {
      console.error("Search error:", err);
      const errorMsg = err?.data?.error || "";
      if (errorMsg.includes("ERR01")) {
        setLimitExceeded(true);
        setShowModal(false);
        return;
      }
      setLimitExceeded(false);
      setPageResult({
        items: [],
        total: 0,
        page,
        size,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatSearch = async (prevFilters) => {
    setFilters(prevFilters);
    try {
      setLoading(true);

      const isAdvanced =
        showAdvancedEnabled &&
        (prevFilters.color?.length ||
          prevFilters.year?.length ||
          prevFilters.condition?.length ||
          prevFilters.priceMin?.length ||
          prevFilters.priceMax?.length ||
          prevFilters.currency?.length ||
          prevFilters.brand?.length ||
          prevFilters.bracelet?.length ||
          prevFilters.estado?.length ||
          prevFilters.text?.length); // NEW: texto libre

      setShowAdvanced(Boolean(isAdvanced));

      const fetched = await runSearch(
        { ...prevFilters, adv: undefined },
        0,
        size
      );
      setPage(0);

      setLimitExceeded(false);
      setPageResult(fetched);
      setShowModal(true);
    } catch (err) {
      console.error("Search error:", err);
      const errorMsg = err?.data?.error || "";
      if (errorMsg.includes("ERR01")) {
        setLimitExceeded(true);
        setShowModal(false);
        return;
      }
      setLimitExceeded(false);
      setPageResult({
        items: [],
        total: 0,
        page,
        size,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = async (nextPage) => {
    try {
      setLoading(true);
      const fetched = await runSearch(filters, nextPage, size);
      setPage(nextPage);
      setPageResult(fetched);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeSize = async (nextSize) => {
    try {
      setLoading(true);
      const fetched = await runSearch(filters, 0, nextSize);
      setSize(nextSize);
      setPage(0);
      setPageResult(fetched);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Search Watches - Rollie</title>
      </Helmet>
      <Container className="mt-4">
        <div className="text-center mb-4">
          <h2 className="fw-semibold">Explore the Market</h2>
          <p className="text-muted small">
            Find accurate prices and specs for luxury timepieces.
          </p>
        </div>

        {limitExceeded && (
          <Alert variant="warning" className="text-center mt-3">
            <strong>You've reached your monthly search limit.</strong>
            <br />
            Upgrade your plan to perform more searches.
            <div className="mt-2">
              <a href="/plans" className="btn btn-sm btn-dark">
                Upgrade Plan
              </a>
            </div>
          </Alert>
        )}

        <Form onSubmit={handleSearch}>
          <Card className="p-4 shadow-sm border-0">
            <SearchForm
              filters={filters}
              setFilters={setFilters}
              onSubmit={handleSearch}
              loading={loading}
              showAdvancedEnabled={showAdvancedEnabled}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              autocompleteEnabled={autocompleteEnabled}
              suggestions={referenceSuggestions}
              suggestionsOpen={suggestionsOpen}
              suggestionsLoading={suggestionsLoading}
              onPickSuggestion={onPickSuggestion}
            />

            <ActiveFilterChips filters={filters} setFilters={setFilters} />

            {showAdvanced && (
              <AdvancedFilters
                filters={filters}
                handleChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
                loading={loading}
              />
            )}

            <Row className="mt-3">
              <Col className="d-flex gap-2 justify-content-end">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS);
                    setShowAdvanced(false);
                    setReferenceSuggestions([]);
                    setSuggestionsOpen(false);
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
              </Col>
            </Row>
          </Card>
        </Form>
      </Container>

      {searchHistoryLimit > 0 && (
        <SearchHistory
          onSearchRepeat={handleRepeatSearch}
          refreshToggle={historyRefreshToggle}
          onClear={() => setHistoryRefreshToggle(!historyRefreshToggle)}
          searchHistoryLimit={searchHistoryLimit}
        />
      )}

      <SearchResultsModal
        show={showModal && !limitExceeded}
        onHide={() => setShowModal(false)}
        pageResult={pageResult} // <-- ahora PageResult completo
        loading={loading}
        onChangePage={handleChangePage} // <-- callbacks de paginación
        onChangeSize={handleChangeSize}
      />

      <CompareButton />
      <CompareDrawer />
    </PageTransition>
  );
}
