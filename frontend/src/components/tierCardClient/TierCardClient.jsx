import { Card, Button } from "react-bootstrap";

export default function TierCardClient({
  tier,
  currentPlan,
  isAdmin,
  onSelect,
}) {
  const features = [
    {
      label: "Monthly search limit",
      value: tier.searchLimit,
      render:
        tier.searchLimit === -1
          ? "✔ Unlimited searches"
          : `✔ ${tier.searchLimit} searches`,
    },
    {
      label: "Price drop notification",
      value: tier.priceDropNotification,
    },
    {
      label: "Search history",
      value: tier.searchHistoryLimit,
      render: `✔ ${tier.searchHistoryLimit} entries`,
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
    (f) => f.value === true || f.value > 0 || f.value === -1
  );
  const excluded = features.filter((f) => f.value === false || f.value === 0);

  const isCurrent = currentPlan ? currentPlan === tier.id : false;

  return (
    <Card className="h-100 shadow-sm border-0 bg-white rounded-4 p-3">
      <Card.Body className="d-flex flex-column">
        <h4 className="fw-bold text-center text-dark mb-1">{tier.name}</h4>
        <p className="text-center text-muted small mb-3">{tier.description}</p>

        <h5 className="fw-semibold text-center text-success mb-4">
          ${tier.price?.toFixed(2)}{" "}
          <span className="text-muted fs-6">/month</span>
        </h5>

        <ul className="list-unstyled small mb-4">
          {included.map((feat, idx) => (
            <li key={idx} className="text-success mb-1">
              {feat.render || "✔ " + feat.label}
            </li>
          ))}
          {tier.extraProperties?.map((prop, idx) => (
            <li key={`extra-${idx}`} className="text-muted fst-italic mb-1">
              ✔ {prop}
            </li>
          ))}
          {excluded.map((feat, idx) => (
            <li key={idx} className="text-muted mb-1">
              ✖ {feat.label}
            </li>
          ))}
        </ul>

        <div className="mt-auto">
          {isCurrent || isAdmin ? (
            <Button variant="outline-success" disabled className="w-100">
              Current Plan
            </Button>
          ) : (
            <Button variant="dark" className="w-100" onClick={onSelect}>
              Choose {tier.name}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
