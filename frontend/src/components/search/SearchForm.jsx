import React, { useRef } from "react";
import { Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import ReferenceSuggestions from "./ReferenceSuggestions";

/**
 * Props:
 *  - filters, setFilters
 *  - onSubmit, loading
 *  - showAdvanced, setShowAdvanced
 *  - autocompleteEnabled, suggestions, suggestionsOpen, suggestionsLoading
 *  - onPickSuggestion: (value, setFilters) => void
 */
export default function SearchForm({
  filters,
  setFilters,
  onSubmit,
  loading = false,
  showAdvanced = false,
  setShowAdvanced = () => {},
  autocompleteEnabled = false,
  suggestions = [],
  suggestionsOpen = false,
  suggestionsLoading = false,
  onPickSuggestion,
}) {
  const referenceInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearField = (name) => {
    setFilters((prev) => ({ ...prev, [name]: "" }));
    if (name === "reference" && referenceInputRef.current) {
      referenceInputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Form onKeyDown={handleKeyDown}>
      {/* ===== BASIC: SOLO Reference ===== */}
      <Row className="g-3 align-items-end">
        {/* Reference Number */}
        <Col md={8} lg={8}>
          <Form.Group controlId="reference">
            <Form.Label>Reference Number</Form.Label>
            <div className="position-relative">
              <Form.Control
                ref={referenceInputRef}
                type="text"
                name="reference"
                value={filters.reference || ""}
                onChange={handleChange}
                placeholder="e.g. 126610LN"
                autoComplete="off"
                disabled={loading}
              />
              {filters.reference && (
                <FaTimesCircle
                  role="button"
                  className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted"
                  onClick={() => clearField("reference")}
                  title="Clear"
                />
              )}

              {autocompleteEnabled && (
                <ReferenceSuggestions
                  open={suggestionsOpen}
                  loading={suggestionsLoading}
                  items={suggestions}
                  onPick={(ref) => {
                    if (typeof onPickSuggestion === "function") {
                      onPickSuggestion(ref, setFilters); // cierra dropdown en el contenedor
                    } else {
                      setFilters((p) => ({ ...p, reference: ref }));
                    }
                    if (referenceInputRef.current) {
                      referenceInputRef.current.focus();
                      try {
                        const end = String(ref || "").length;
                        referenceInputRef.current.setSelectionRange(end, end);
                      } catch {}
                    }
                  }}
                />
              )}
            </div>
          </Form.Group>
        </Col>

        {/* Botones */}
        <Col xs="12" md="auto" className="ms-auto d-flex gap-2">
          <Button
            variant={showAdvanced ? "outline-secondary" : "outline-dark"}
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            disabled={loading}
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </Button>

          <Button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="d-flex align-items-center"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" /> Searching…
              </>
            ) : (
              <>
                <FaSearch className="me-2" />
                Search
              </>
            )}
          </Button>
        </Col>
      </Row>
    </Form>
  );
}
