// components/AdvancedFilters.jsx
import { Row, Col, Form } from "react-bootstrap";

export default function AdvancedFilters({ filters, handleChange }) {
  return (
    <Row className="g-3 mt-3">
      <Col md={4}>
        <Form.Group controlId="color">
          <Form.Label>Color Dial</Form.Label>
          <Form.Control
            type="text"
            name="color"
            value={filters.color}
            onChange={handleChange}
            placeholder="e.g. Black"
          />
        </Form.Group>
      </Col>

      <Col md={4}>
        <Form.Group controlId="year">
          <Form.Label>Production Year</Form.Label>
          <Form.Control
            type="number"
            name="year"
            value={filters.year}
            onChange={handleChange}
            placeholder="e.g. 2022"
          />
        </Form.Group>
      </Col>

      <Col md={4}>
        <Form.Group controlId="condition">
          <Form.Label>Watch Condition</Form.Label>
          <Form.Select
            name="condition"
            value={filters.condition}
            onChange={handleChange}
          >
            {["", "New", "Used", "Like New"].map((opt, idx) => (
              <option value={opt} key={idx}>
                {opt || "Select..."}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group controlId="priceMin">
          <Form.Label>Min Cost</Form.Label>
          <Form.Control
            type="number"
            name="priceMin"
            value={filters.priceMin}
            onChange={handleChange}
            placeholder="5000"
          />
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group controlId="priceMax">
          <Form.Label>Max Cost</Form.Label>
          <Form.Control
            type="number"
            name="priceMax"
            value={filters.priceMax}
            onChange={handleChange}
            placeholder="25000"
          />
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group controlId="currency">
          <Form.Label>Currency</Form.Label>
          <Form.Select
            name="currency"
            value={filters.currency}
            onChange={handleChange}
          >
            {["", "USD", "HKD"].map((opt, idx) => (
              <option value={opt} key={idx}>
                {opt || "Select..."}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group controlId="extraInfo">
          <Form.Label>Watch Info</Form.Label>
          <Form.Control
            type="text"
            name="extraInfo"
            value={filters.extraInfo}
            onChange={handleChange}
            placeholder="e.g. Limited Edition"
          />
        </Form.Group>
      </Col>
    </Row>
  );
}
