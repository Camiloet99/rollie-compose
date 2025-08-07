import { Button, Card, Form, Badge } from "react-bootstrap";

export default function TierCard({ tier, onToggle, onEdit, onDelete }) {
  const features = [
    {
      label: "Monthly search limit",
      value: tier.searchLimit,
      render:
        tier.searchLimit === -1
          ? "Unlimited searches"
          : `${tier.searchLimit} Searches/month`,
    },
    {
      label: "Price drop notification",
      value: tier.priceDropNotification,
    },
    {
      label: "Search history",
      value: tier.searchHistoryLimit,
      render: `${tier.searchHistoryLimit} entries`,
    },
    {
      label: "Price fluctuation chart",
      value: tier.priceFluctuationGraph,
    },
    {
      label: "Autocomplete by reference",
      value: tier.autocompleteReference,
    },
    {
      label: "Advanced search",
      value: tier.advancedSearch,
    },
  ];

  const included = features.filter(
    (f) => f.value === true || f.value === -1 || f.value > 0
  );
  const excluded = features.filter(
    (f) => f.value === false || f.value === 0 || f.value === null
  );

  return (
    <Card
      className={`h-100 shadow-sm border-0 d-flex flex-column ${
        !tier.active ? "bg-light text-muted" : ""
      }`}
    >
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Badge bg="dark" className="px-3 py-2 fs-8">
            {tier.name?.toUpperCase()}
          </Badge>
          <Form.Check
            type="switch"
            id={`switch-${tier.id}`}
            checked={tier.active}
            onChange={() => onToggle(tier)}
          />
        </div>

        <div className="mb-2 text-secondary small">{tier.description}</div>
        <h5 className="fw-bold mb-3 text-dark">${tier.price?.toFixed(2)}</h5>

        <div className="flex-grow-1">
          {included.length > 0 && (
            <div className="mb-3">
              <h6 className="text-success fw-semibold small">✔ Included</h6>
              <ul className="ps-3 mb-2">
                {included.map((feat, idx) => (
                  <li key={idx}>{feat.render || feat.label}</li>
                ))}
                {tier.extraProperties?.length > 0 &&
                  tier.extraProperties.map((prop, idx) => (
                    <li key={`extra-${idx}`} className="fst-italic text-muted">
                      {prop}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {excluded.length > 0 && (
            <div className="mb-3">
              <h6 className="text-danger fw-semibold small">✖ Not Included</h6>
              <ul className="ps-3 text-muted small">
                {excluded.map((feat, idx) => (
                  <li key={idx}>{feat.label}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-auto pt-2 d-flex justify-content-between border-top">
          <Button
            size="sm"
            variant="outline-dark"
            onClick={() => onEdit(tier)}
            className="w-50 me-2"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => onDelete(tier.id)}
            className="w-50"
          >
            Delete
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
