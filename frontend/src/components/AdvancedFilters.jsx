import { Row, Col, Form } from "react-bootstrap";

// AdvancedFilters.jsx
export default function AdvancedFilters({
  filters,
  handleChange,
  loading = false,
}) {
  return (
    <Row className="g-3 mt-3">
      {/* Average from (window) */}
      <Col md={3}>
        <Form.Group controlId="window">
          <Form.Label>Average from</Form.Label>
          <Form.Select
            name="window"
            value={filters.window ?? ""}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">No average (raw)</option>
            <option value="today">Today (avg)</option>
            <option value="7d">Last 7 days (avg)</option>
            <option value="15d">Last 15 days (avg)</option>
          </Form.Select>
        </Form.Group>
      </Col>
      {/* Brand */}
      <Col md={3}>
        <Form.Group controlId="brand">
          <Form.Label>Brand</Form.Label>
          <Form.Control
            type="text"
            name="brand"
            value={filters.brand || ""}
            onChange={handleChange}
            placeholder="Rolex, Omega…"
            disabled={loading}
          />
        </Form.Group>
      </Col>
      {/* Status (estado) */}
      <Col md={3}>
        <Form.Group controlId="estado">
          <Form.Label>Status</Form.Label>
          <Form.Control
            type="text"
            name="estado"
            value={filters.estado || ""}
            onChange={handleChange}
            placeholder="e.g. n7, bnib, full set…"
            disabled={loading}
          />
        </Form.Group>
      </Col>
      {/* Bracelet */}
      <Col md={3}>
        <Form.Group controlId="bracelet">
          <Form.Label>Bracelet</Form.Label>
          <Form.Control
            type="text"
            name="bracelet"
            value={filters.bracelet || ""}
            onChange={handleChange}
            placeholder="Oyster, Jubilee…"
            disabled={loading}
          />
        </Form.Group>
      </Col>
      {/* Color (se mapea a colorDial en el payload del request) */}
      <Col md={3}>
        <Form.Group controlId="color">
          <Form.Label>Bracelet / Color</Form.Label>
          <Form.Control
            type="text"
            name="color"
            value={filters.color || ""}
            onChange={handleChange}
            placeholder="Dial color (e.g. Tiffany, Blue…)"
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
            <option value="brand new">Brand New</option>
            <option value="like new">Like New</option>
            <option value="very good">Very Good</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="used">Used</option>
          </Form.Select>
        </Form.Group>
      </Col>
      {/* Production Year */}
      <Col md={3}>
        <Form.Group controlId="year">
          <Form.Label>Production Year</Form.Label>
          <Form.Control
            type="number"
            name="year"
            value={filters.year || ""}
            onChange={handleChange}
            placeholder="e.g. 2019"
            min="1900"
            max="2100"
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
      <Col md={3}>
        <Form.Group controlId="sort">
          <Form.Label>Sort</Form.Label>
          <Form.Select
            name="sort"
            value={filters.sort || ""}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Default (Date ↓)</option>
            <option value="date_desc">Date: new → old</option>
            <option value="date_asc">Date: old → new</option>
            <option value="price_desc">Price: high → low</option>
            <option value="price_asc">Price: low → high</option>
            <option value="year_desc">Year: new → old</option>
            <option value="year_asc">Year: old → new</option>
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}
