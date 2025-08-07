import { Helmet } from "react-helmet";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageTransition from "../components/PageTransition";
import { Modal, Button, Spinner, Row, Col } from "react-bootstrap";
import { useEffect, useState } from "react";
import { getAllTiers } from "../services/tierService";
import { upgradeUserPlan } from "../services/userService";
import TierCardClient from "../components/tierCardClient/TierCardClient";

export default function Plans() {
  const { user, login } = useAuth(); // usamos login para actualizar el user en el contexto
  const navigate = useNavigate();
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await getAllTiers();
        setTiers(data.filter((t) => t.active));
      } catch (e) {
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };
    fetchTiers();
  }, []);

  const handlePayment = async () => {
    try {
      await upgradeUserPlan(selectedTier.id);
      toast.success(`You've been upgraded to ${selectedTier.name}!`);
      const updatedUser = { ...user, planId: selectedTier.id };
      login(updatedUser); // actualiza el user con el nuevo planId
      setSelectedTier(null);
      navigate("/search");
    } catch (err) {
      toast.error("Plan upgrade failed.");
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Plans & Pricing - Rollie</title>
      </Helmet>

      <div className="container mt-5 mb-5">
        <h2 className="text-center fw-semibold mb-2">Choose Your Plan</h2>
        <p className="text-center text-muted mb-4">
          Find the right plan for your watch journey.
        </p>

        {loading ? (
          <div className="text-center mt-5">
            <Spinner animation="border" variant="dark" />
          </div>
        ) : (
          <Row className="justify-content-center g-4">
            {tiers.map((tier) => (
              <Col key={tier.id} xs={12} sm={10} md={6} lg={5} xl={4}>
                <TierCardClient
                  tier={tier}
                  currentPlan={user?.planId}
                  isAdmin={user?.role === "admin"}
                  onSelect={() => setSelectedTier(tier)}
                />
              </Col>
            ))}
          </Row>
        )}

        <div className="text-center mt-4">
          <small className="text-muted">
            Logged in as <strong>{user?.email}</strong>
          </small>
        </div>
      </div>

      {/* Modal de pago */}
      <Modal
        show={!!selectedTier}
        onHide={() => setSelectedTier(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Plan Upgrade</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-1">
            You are about to upgrade to the{" "}
            <strong>{selectedTier?.name}</strong> plan.
          </p>
          <h5 className="fw-bold mt-2">
            ${selectedTier?.price?.toFixed(2)} USD
          </h5>
          <p className="text-muted small mt-2">
            This is a simulated payment. No real charge will be made.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedTier(null)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handlePayment}>
            Pay Now
          </Button>
        </Modal.Footer>
      </Modal>
    </PageTransition>
  );
}
