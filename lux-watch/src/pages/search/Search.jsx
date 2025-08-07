import { useEffect, useState } from "react";
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
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import PageTransition from "../../components/PageTransition";
import { saveSearchToHistory } from "../../utils/history";
import SearchHistory from "../../components/SearchHistory";
import {
  autocompleteReference,
  searchWatches,
  getWatchByReference,
} from "../../services/watchService";
import SearchResultsModal from "../../components/searchResultsModal/SearchResultsModal";
import AdvancedFilters from "../../components/AdvancedFilters";
import "./Search.css"; // Import your custom styles

export default function Search() {
  const [filters, setFilters] = useState({
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
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [historyRefreshToggle, setHistoryRefreshToggle] = useState(false);
  const { user, tiers } = useAuth();
  const [referenceSuggestions, setReferenceSuggestions] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // Nuevo: estados derivados del tier del usuario
  const [showAdvancedEnabled, setShowAdvancedEnabled] = useState(false);
  const [searchHistoryLimit, setSearchHistoryLimit] = useState(0);
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);

  // Obtener tier actual del usuario
  const userTier = tiers?.find((t) => t.id === user?.planId);

  useEffect(() => {
    if (userTier) {
      setShowAdvancedEnabled(userTier.advancedSearch || false);
      setSearchHistoryLimit(userTier.searchHistoryLimit || 0);
      setAutocompleteEnabled(userTier.autocompleteReference || false);
    }
  }, [userTier]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });

    if (name === "reference") {
      setIsTyping(true);
      if (autocompleteEnabled && value.length >= 3) {
        // ✅ solo si está permitido
        try {
          const suggestions = await autocompleteReference(value);
          setReferenceSuggestions(suggestions);
        } catch (err) {
          setReferenceSuggestions([]);
        }
      } else {
        setReferenceSuggestions([]);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!Object.values(filters).some((val) => val)) return;

    try {
      let fetchedResults = [];

      if (showAdvancedEnabled && showAdvanced) {
        const payload = {
          referenceCode: filters.reference,
          colorDial: filters.color,
          productionYear: filters.year ? parseInt(filters.year) : null,
          watchCondition: filters.condition,
          minPrice: filters.priceMin ? parseFloat(filters.priceMin) : null,
          maxPrice: filters.priceMax ? parseFloat(filters.priceMax) : null,
          currency: filters.currency || null,
          watchInfo: filters.extraInfo || null,
        };
        fetchedResults = await searchWatches(payload, user.userId);
      } else {
        if (!filters.reference) return;
        fetchedResults = await getWatchByReference(
          filters.reference,
          user.userId
        );
      }

      // ✅ Resetear límite si fue exitosa
      setLimitExceeded(false);

      // Guardar en historial si aplica
      if (searchHistoryLimit > 0) {
        saveSearchToHistory(filters, searchHistoryLimit);
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
    }
  };

  const handleRepeatSearch = async (prevFilters) => {
    setFilters(prevFilters);
    try {
      let fetchedResults = [];

      const isAdvanced =
        showAdvancedEnabled &&
        (prevFilters.color?.length ||
          prevFilters.year?.length ||
          prevFilters.condition?.length ||
          prevFilters.priceMin?.length ||
          prevFilters.priceMax?.length ||
          prevFilters.currency?.length ||
          prevFilters.extraInfo?.length);

      if (isAdvanced) {
        setShowAdvanced(true);
        const payload = {
          referenceCode: prevFilters.reference,
          colorDial: prevFilters.color,
          productionYear: prevFilters.year ? parseInt(prevFilters.year) : null,
          watchCondition: prevFilters.condition,
          minPrice: prevFilters.priceMin
            ? parseFloat(prevFilters.priceMin)
            : null,
          maxPrice: prevFilters.priceMax
            ? parseFloat(prevFilters.priceMax)
            : null,
          currency: prevFilters.currency || null,
          watchInfo: prevFilters.extraInfo || null,
        };
        fetchedResults = await searchWatches(payload, user.userId);
      } else {
        setShowAdvanced(false);
        if (!prevFilters.reference) return;
        fetchedResults = await getWatchByReference(
          prevFilters.reference,
          user.userId
        );
      }

      // ✅ Resetear límite si fue exitosa
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
            <Row className="g-3 align-items-end">
              <Col md={6}>
                <Form.Group controlId="reference">
                  <Form.Label>Reference Number</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      name="reference"
                      value={filters.reference}
                      onChange={handleChange}
                      placeholder="e.g. 126610LN"
                      autoComplete="off"
                    />
                    {autocompleteEnabled &&
                      isTyping &&
                      referenceSuggestions.length > 0 && (
                        <div
                          className="position-absolute bg-white border rounded shadow-sm mt-1 w-100 z-3"
                          style={{ maxHeight: "200px", overflowY: "auto" }}
                        >
                          {referenceSuggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="px-3 py-2 hover-bg-light text-muted"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                setFilters((prev) => ({
                                  ...prev,
                                  reference: suggestion,
                                }));
                                setReferenceSuggestions([]);
                                setIsTyping(false);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </Form.Group>
              </Col>
              <Col md={6} className="d-flex justify-content-end">
                {showAdvancedEnabled && (
                  <Button
                    variant="outline-secondary"
                    className="me-2"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? (
                      <>
                        <FaTimesCircle className="me-1" /> Hide Filters
                      </>
                    ) : (
                      <>
                        <FaSearch className="me-1" /> Advanced
                      </>
                    )}
                  </Button>
                )}
                <Button type="submit" variant="dark">
                  <FaSearch className="me-1" /> Search
                </Button>
              </Col>
            </Row>
            {showAdvanced && (
              <AdvancedFilters filters={filters} handleChange={handleChange} />
            )}
          </Card>
        </Form>
      </Container>

      {searchHistoryLimit > 0 && (
        <SearchHistory
          onSearchRepeat={handleRepeatSearch}
          refreshToggle={historyRefreshToggle}
          onClear={() => setHistoryRefreshToggle(!historyRefreshToggle)}
          searchHistoryLimit={searchHistoryLimit} // 👈 aquí
        />
      )}

      <SearchResultsModal
        show={showModal && !limitExceeded}
        onHide={() => setShowModal(false)}
        results={results}
      />
    </PageTransition>
  );
}
