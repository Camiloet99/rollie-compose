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
 *  - onPickSuggestion: (value, setFilters) => void   // 👈 NUEVO
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
  onPickSuggestion, // 👈 NUEVO
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

  const handleWindowChange = (e) => {
    setFilters((prev) => ({ ...prev, window: e.target.value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Form onKeyDown={handleKeyDown}>
      {/* ===== BASIC: SOLO Reference + Data from ===== */}
      <Row className="g-3 align-items-end">
        {/* Reference Number */}
        <Col md={6} lg={6}>
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
                      // el contenedor cerrará el dropdown (setSuggestionsOpen(false) + limpiar items)
                      onPickSuggestion(ref, setFilters);
                    } else {
                      // fallback: al menos completar el input aquí
                      setFilters((p) => ({ ...p, reference: ref }));
                    }
                    // reenfocar input
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

        {/* Data from (window) */}
        <Col md={2} lg={2}>
          <Form.Group controlId="window">
            <Form.Label>Data from</Form.Label>
            <Form.Select
              name="window"
              value={filters.window || "today"}
              onChange={handleWindowChange}
              disabled={loading}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days (avg)</option>
              <option value="15d">Last 15 days (avg)</option>
            </Form.Select>
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
