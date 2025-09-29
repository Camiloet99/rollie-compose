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
  return (
    <Card
      className="mb-3 shadow-sm border-0 rounded-4 p-3"
      style={{ background: "#ffffff" }}
    >
      <Row>
        <Col md={6} className="d-flex flex-column justify-content-center">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="fw-bold mb-2">{watch.referenceCode}</h5>
            <TierBadge tier={priceTier} />
          </div>

          <div className="mb-1 text-muted small">
            <strong>Production Year:</strong>{" "}
            {watch.productionYear || "Unknown"}
          </div>

          <div className="mb-1 text-muted small">
            <strong>Listed:</strong>{" "}
            {watch.createdAt
              ? moment(watch.asOfDate).format("MMM D, YYYY")
              : "Unknown"}
          </div>

          {watch.condition && (
            <div className="mb-2">
              <strong>Condition:</strong>{" "}
              {renderBadges(watch.condition, "info")}
            </div>
          )}

          {watch.colorDial && (
            <div className="mb-2">
              <strong>Color:</strong>{" "}
              <Badge bg="dark" className="me-1 text-capitalize">
                {watch.colorDial}
              </Badge>
            </div>
          )}
        </Col>

        <Col
          md={3}
          className="d-flex flex-column justify-content-center align-items-start"
        >
          {watch.extraInfo && (
            <div className="mb-3">
              <strong>Extra Info:</strong>{" "}
              {renderBadges(watch.extraInfo, "warning", true)}
            </div>
          )}
          <div className="fw-semibold fs-5 text-success mb-1">
            {formatPrice(watch.cost, "USD")}
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
