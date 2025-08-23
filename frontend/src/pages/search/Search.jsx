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
  reference: "",
  brand: "",
  condition: "",
  color: "",
  material: "",
  year: "",
  priceMin: "",
  priceMax: "",
  currency: "",
  extraInfo: "",
  window: "today",
  adv: "",
};

export default function Search() {
  const { user, tiers } = useAuth();

  // ---- deep links ----
  const [filters, setFilters] = usePersistentSearchParams(DEFAULT_FILTERS);

  const [showAdvanced, setShowAdvanced] = useState(Boolean(filters.adv));
  const [results, setResults] = useState([]);
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

  // ---- autocomplete: debounce + abort ----
  const [referenceSuggestions, setReferenceSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!autocompleteEnabled) {
      setReferenceSuggestions([]);
      setSuggestionsOpen(false);
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
      // abort anterior
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
        // ignorar cancelaciones
        setReferenceSuggestions([]);
        setSuggestionsOpen(true);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [filters.reference, autocompleteEnabled]);

  const onPickSuggestion = (val, _setFilters) => {
    _setFilters((prev) => ({ ...prev, reference: val }));
    setReferenceSuggestions([]);
    setSuggestionsOpen(false);
  };

  useEffect(() => {
    setFilters((prev) => ({ ...prev, adv: showAdvanced ? "1" : "" }));
  }, [showAdvanced]);

  const runSearch = async (activeFilters) => {
    const payload = {
      referenceCode: activeFilters.reference?.trim() || null,
      // Solo incluye avanzados si están activos; si no, los manda null
      colorDial:
        showAdvancedEnabled && showAdvanced
          ? activeFilters.color || null
          : null,
      productionYear:
        showAdvancedEnabled && showAdvanced && activeFilters.year
          ? parseInt(activeFilters.year)
          : null,
      condition:
        showAdvancedEnabled && showAdvanced
          ? activeFilters.condition || null
          : null,
      minPrice:
        showAdvancedEnabled && showAdvanced && activeFilters.priceMin
          ? parseFloat(activeFilters.priceMin)
          : null,
      maxPrice:
        showAdvancedEnabled && showAdvanced && activeFilters.priceMax
          ? parseFloat(activeFilters.priceMax)
          : null,
      currency:
        showAdvancedEnabled && showAdvanced
          ? activeFilters.currency || null
          : null,
      watchInfo:
        showAdvancedEnabled && showAdvanced
          ? activeFilters.extraInfo || null
          : null,
      window: activeFilters.window || "today",
    };
    return await searchWatches(payload, user.userId);
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    if (!Object.values(filters).some((val) => val)) return;

    try {
      setLoading(true);
      const fetchedResults = await runSearch(filters);

      setLimitExceeded(false);
      if (searchHistoryLimit > 0) {
        const toSave = { ...filters };
        delete toSave.adv; // no guardar adv en historial
        saveSearchToHistory(toSave, searchHistoryLimit);
        setHistoryRefreshToggle((prev) => !prev);
      }

      setResults(fetchedResults);
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
      setResults([]);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRepeatSearch = async (prevFilters) => {
    setFilters(prevFilters); // también actualizará la URL
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
          prevFilters.window?.length ||
          prevFilters.extraInfo?.length);

      setShowAdvanced(Boolean(isAdvanced));
      const fetchedResults = await runSearch({
        ...prevFilters,
        adv: undefined,
      });

      setLimitExceeded(false);
      setResults(fetchedResults);
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
      setResults([]);
      setShowModal(true);
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
        results={results}
        loading={loading}
      />

      <CompareButton />
      <CompareDrawer />
    </PageTransition>
  );
}
