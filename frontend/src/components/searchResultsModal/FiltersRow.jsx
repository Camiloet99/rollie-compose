import { Row, Col, Form } from "react-bootstrap";

const capitalizeSmart = (text = "") =>
  text
    .split(",")
    .map((w) => {
      const t = w.trim();
      return t === t.toUpperCase()
        ? t
        : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    })
    .join(", ");

export default function FiltersRow({
  // filtros activos
  colorFilter,
  conditionFilter,
  brandFilter,
  estadoFilter,
  // setters
  setColorFilter,
  setConditionFilter,
  setBrandFilter,
  setEstadoFilter,
  // opciones
  colorOptions = [],
  conditionOptions = [],
  brandOptions = [],
  estadoOptions = [],
}) {
  return (
    <Row className="mb-3 filter-row">
      <Col md={3}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Brand
          </Form.Label>
          <Form.Select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            disabled={brandOptions.length === 0}
            aria-label="Filter by brand"
          >
            <option value="">All Brands</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>
                {capitalizeSmart(b)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Status
          </Form.Label>
          <Form.Select
            value={estadoFilter || ""}
            onChange={(e) => setEstadoFilter(e.target.value)}
            disabled={estadoOptions.length === 0}
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            {estadoOptions.map((st) => (
              <option key={st} value={st}>
                {capitalizeSmart(st)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Bracelet / Color
          </Form.Label>
          <Form.Select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            disabled={colorOptions.length === 0}
            aria-label="Filter by bracelet or color"
          >
            <option value="">All Bracelet/Color</option>
            {colorOptions.map((opt) => (
              <option key={opt} value={opt}>
                {capitalizeSmart(opt)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col md={3}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Condition
          </Form.Label>
          <Form.Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            disabled={conditionOptions.length === 0}
            aria-label="Filter by condition"
          >
            <option value="">All Conditions</option>
            {conditionOptions.map((cond) => (
              <option key={cond} value={cond}>
                {capitalizeSmart(cond)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}
