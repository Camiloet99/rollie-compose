import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  Row,
  Col,
  Badge,
  Modal,
  Button,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { AiFillHeart } from "react-icons/ai";
import "./FavoriteWatches.css";

const formatBadge = (text) => {
  if (!text) return "";
  return text === text.toUpperCase()
    ? text
    : text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export default function FavoriteWatches() {
  const { favorites, removeFavorite } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedWatch, setSelectedWatch] = useState(null);
  const [animateHeart, setAnimateHeart] = useState(null);

  if (!favorites || favorites.length === 0) return null;

  const handleRemoveClick = (watch) => {
    setAnimateHeart(watch.referenceCode);
    setTimeout(() => {
      setSelectedWatch(watch);
      setShowConfirm(true);
      setAnimateHeart(null);
    }, 300);
  };

  const confirmRemove = () => {
    if (selectedWatch) {
      removeFavorite(selectedWatch.referenceCode);
    }
    setShowConfirm(false);
    setSelectedWatch(null);
  };

  return (
    <>
      <Row xs={1} md={2} lg={2} className="g-4">
        {favorites.map((watch, index) => (
          <Col key={index}>
            <Card className="shadow-sm h-100 border-0 rounded-4 position-relative">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Remove from favorites</Tooltip>}
              >
                <Button
                  variant="link"
                  className={`position-absolute top-0 end-0 p-2 text-danger ${
                    animateHeart === watch.referenceCode ? "heart-pop" : ""
                  }`}
                  onClick={() => handleRemoveClick(watch)}
                >
                  <AiFillHeart size={20} />
                </Button>
              </OverlayTrigger>
              <Card.Body>
                <Card.Title className="fs-5 fw-semibold text-dark">
                  {watch.referenceCode}
                </Card.Title>

                <Card.Text className="fw-bold text-success fs-6 mb-2">
                  ${watch.minPrice?.toLocaleString()} – $
                  {watch.maxPrice?.toLocaleString()}
                </Card.Text>

                {/* Conditions */}
                {watch.conditions?.length > 0 && (
                  <div className="mb-2">
                    {watch.conditions.map((cond, i) => (
                      <Badge key={i} bg="secondary" className="me-1">
                        {formatBadge(cond)}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Extra Info */}
                {watch.extraInfo?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-muted small me-2">Extra:</span>
                    {watch.extraInfo.map((info, i) => (
                      <Badge key={i} bg="warning" className="me-1 text-dark">
                        {info.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Years */}
                {watch.years?.length > 0 && (
                  <Card.Text className="text-muted small mb-1">
                    Years: {watch.years.join(", ")}
                  </Card.Text>
                )}

                {/* Colors */}
                {watch.colors?.length > 0 && (
                  <Card.Text className="text-muted small mb-1">
                    Colors: {watch.colors.join(", ")}
                  </Card.Text>
                )}

                {/* Currencies */}
                {watch.currencies?.length > 0 && (
                  <Card.Text className="text-muted small mb-1">
                    Currencies: {watch.currencies.join(", ")}
                  </Card.Text>
                )}

                {/* Last updated */}
                {watch.lastCreatedAt && (
                  <Card.Text className="text-muted small mb-0">
                    Last update:{" "}
                    {new Date(watch.lastCreatedAt).toLocaleDateString()}
                  </Card.Text>
                )}
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Confirm removal modal */}
      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Remove Favorite</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove this watch from your favorites?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRemove}>
            Remove
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
