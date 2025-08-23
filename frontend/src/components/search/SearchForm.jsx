import React from "react";
import { Button, Form, Row, Col, Spinner } from "react-bootstrap";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import ReferenceSuggestions from "./ReferenceSuggestions";

export default function SearchForm({
  filters,
  setFilters,
  onSubmit,
  loading = false,
  showAdvancedEnabled = true,
  showAdvanced = false,
  setShowAdvanced = () => {},
  autocompleteEnabled = false,
  suggestions = [],
  suggestionsOpen = false,
  suggestionsLoading = false,
}) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearField = (name) => {
    setFilters((prev) => ({ ...prev, [name]: "" }));
  };

  const handleWindowChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({ ...prev, window: value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <Form onKeyDown={handleKeyDown}>
      <Row className="g-3 align-items-end">
        {/* Reference Number */}
        <Col md={6} lg={6}>
          <Form.Group controlId="reference">
            <Form.Label>Reference Number</Form.Label>
            <div className="position-relative">
              <Form.Control
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
                  onSelect={(ref) =>
                    setFilters((p) => ({ ...p, reference: ref }))
                  }
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
          {showAdvancedEnabled && (
            <Button
              variant={showAdvanced ? "outline-secondary" : "outline-dark"}
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              disabled={loading}
            >
              {showAdvanced ? "Hide advanced" : "Show advanced"}
            </Button>
          )}
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

      {showAdvanced && (
        <Row className="g-3 mt-1">
          {/* Color */}
          <Col md={3}>
            <Form.Group controlId="color">
              <Form.Label>Color</Form.Label>
              <Form.Control
                name="color"
                value={filters.color || ""}
                onChange={handleChange}
                placeholder="Dial color"
                disabled={loading}
              />
            </Form.Group>
          </Col>

          {/* Condition */}
          <Col md={3}>
            <Form.Group controlId="condition">
              <Form.Label>Condition</Form.Label>
              <Form.Select
                name="condition"
                value={filters.condition || ""}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Any</option>
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="very_good">Very Good</option>
                <option value="good">Good</option>
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Material */}
          <Col md={3}>
            <Form.Group controlId="material">
              <Form.Label>Material</Form.Label>
              <Form.Control
                name="material"
                value={filters.material || ""}
                onChange={handleChange}
                placeholder="Steel, Gold, Titanium…"
                disabled={loading}
              />
            </Form.Group>
          </Col>

          {/* Production Year */}
          <Col md={3}>
            <Form.Group controlId="year">
              <Form.Label>Production Year</Form.Label>
              <Form.Control
                name="year"
                value={filters.year || ""}
                onChange={handleChange}
                placeholder="e.g. 2019"
                disabled={loading}
              />
            </Form.Group>
          </Col>

          {/* Min / Max Price */}
          <Col md={3}>
            <Form.Group controlId="priceMin">
              <Form.Label>Min Price</Form.Label>
              <Form.Control
                type="number"
                name="priceMin"
                value={filters.priceMin || ""}
                onChange={handleChange}
                placeholder="0"
                min="0"
                disabled={loading}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group controlId="priceMax">
              <Form.Label>Max Price</Form.Label>
              <Form.Control
                type="number"
                name="priceMax"
                value={filters.priceMax || ""}
                onChange={handleChange}
                placeholder="100000"
                min="0"
                disabled={loading}
              />
            </Form.Group>
          </Col>

          {/* Currency */}
          <Col md={3}>
            <Form.Group controlId="currency">
              <Form.Label>Currency</Form.Label>
              <Form.Select
                name="currency"
                value={filters.currency || ""}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Any</option>
                <option value="USD">USD</option>
                <option value="USDT">USDT</option>
                <option value="EUR">EUR</option>
                <option value="COP">COP</option>
              </Form.Select>
            </Form.Group>
          </Col>

          {/* Extra Info */}
          <Col md={6}>
            <Form.Group controlId="extraInfo">
              <Form.Label>Extra Info</Form.Label>
              <Form.Control
                name="extraInfo"
                value={filters.extraInfo || ""}
                onChange={handleChange}
                placeholder="Keywords (comma separated)"
                disabled={loading}
              />
            </Form.Group>
          </Col>

          {/* Brand */}
          <Col md={3}>
            <Form.Group controlId="brand">
              <Form.Label>Brand</Form.Label>
              <Form.Control
                name="brand"
                value={filters.brand || ""}
                onChange={handleChange}
                placeholder="Rolex, Omega…"
                disabled={loading}
              />
            </Form.Group>
          </Col>
        </Row>
      )}
    </Form>
  );
}
