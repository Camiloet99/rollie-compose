import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import PageTransition from "../components/PageTransition";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Spinner,
} from "react-bootstrap";
import { FaGoogle } from "react-icons/fa";

const phoneRegExp = /^\+?[1-9]\d{1,14}$/;

const schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  phone: yup
    .string()
    .matches(phoneRegExp, "Enter a valid phone number with country code")
    .required("Phone number is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Minimum 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});

export default function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(schema) });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      toast.success(
        `Welcome ${data?.firstName || "user"}! Your account is ready.`
      );
      navigate("/login");
    } catch (err) {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <PageTransition>
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={7} lg={6}>
            <Card className="shadow-sm border-0 p-4">
              <Card.Body>
                <h2 className="text-center mb-3 fw-semibold">
                  Create Your Account
                </h2>
                <p className="text-center text-muted mb-4">
                  Join Rollie and discover the real value of your watches. It's
                  quick and free.
                </p>

                <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group controlId="firstName">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="John"
                          isInvalid={!!errors.firstName}
                          {...register("firstName")}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.firstName?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId="lastName">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Doe"
                          isInvalid={!!errors.lastName}
                          {...register("lastName")}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.lastName?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mt-3" controlId="phone">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="+1xxxxxxxxxx"
                      isInvalid={!!errors.phone}
                      {...register("phone")}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mt-3" controlId="email">
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

                  <Form.Group className="mt-3" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      isInvalid={!!errors.password}
                      {...register("password")}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.password?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mt-3" controlId="confirmPassword">
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

                  <div className="d-grid mt-4">
                    <Button
                      type="submit"
                      variant="success"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </Form>

                <hr className="my-4" />

                <div className="d-grid">
                  <Button variant="outline-dark" size="lg" disabled>
                    <FaGoogle className="me-2" />
                    Sign up with Google
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageTransition>
  );
}
