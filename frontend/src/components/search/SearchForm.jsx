import { Button, Form, Row, Col } from "react-bootstrap";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import ReferenceSuggestions from "./ReferenceSuggestions";

export default function SearchForm({
  filters,
  setFilters,
  onSubmit,
  loading,
  showAdvancedEnabled,
  showAdvanced,
  setShowAdvanced,
  autocompleteEnabled,
  suggestions,
  suggestionsOpen,
  suggestionsLoading,
  onPickSuggestion,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
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
            {autocompleteEnabled && (
              <ReferenceSuggestions
                open={suggestionsOpen}
                loading={suggestionsLoading}
                items={suggestions}
                onPick={(val) => onPickSuggestion(val, setFilters)}
              />
            )}
          </div>
        </Form.Group>
      </Col>

      <Col md={6} className="d-flex justify-content-end align-items-end">
        {showAdvancedEnabled ? (
          <Button
            variant="outline-secondary"
            className="me-2"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={loading}
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
        ) : (
          // skeleton cuando aún no se conoce el tier
          <div className="skeleton sk-h-28 sk-w-40 me-2" />
        )}

        <Button
          type="submit"
          variant="dark"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? (
            "Searching..."
          ) : (
            <>
              <FaSearch className="me-1" /> Search
            </>
          )}
        </Button>
      </Col>
    </Row>
  );
}
