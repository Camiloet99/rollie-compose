import { useAuth } from "../../contexts/AuthContext";
import {
  Modal,
  Card,
  Button,
  OverlayTrigger,
  Tooltip,
  Badge,
  Row,
  Col,
  Form,
} from "react-bootstrap";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import {
  addFavorite,
  removeFavoriteCall,
} from "../../services/favoriteService";
import { useState, useMemo, useEffect } from "react";
import moment from "moment";
import "./SearchResultsModal.css";

export default function SearchResultsModal({ show, onHide, results = [] }) {
  const { user, favorites, setFavorites } = useAuth();
  const [loadingReference, setLoadingReference] = useState(null);

  const [colorFilter, setColorFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [extraInfoFilter, setExtraInfoFilter] = useState("");

  useEffect(() => {
    if (!show) {
      setColorFilter("");
      setConditionFilter("");
      setExtraInfoFilter("");
    }
  }, [show]);

  const isFavorite = (reference) =>
    favorites?.some((fav) => fav.referenceCode === reference);

  const toggleFavorite = async (reference) => {
    setLoadingReference(reference);
    try {
      const updatedFavorites = isFavorite(reference)
        ? await removeFavoriteCall(user.userId, reference)
        : await addFavorite(user.userId, reference);
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setLoadingReference(null);
    }
  };

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

  // === Filtro compuesto final ===
  const filteredResults = useMemo(() => {
    return results.filter((watch) => {
      const colorMatch = colorFilter ? watch.colorDial === colorFilter : true;
      const conditionMatch = conditionFilter
        ? watch.condition?.includes(conditionFilter)
        : true;
      const extraMatch = extraInfoFilter
        ? watch.extraInfo?.toUpperCase().includes(extraInfoFilter)
        : true;
      return colorMatch && conditionMatch && extraMatch;
    });
  }, [results, colorFilter, conditionFilter, extraInfoFilter]);

  const filteredByAllExceptCondition = useMemo(() => {
    return results.filter((r) => {
      const colorMatch = colorFilter ? r.colorDial === colorFilter : true;
      const extraMatch = extraInfoFilter
        ? r.extraInfo?.toUpperCase().includes(extraInfoFilter)
        : true;
      return colorMatch && extraMatch;
    });
  }, [results, colorFilter, extraInfoFilter]);

  const filteredByAllExceptExtra = useMemo(() => {
    return results.filter((r) => {
      const colorMatch = colorFilter ? r.colorDial === colorFilter : true;
      const conditionMatch = conditionFilter
        ? r.condition?.includes(conditionFilter)
        : true;
      return colorMatch && conditionMatch;
    });
  }, [results, colorFilter, conditionFilter]);

  // === Filtrados parciales para opciones dinámicas ===
  const filteredByAllExceptColor = useMemo(() => {
    return results.filter((r) => {
      const conditionMatch = conditionFilter
        ? r.condition?.includes(conditionFilter)
        : true;
      const extraMatch = extraInfoFilter
        ? r.extraInfo?.toUpperCase().includes(extraInfoFilter)
        : true;
      return conditionMatch && extraMatch;
    });
  }, [results, conditionFilter, extraInfoFilter]);

  // === Opciones actualizadas dinámicamente ===
  const colorOptions = useMemo(() => {
    const all = filteredByAllExceptColor
      .map((r) => r.colorDial)
      .filter(Boolean);
    return [...new Set(all)];
  }, [filteredByAllExceptColor]);

  const conditionOptions = useMemo(() => {
    const all = filteredByAllExceptCondition.flatMap((r) =>
      r.condition ? r.condition.split(",").map((c) => c.trim()) : []
    );
    return [...new Set(all.filter(Boolean))];
  }, [filteredByAllExceptCondition]);

  const extraInfoOptions = useMemo(() => {
    const all = filteredByAllExceptExtra.flatMap((r) =>
      r.extraInfo
        ? r.extraInfo.split(",").map((e) => e.trim().toUpperCase())
        : []
    );
    return [...new Set(all.filter(Boolean))];
  }, [filteredByAllExceptExtra]);

  const capitalizeSmart = (text) => {
    if (!text) return "";
    return text
      .split(",")
      .map((word) => {
        const trimmed = word.trim();
        return trimmed === trimmed.toUpperCase()
          ? trimmed
          : trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
      })
      .join(", ");
  };

  // === Reseteo automático si se pierde la opción seleccionada
  useEffect(() => {
    if (colorFilter && !colorOptions.includes(colorFilter)) {
      setColorFilter("");
    }
    if (conditionFilter && !conditionOptions.includes(conditionFilter)) {
      setConditionFilter("");
    }
    if (extraInfoFilter && !extraInfoOptions.includes(extraInfoFilter)) {
      setExtraInfoFilter("");
    }
  }, [colorOptions, conditionOptions, extraInfoOptions]);

  const uniqueReferences = useMemo(() => {
    const set = new Set(results.map((w) => w.referenceCode.trim()));
    return Array.from(set);
  }, [results]);

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fs-4 fw-semibold">Search Results</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-0">
        {results.length === 0 ? (
          <p className="text-center text-muted mt-4">No results found.</p>
        ) : (
          <>
            {/* Filtros */}
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

            {/* Referencias */}
            <div className="mb-4">
              <h6 className="fw-semibold text-muted mb-2">
                References in this search:
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {uniqueReferences.map((ref) => (
                  <OverlayTrigger
                    key={ref}
                    placement="top"
                    overlay={
                      <Tooltip>
                        {isFavorite(ref)
                          ? "Remove from favorites"
                          : "Add to favorites"}
                      </Tooltip>
                    }
                  >
                    <Button
                      variant={isFavorite(ref) ? "danger" : "outline-secondary"}
                      size="sm"
                      className={`favorite-pill d-flex align-items-center gap-1 ${
                        isFavorite(ref) ? "pop-heart" : ""
                      }`}
                      onClick={() => toggleFavorite(ref)}
                      disabled={loadingReference === ref}
                    >
                      {isFavorite(ref) ? <AiFillHeart /> : <AiOutlineHeart />}
                      {ref}
                    </Button>
                  </OverlayTrigger>
                ))}
              </div>
            </div>

            {/* Tarjetas */}
            {filteredResults.map((watch) => (
              <Card
                key={watch.id}
                className="mb-3 shadow-sm border-0 rounded-4 p-3"
                style={{ background: "#ffffff" }}
              >
                <Row>
                  <Col
                    md={6}
                    className="d-flex flex-column justify-content-center"
                  >
                    <h5 className="fw-bold mb-2">{watch.referenceCode}</h5>
                    <div className="mb-1 text-muted small">
                      <strong>Production Year:</strong>{" "}
                      {watch.productionYear || "Unknown"}
                    </div>
                    <div className="mb-1 text-muted small">
                      <strong>Listed:</strong>{" "}
                      {watch.createdAt
                        ? moment(watch.createdAt).format("MMM D, YYYY")
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
                      ${watch.cost?.toLocaleString()}
                    </div>
                    <div className="text-muted text-uppercase small mb-2">
                      {watch.currency || ""}
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
              </Card>
            ))}
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="border-0 pt-0">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
