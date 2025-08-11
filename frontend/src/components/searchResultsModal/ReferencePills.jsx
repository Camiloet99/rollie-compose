import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

export default function ReferencePills({
  references,
  isFavorite,
  toggleFavorite,
  loadingReference,
  isInFlight,
}) {
  if (!references?.length) return null;

  return (
    <div className="mb-4">
      <h6 className="fw-semibold text-muted mb-2">
        References in this search:
      </h6>
      <div className="d-flex flex-wrap gap-2">
        {references.map((ref) => (
          <OverlayTrigger
            key={ref}
            placement="top"
            overlay={
              <Tooltip>
                {isFavorite(ref) ? "Remove from favorites" : "Add to favorites"}
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
              disabled={isInFlight ? isInFlight(ref) : loadingReference === ref}
            >
              {isFavorite(ref) ? <AiFillHeart /> : <AiOutlineHeart />}
              {ref}
            </Button>
          </OverlayTrigger>
        ))}
      </div>
    </div>
  );
}
