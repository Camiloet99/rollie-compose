import { Button, Badge } from "react-bootstrap";
import { useCompareStore } from "../../store/compareStore";
import "./CompareButton.css";

export default function CompareButton() {
  const { items, open } = useCompareStore();
  if (!items.length) return null;

  return (
    <Button
      onClick={open}
      className="compare-fab position-fixed"
      aria-label="Open compare"
      style={{ right: 16, bottom: 16 }}
    >
      <span className="compare-fab__label">Compare</span>
      <Badge className="compare-fab__badge ms-2">{items.length}</Badge>
    </Button>
  );
}
