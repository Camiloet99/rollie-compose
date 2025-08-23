import { Form } from "react-bootstrap";
import { useCompareStore, keyOf, MAX_ITEMS } from "../../store/compareStore";

export default function CompareToggle({ watch }) {
  const { items, toggleItem, open } = useCompareStore();
  const isOn = items.some((w) => keyOf(w) === keyOf(watch));

  const onChange = () => {
    const res = toggleItem(watch);
    if (res?.action === "added" && items.length + 1 >= 2) open();
    if (res?.action === "limit")
      alert(`Solo puedes comparar hasta ${MAX_ITEMS} relojes`);
  };

  return (
    <div className="compare-floater">
      {" "}
      {/* <-- clase responsive */}
      <Form.Check
        type="checkbox"
        label="Compare"
        checked={isOn}
        onChange={onChange}
        className="m-0"
      />
    </div>
  );
}
