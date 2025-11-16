import { Row, Col, Form } from "react-bootstrap";

// AdvancedFilters.jsx
export default function AdvancedFilters({
  filters,
  handleChange,
  loading = false,
}) {
  const hasWindow = Boolean(filters.window);

  return (
    <Row className="g-3 mt-3">
      {/* Average from (window) -> se usa con as_of_date/created_at */}
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

      {/* Brand -> columna brand */}
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

      {/* Status (estado) -> columna estado */}
      <Col md={3}>
        <Form.Group controlId="estado">
          <Form.Label>Status</Form.Label>
          <Form.Control
            type="text"
            name="estado"
            value={filters.estado || ""}
            onChange={handleChange}
            placeholder="n6, n12, bnib…"
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

      {/* Color */}
      <Col md={3}>
        <Form.Group controlId="color">
          <Form.Label>Dial / Color</Form.Label>
          <Form.Control
            type="text"
            name="color"
            value={filters.color || ""}
            onChange={handleChange}
            placeholder="Tiffany, Blue, Black…"
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
            <option value="HKD">HKD</option>
            <option value="EUR">EUR</option>
            {/* agrega otras que uses realmente */}
          </Form.Select>
        </Form.Group>
      </Col>

      {/* Keyword / Text */}
      <Col md={6}>
        <Form.Group controlId="text">
          <Form.Label>Keyword / Text</Form.Label>
          <Form.Control
            type="text"
            name="text"
            value={filters.text || ""}
            onChange={handleChange}
            placeholder="full set, box, papers…"
            disabled={loading}
          />
        </Form.Group>
      </Col>

      {/* Average mode: ALL / LOW / MID / HIGH */}
      <Col md={3}>
        <Form.Group controlId="avgMode">
          <Form.Label>Average focus</Form.Label>
          <Form.Select
            name="avgMode"
            value={filters.avgMode || ""}
            onChange={handleChange}
            disabled={loading || !hasWindow} // sólo tiene sentido si hay window
          >
            <option value="">All prices (overall avg)</option>
            <option value="low">Low (bottom market)</option>
            <option value="mid">Mid (middle market)</option>
            <option value="high">High (top market)</option>
          </Form.Select>
        </Form.Group>
      </Col>

      {/* Sort */}
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
