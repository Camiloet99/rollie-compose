import { useState, useEffect } from "react";
import { Form, Button, Row, Col, InputGroup } from "react-bootstrap";

const defaultProps = {
  searchLimit: 0,
  priceDropNotification: false,
  searchHistoryLimit: 0,
  priceHistoryGraph: false,
  autocompleteReference: false,
  advancedSearch: false,
};

const TierForm = ({ initialData = null, onSubmit, onCancel }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [properties, setProperties] = useState({ ...defaultProps });
  const [extraProps, setExtraProps] = useState([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setPrice(initialData.price || 0);

      const mappedProps = { ...defaultProps };
      Object.keys(mappedProps).forEach((key) => {
        if (initialData[key] !== undefined) {
          mappedProps[key] = initialData[key];
        }
      });
      setProperties(mappedProps);

      if (Array.isArray(initialData.extraProperties)) {
        setExtraProps(initialData.extraProperties);
      }
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id: initialData?.id || null,
      name,
      description,
      price,
      searchLimit: properties.searchLimit,
      priceDropNotification: properties.priceDropNotification,
      searchHistoryLimit: properties.searchHistoryLimit,
      priceFluctuationGraph: properties.priceHistoryGraph,
      autocompleteReference: properties.autocompleteReference,
      advancedSearch: properties.advancedSearch,
      extraProperties: extraProps.join(","),
      active: initialData?.active ?? true,
    };

    onSubmit(payload);
  };

  const handleExtraChange = (idx, value) => {
    const updated = [...extraProps];
    updated[idx] = value;
    setExtraProps(updated);
  };

  const addExtraField = () => setExtraProps([...extraProps, ""]);
  const removeExtraField = (idx) => {
    const updated = [...extraProps];
    updated.splice(idx, 1);
    setExtraProps(updated);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h5 className="mb-4 text-dark fw-bold">
        {initialData ? "Edit Plan" : "Create New Plan"}
      </h5>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Label>Plan Name</Form.Label>
          <Form.Control
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Col>
        <Col md={6}>
          <Form.Label>Price (USD)</Form.Label>
          <Form.Control
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
          />
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Label>Monthly Search Limit</Form.Label>
        <InputGroup>
          <Form.Control
            type="number"
            value={properties.searchLimit}
            onChange={(e) =>
              setProperties({
                ...properties,
                searchLimit: parseInt(e.target.value),
              })
            }
            disabled={properties.searchLimit === -1}
            min="0"
          />
          <InputGroup.Text>
            <Form.Check
              type="switch"
              id="unlimitedSearch"
              label=""
              checked={properties.searchLimit === -1}
              onChange={(e) =>
                setProperties({
                  ...properties,
                  searchLimit: e.target.checked ? -1 : 0,
                })
              }
            />
            <span className="ms-2">Unlimited</span>
          </InputGroup.Text>
        </InputGroup>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Search History Limit</Form.Label>
        <Form.Control
          type="number"
          value={properties.searchHistoryLimit}
          onChange={(e) =>
            setProperties({
              ...properties,
              searchHistoryLimit: parseInt(e.target.value),
            })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          label="Price Drop Notifications"
          checked={properties.priceDropNotification}
          onChange={(e) =>
            setProperties({
              ...properties,
              priceDropNotification: e.target.checked,
            })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          label="Historical Price Graph"
          checked={properties.priceHistoryGraph}
          onChange={(e) =>
            setProperties({
              ...properties,
              priceHistoryGraph: e.target.checked,
            })
          }
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="switch"
          label="Autocomplete by Reference"
          checked={properties.autocompleteReference}
          onChange={(e) =>
            setProperties({
              ...properties,
              autocompleteReference: e.target.checked,
            })
          }
        />
      </Form.Group>

      <Form.Check
        type="switch"
        label="Advanced Multi-Parameter Search"
        checked={properties.advancedSearch}
        onChange={(e) =>
          setProperties({
            ...properties,
            advancedSearch: e.target.checked,
          })
        }
        className="mb-4"
      />

      <hr className="my-4" />

      <Form.Group className="mb-3">
        <Form.Label className="fw-semibold">Extra Properties</Form.Label>
        {extraProps.length === 0 && (
          <div className="text-muted small mb-2">No extra properties yet.</div>
        )}
        {extraProps.map((val, idx) => (
          <InputGroup className="mb-2" key={idx}>
            <Form.Control
              value={val}
              onChange={(e) => handleExtraChange(idx, e.target.value)}
            />
            <Button
              variant="outline-danger"
              onClick={() => removeExtraField(idx)}
            >
              ✖
            </Button>
          </InputGroup>
        ))}
        <Button
          variant="outline-primary"
          size="sm"
          className="mt-2"
          onClick={addExtraField}
        >
          + Add Extra Property
        </Button>
      </Form.Group>

      <div className="mt-4 d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="dark">
          {initialData ? "Update" : "Create"}
        </Button>
      </div>
    </Form>
  );
};

export default TierForm;
