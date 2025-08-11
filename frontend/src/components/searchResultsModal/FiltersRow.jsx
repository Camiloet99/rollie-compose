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
  colorFilter,
  conditionFilter,
  extraInfoFilter,
  setColorFilter,
  setConditionFilter,
  setExtraInfoFilter,
  colorOptions,
  conditionOptions,
  extraInfoOptions,
}) {
  return (
    <Row className="mb-4 filter-row">
      <Col md={4}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Color
          </Form.Label>
          <Form.Select
            value={colorFilter}
            onChange={(e) => setColorFilter(e.target.value)}
            disabled={colorOptions.length === 0}
          >
            <option value="">All Colors</option>
            {colorOptions.map((color) => (
              <option key={color} value={color}>
                {capitalizeSmart(color)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>

      <Col md={4}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Condition
          </Form.Label>
          <Form.Select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            disabled={conditionOptions.length === 0}
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

      <Col md={4}>
        <Form.Group>
          <Form.Label className="small fw-semibold text-muted">
            Extra Info
          </Form.Label>
          <Form.Select
            value={extraInfoFilter}
            onChange={(e) => setExtraInfoFilter(e.target.value)}
            disabled={extraInfoOptions.length === 0}
          >
            <option value="">All Extra Info</option>
            {extraInfoOptions.map((info) => (
              <option key={info} value={info}>
                {capitalizeSmart(info)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      </Col>
    </Row>
  );
}
