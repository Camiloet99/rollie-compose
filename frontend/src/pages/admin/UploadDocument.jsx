import { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import {
  Form,
  Button,
  Container,
  Card,
  Spinner,
  Alert,
  Table,
} from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import PageTransition from "../../components/PageTransition";
import dayjs from "dayjs";
import {
  uploadDocument,
  getUploadedDocuments,
} from "../../services/documentService";
import {
  getMarkupPercentage,
  updateMarkupPercentage,
} from "../../services/markupService";

export default function UploadDocument() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [markup, setMarkup] = useState(0);
  const [markupLoading, setMarkupLoading] = useState(true);
  const [updatingMarkup, setUpdatingMarkup] = useState(false);

  // NEW: fecha de referencia ("as of")
  const todayStr = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const [asOfDate, setAsOfDate] = useState(todayStr);

  const fetchMarkup = async () => {
    setMarkupLoading(true);
    try {
      const value = await getMarkupPercentage();
      setMarkup(value);
    } catch (err) {
      toast.error("Failed to load markup value.");
    } finally {
      setMarkupLoading(false);
    }
  };

  const handleMarkupUpdate = async (e) => {
    e.preventDefault();
    setUpdatingMarkup(true);
    try {
      await updateMarkupPercentage(markup);
      toast.success("Markup updated successfully.");
    } catch (err) {
      toast.error("Failed to update markup.");
    } finally {
      setUpdatingMarkup(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    // Validación estricta: solo .csv o .xlsx
    const okExt = /\.(csv|xlsx)$/i.test(f.name || "");
    if (!okExt) {
      toast.error("Only .csv or .xlsx files are supported.");
      e.target.value = ""; // reset input
      setFile(null);
      return;
    }
    setFile(f);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const result = await getUploadedDocuments();
      setLogs(result);
    } catch (err) {
      toast.error("Failed to load logs.");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    // Doble chequeo por si el input fue manipulado
    if (!/\.(csv|xlsx)$/i.test(file.name || "")) {
      toast.error("Only .csv or .xlsx files are supported.");
      return;
    }

    if (!asOfDate || dayjs(asOfDate).isAfter(dayjs(), "day")) {
      toast.error("Please choose a valid date (today or in the past).");
      return;
    }

    setLoading(true);
    try {
      await uploadDocument(file, asOfDate);
      toast.success("File uploaded successfully.");
      setFile(null);
      setAsOfDate(todayStr);
      fetchLogs();
    } catch (error) {
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchLogs();
      fetchMarkup();
    }
  }, [user]);

  if (!user || user.role !== "ADMIN") {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger" className="text-center w-100">
          <h5 className="mb-0">Access denied. Admins only.</h5>
        </Alert>
      </Container>
    );
  }

  return (
    <PageTransition>
      <Helmet>
        <title>Upload Price List - Rollie</title>
      </Helmet>

      <Container className="d-flex flex-column align-items-center mt-5">
        <Card
          className="shadow-lg border-0 p-4 w-100 mb-4"
          style={{ maxWidth: "540px" }}
        >
          <div className="text-center mb-4">
            <h4 className="fw-semibold mb-2">Upload Price Document</h4>
            <p className="text-muted small">
              Upload a recent CSV or Excel file (.csv / .xlsx) with the latest
              watch prices.
            </p>
          </div>

          <Form onSubmit={handleUpload}>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label className="fw-semibold">CSV / Excel File</Form.Label>
              <Form.Control
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                disabled={loading}
              />
              <Form.Text muted>
                Only .csv or .xlsx formats are supported.
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="formAsOfDate" className="mb-3">
              <Form.Label className="fw-semibold">
                What date do these data correspond to?
              </Form.Label>
              <Form.Control
                type="date"
                max={todayStr}
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                disabled={loading}
                required
              />
              <Form.Text muted>
                Only today or past dates can be selected.
              </Form.Text>
            </Form.Group>

            <Button
              type="submit"
              variant="dark"
              className="w-100 d-flex justify-content-center align-items-center"
              disabled={loading}
            >
              {loading && (
                <Spinner animation="border" size="sm" className="me-2" />
              )}
              {loading ? "Uploading..." : "Upload File"}
            </Button>
          </Form>

          {(file || asOfDate) && (
            <Alert variant="info" className="mt-3 text-center small mb-0">
              {file && (
                <>
                  Selected file: <strong>{file.name}</strong>
                  <br />
                </>
              )}
              Data as of:{" "}
              <strong>{dayjs(asOfDate).format("YYYY-MM-DD")}</strong>
            </Alert>
          )}
        </Card>

        <Card
          className="shadow-sm border-0 p-4 w-100 mb-4"
          style={{ maxWidth: "540px" }}
        >
          <div className="text-center mb-3">
            <h5 className="fw-semibold mb-1">Markup Percentage</h5>
            <p className="text-muted small mb-0">
              This value increases all watch prices for users dynamically.
            </p>
          </div>

          <Form onSubmit={handleMarkupUpdate}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Markup (%)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.1"
                value={markup}
                onChange={(e) => setMarkup(parseFloat(e.target.value))}
                disabled={markupLoading || updatingMarkup}
              />
            </Form.Group>

            <Button
              type="submit"
              variant="secondary"
              className="w-100 d-flex justify-content-center align-items-center"
              disabled={updatingMarkup}
            >
              {updatingMarkup && (
                <Spinner animation="border" size="sm" className="me-2" />
              )}
              {updatingMarkup ? "Saving..." : "Save Markup"}
            </Button>
          </Form>
        </Card>

        <Card className="shadow border-0 w-100" style={{ maxWidth: "720px" }}>
          <Card.Body>
            <h5 className="fw-semibold mb-3">Uploaded Documents</h5>

            {logsLoading ? (
              <div className="d-flex justify-content-center py-4">
                <Spinner animation="border" variant="secondary" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-muted text-center mb-0">
                No documents uploaded yet.
              </p>
            ) : (
              <Table responsive bordered hover className="small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Filename</th>
                    <th>Data As Of</th>
                    <th>Upload Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.filename}</td>
                      <td>
                        {log.asOfDate
                          ? dayjs(log.asOfDate).format("YYYY-MM-DD")
                          : "—"}
                      </td>
                      <td>
                        {dayjs(log.uploadTime).format("YYYY-MM-DD HH:mm:ss")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </PageTransition>
  );
}
