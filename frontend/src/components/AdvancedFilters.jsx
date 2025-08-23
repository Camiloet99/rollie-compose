import { Row, Col, Form } from "react-bootstrap";

export default function AdvancedFilters({
  filters,
  handleChange,
  loading = false,
}) {
  return (
    <Row className="g-3 mt-3">
      {/* Color */}
      <Col md={3}>
        <Form.Group controlId="color">
          <Form.Label>Color</Form.Label>
          <Form.Control
            type="text"
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
            <option value="fair">Fair</option>
          </Form.Select>
        </Form.Group>
      </Col>

      {/* Material */}
      <Col md={3}>
        <Form.Group controlId="material">
          <Form.Label>Material</Form.Label>
          <Form.Control
            type="text"
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
            type="number"
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
            type="text"
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
            type="text"
            name="brand"
            value={filters.brand || ""}
            onChange={handleChange}
            placeholder="Rolex, Omega…"
            disabled={loading}
          />
        </Form.Group>
      </Col>
    </Row>
  );
}
