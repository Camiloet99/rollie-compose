import { useParams, useNavigate } from "react-router-dom";
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
import { resetPassword } from "../services/authService";

const schema = yup.object().shape({
  newPassword: yup
    .string()
    .required("New password is required")
    .min(6, "Password must be at least 6 characters"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword"), null], "Passwords must match")
    .required("Please confirm your password"),
});

export default function ResetPassword() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setError("");
    try {
      await resetPassword(userId, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <PageTransition>
      <Container className="mt-5">
        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <Card className="shadow-lg">
              <Card.Body>
                <h3 className="text-center mb-3">Set New Password</h3>
                <p className="text-muted text-center mb-4">
                  Enter your new password below.
                </p>

                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      isInvalid={!!errors.newPassword}
                      {...register("newPassword")}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.newPassword?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      isInvalid={!!errors.confirmPassword}
                      {...register("confirmPassword")}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.confirmPassword?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary">
                      Reset Password
                    </Button>
                  </div>
                </Form>

                {success && (
                  <Alert variant="success" className="mt-4 text-center">
                    Your password has been updated. Redirecting to login...
                  </Alert>
                )}

                {error && (
                  <Alert variant="danger" className="mt-4 text-center">
                    {error}
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
