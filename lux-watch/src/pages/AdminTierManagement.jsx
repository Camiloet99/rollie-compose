import { useEffect, useState } from "react";
import {
  getAllTiers,
  activateTier,
  createTier,
  updateTier,
  deactivateTier,
  deleteTier,
} from "../services/tierService";
import { Button, Spinner, Modal, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { toast } from "react-toastify";
import PageTransition from "../components/PageTransition";
import TierForm from "../components/TierForm";
import TierCard from "../components/TierCard";

export default function AdminTierManagement() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const data = await getAllTiers();
      setTiers(data);
    } catch (e) {
      toast.error("Error loading tiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  const handleToggleActive = async (tier) => {
    try {
      if (tier.active) {
        await deactivateTier(tier.id);
        toast.info(`Deactivated: ${tier.name}`);
      } else {
        await activateTier(tier.id);
        toast.success(`Activated: ${tier.name}`);
      }
      fetchTiers();
    } catch (e) {
      toast.error("Failed to toggle tier");
    }
  };

  const handleDelete = async (tierId) => {
    if (window.confirm("Are you sure you want to delete this tier?")) {
      try {
        await deleteTier(tierId);
        toast.success("Tier deleted");
        fetchTiers();
      } catch (e) {
        toast.error("Failed to delete tier");
      }
    }
  };

  const handleSubmitTier = async (tier) => {
    try {
      if (tier.id) {
        await updateTier(tier.id, tier);
        toast.success("Tier updated");
      } else {
        await createTier(tier);
        toast.success("Tier created");
      }
      fetchTiers();
      handleCloseModal();
    } catch (e) {
      toast.error("Failed to save tier");
    }
  };

  const handleOpenModal = (tier = null) => {
    setSelectedTier(tier);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTier(null);
  };

  return (
    <PageTransition>
      <Helmet>
        <title>Admin: Manage Tiers - Rollie</title>
      </Helmet>

      <div className="container mt-4 mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3>Manage Plans</h3>
          <Button variant="dark" onClick={() => handleOpenModal()}>
            + Add New Plan
          </Button>
        </div>

        {loading ? (
          <div className="text-center mt-5">
            <Spinner animation="border" variant="dark" />
          </div>
        ) : tiers?.length === 0 || tiers == null ? (
          <p className="text-muted text-center">No tiers found.</p>
        ) : (
          <Row className="g-4">
            {tiers.map((tier) => (
              <Col md={6} lg={4} key={tier.id}>
                <TierCard
                  tier={tier}
                  onToggle={handleToggleActive}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                />
              </Col>
            ))}
          </Row>
        )}

        {/* Modal para Crear / Editar Tier */}
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedTier ? "Edit Tier" : "New Tier"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TierForm
              initialData={selectedTier}
              onCancel={handleCloseModal}
              onSubmit={handleSubmitTier}
            />
          </Modal.Body>
        </Modal>
      </div>
    </PageTransition>
  );
}
