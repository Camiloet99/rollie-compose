import {
  Row,
  Col,
  Card,
  Button,
  Form,
  Badge,
  Table,
  Stack,
  ButtonGroup,
} from "react-bootstrap";
import { useState, useMemo } from "react";
import { useCrm } from "./CrmProvider";
import DealModal from "./DealModal";

export default function SalesDashboard() {
  const { state, selectors, actions } = useCrm();
  const [showDeal, setShowDeal] = useState(false);

  const pipeline = selectors.getPipelineStats();
  const totalPipeline = useMemo(
    () =>
      ["prospect", "qualified", "negotiation", "closing"].reduce(
        (s, k) => s + pipeline[k].value,
        0
      ),
    [pipeline]
  );
  const deals = selectors.getDealsList(state.currentStageFilter);

  const stageBadge = (stage) =>
    stage === "closed-won" ? (
      <Badge bg="success">Closed Won</Badge>
    ) : (
      <Badge bg="warning" text="dark">
        {stage.replace("-", " ")}
      </Badge>
    );

  return (
    <>
      {/* Header acciones */}
      <Stack direction="horizontal" className="mb-3" gap={3}>
        <h4 className="mb-0 fw-bold">Sales Pipeline</h4>
        <div className="ms-auto d-flex align-items-center gap-2">
          <Form.Select size="sm" defaultValue="This Month" className="w-auto">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
            <option>All Time</option>
          </Form.Select>
          <Button size="sm" onClick={() => setShowDeal(true)}>
            + New Deal
          </Button>
        </div>
      </Stack>

      {/* KPI Cards */}
      <Row xs={1} md={2} lg={4} className="g-3 mb-3">
        <Col>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Total Pipeline Value</div>
              <div className="display-6 fw-bold">
                ${totalPipeline.toLocaleString()}
              </div>
              <div className="text-success small">
                {state.deals.length} active deals
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Closed This Month</div>
              <div className="display-6 fw-bold">
                ${pipeline["closed-won"].value.toLocaleString()}
              </div>
              <div className="text-success small">
                {pipeline["closed-won"].count} deals closed
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Average Deal Size</div>
              <div className="display-6 fw-bold">
                $
                {state.deals.length
                  ? Math.round(
                      totalPipeline / state.deals.length
                    ).toLocaleString()
                  : 0}
              </div>
              <div className="text-muted small">Based on active deals</div>
            </Card.Body>
          </Card>
        </Col>
        <Col>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-muted small">Win Rate</div>
              <div className="display-6 fw-bold">
                {(() => {
                  const c = pipeline["closed-won"].count;
                  const d = state.deals.length + c;
                  return d ? Math.round((c / d) * 100) : 0;
                })()}
                %
              </div>
              <div className="text-success small">Last 30 days</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pipeline stages */}
      <Card className="shadow-sm mb-3">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <strong>Pipeline Stages</strong>
            <small className="text-muted">Click stage to filter deals</small>
          </div>
        </Card.Header>
        <Card.Body>
          <Row xs={1} md={5} className="g-3">
            {[
              "prospect",
              "qualified",
              "negotiation",
              "closing",
              "closed-won",
            ].map((s) => (
              <Col key={s}>
                <Card
                  className={`h-100 border-2 ${
                    state.currentStageFilter === s
                      ? "border-primary"
                      : "border-light"
                  } ${s === "closed-won" ? "bg-light" : ""}`}
                  role="button"
                  onClick={() => actions.setStageFilter(s)}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="text-uppercase small fw-semibold text-muted">
                        {s.replace("-", " ")}
                      </div>
                      <Badge bg={s === "closed-won" ? "success" : "primary"}>
                        {pipeline[s].count}
                      </Badge>
                    </div>
                    <div className="h5 mb-1">
                      ${pipeline[s].value.toLocaleString()}
                    </div>
                    <div className="text-muted small">
                      {pipeline[s].count} deals
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de deals */}
      <Card className="shadow-sm">
        <Card.Header className="bg-white d-flex align-items-center">
          <strong className="me-auto">
            {state.currentStageFilter
              ? `${state.currentStageFilter} Deals`
              : "All Deals"}
          </strong>
          <ButtonGroup size="sm">
            <Button
              variant="outline-secondary"
              onClick={() => actions.setStageFilter(null)}
            >
              Clear Filter
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => alert("Export CSV")}
            >
              Export
            </Button>
          </ButtonGroup>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover bordered className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Stage</th>
                  <th>Watch</th>
                  <th>Reference</th>
                  <th>Contact</th>
                  <th>Cost</th>
                  <th>Proposed Price</th>
                  <th>Expected Profit</th>
                  <th style={{ width: 110 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const watch = state.inventory.find(
                    (w) => w.id === deal.watchId
                  );
                  const contact = state.contacts.find(
                    (c) => c.id === deal.contactId
                  );
                  if (!watch) return null;
                  const price = deal.proposedPrice || deal.salePrice || 0;
                  const profit = price - (watch.cost || 0);
                  return (
                    <tr key={deal.id}>
                      <td>
                        {new Date(
                          deal.createdDate || deal.saleDate
                        ).toLocaleDateString()}
                      </td>
                      <td>{stageBadge(deal.stage)}</td>
                      <td>
                        {watch.brand} {watch.model}
                      </td>
                      <td>{watch.reference}</td>
                      <td>
                        {contact
                          ? `${contact.firstName} ${contact.lastName}`
                          : "Unknown"}
                      </td>
                      <td>${watch.cost.toLocaleString()}</td>
                      <td>${price.toLocaleString()}</td>
                      <td
                        className={profit >= 0 ? "text-success" : "text-danger"}
                      >
                        ${profit.toLocaleString()}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => alert("Deal detail")}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {deals.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      No deals
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <DealModal show={showDeal} onHide={() => setShowDeal(false)} />
    </>
  );
}
