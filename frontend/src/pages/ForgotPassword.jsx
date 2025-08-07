import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
} from "react-bootstrap";
import PageTransition from "../components/PageTransition";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { verifyUserIdentity } from "../services/authService";

const schema = yup.object().shape({
  email: yup.string().email("Invalid email").required("Email is required"),
  phoneNumber: yup
    .string()
    .required("Phone number is required")
    .matches(/^[0-9]{7,15}$/, "Invalid phone number"),
});

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setFeedback({ type: "", message: "" });

    try {
      const userResponse = await verifyUserIdentity(
        data.email,
        data.phoneNumber
      );
      setFeedback({
        type: "success",
        message: "Identity verified. Redirecting...",
      });
      setTimeout(
        () => navigate(`/reset-password/${userResponse?.userId}`),
        2000
      );
    } catch (err) {
      setFeedback({
        type: "danger",
        message: "User not found or phone number does not match.",
      });
    }
  };

  return (
    <PageTransition>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <Card className="shadow-lg">
              <Card.Body>
                <h3 className="text-center mb-3">Forgot your password?</h3>
                <p className="text-muted text-center mb-4">
                  Enter your email and phone number to reset your password.
                </p>

                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@example.com"
                      isInvalid={!!errors.email}
                      {...register("email")}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.email?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="phoneNumber">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g. 3012345678"
                      isInvalid={!!errors.phoneNumber}
                      {...register("phoneNumber")}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phoneNumber?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary">
                      Verify Identity
                    </Button>
                  </div>
                </Form>

                {feedback.message && (
                  <Alert variant={feedback.type} className="mt-4 text-center">
                    {feedback.message}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageTransition>
  );
}
