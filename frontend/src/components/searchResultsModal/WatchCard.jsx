import { Card, Row, Col, Badge, Button } from "react-bootstrap";
import CompareToggle from "../compare/CompareToggle";
import moment from "moment";
import { formatPrice } from "../../utils/formatPrice";

const renderBadges = (text, variant, uppercase = false) => {
  if (!text) return null;
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, idx) => (
      <Badge bg={variant} key={idx} className="me-1 text-capitalize">
        {uppercase ? item.toUpperCase() : item}
      </Badge>
    ));
};

function TierBadge({ tier }) {
  if (!tier) return null;
  const label = tier.toUpperCase();
  return (
    <Badge
      bg="light"
      className={`tier-badge tier-${tier}`}
      title={`Price tier: ${label}`}
    >
      {label}
    </Badge>
  );
}

export default function WatchCard({ watch, priceTier }) {
  const price = watch.montoFinal ?? watch.monto ?? null;
  const year = watch.anio || "Unknown";
  const listed = watch.asOfDate
    ? moment(watch.asOfDate).format("MMM D, YYYY")
    : watch.createdAt
    ? moment(watch.createdAt).format("MMM D, YYYY")
    : "Unknown";

  return (
    <Card
      className="mb-3 shadow-sm border-0 rounded-4 p-3"
      style={{ background: "#ffffff" }}
    >
      <Row>
        <Col md={6} className="d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="fw-bold mb-2">
              {watch.brand ? `${watch.brand} ` : ""}
              {watch.modelo || ""}
            </h5>
            <TierBadge tier={priceTier} />
          </div>

          <div className="mb-1 text-muted small">
            <strong>Production Year:</strong> {year}
          </div>

          <div className="mb-1 text-muted small">
            <strong>Listed:</strong> {listed}
          </div>

          {/* Estado y Condición */}
          {(watch.estado || watch.condicion) && (
            <div className="mb-2">
              {watch.estado && (
                <>
                  <strong>Status:</strong>{" "}
                  {renderBadges(watch.estado, "secondary")}
                  <span className="me-2" />
                </>
              )}
              {watch.condicion && (
                <>
                  <strong>Condition:</strong>{" "}
                  {renderBadges(watch.condicion, "info")}
                </>
              )}
            </div>
          )}

          {/* Color */}
          {watch.color && (
            <div className="mb-2">
              <strong>Color:</strong>{" "}
              <Badge bg="dark" className="me-1 text-capitalize">
                {watch.color}
              </Badge>
            </div>
          )}

          {/* Bracelet */}
          {watch.bracelet && (
            <div className="mb-2">
              <strong>Bracelet:</strong>{" "}
              <Badge bg="light" text="dark" className="me-1 text-capitalize">
                {watch.bracelet}
              </Badge>
            </div>
          )}
        </Col>

        <Col
          md={3}
          className="d-flex flex-column justify-content-center align-items-start"
        >
          {/* Precio + moneda en claro */}
          <div className="fw-semibold fs-5 text-success mb-1">
            {formatPrice(price, watch.currency || "USD")}{" "}
            {watch.currency && (
              <span className="text-muted small ms-1">({watch.currency})</span>
            )}
          </div>
        </Col>

        <Col
          md={3}
          className="d-flex flex-column justify-content-center align-items-end text-end"
        >
          <Button variant="success" size="sm" className="mb-2 w-100">
            Request Info
          </Button>
          <Button variant="outline-dark" size="sm" className="w-100">
            Contact Seller
          </Button>
        </Col>
      </Row>

      {/* Compare al final, alineado a la derecha en md+ y centrado en xs */}
      <div className="d-flex justify-content-center justify-content-md-end mt-3">
        <CompareToggle watch={watch} />
      </div>
    </Card>
  );
}
