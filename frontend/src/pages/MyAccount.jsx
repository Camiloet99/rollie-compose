// MyAccount.jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../contexts/AuthContext";
import { Helmet } from "react-helmet";
import { toast } from "react-toastify";
import FavoriteWatches from "../components/favoriteWatches/FavoriteWatches";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Spinner,
  Badge,
} from "react-bootstrap";
import PageTransition from "../components/PageTransition";
import { updateUserProfile } from "../services/userService";

const schema = yup.object().shape({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  phone: yup
    .string()
    .matches(/^\+?[1-9]\d{1,14}$/, "Enter a valid phone number")
    .required("Phone is required"),
});

export default function MyAccount() {
  const { user, login, tiers } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const userTier = tiers?.find((t) => t.id === user?.planId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phoneNumber || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phone,
      };
      await updateUserProfile(user.userId, payload);
      const updatedUser = {
        ...user,
        ...payload,
        name: `${data.firstName} ${data.lastName}`,
      };
      login(updatedUser);
      toast.success("Your account was updated successfully.");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to update account.");
    }
  };

  return (
    <PageTransition>
      <Helmet>
        <title>My Account - Rollie</title>
      </Helmet>

      <Container className="mt-5">
        <h2 className="mb-4 fw-semibold">My Account</h2>

        <Row className="g-4">
          <Col md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <h5 className="fw-semibold mb-3">Account Settings</h5>
                {!isEditing ? (
                  <>
                    <p className="mb-2">
                      <strong>First Name:</strong> {user.firstName}
                    </p>
                    <p className="mb-2">
                      <strong>Last Name:</strong> {user.lastName}
                    </p>
                    <p className="mb-2">
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p className="mb-2">
                      <strong>Phone:</strong> {user.phoneNumber}
                    </p>
                    <p className="mb-0">
                      <strong>Plan:</strong>{" "}
                      <Badge
                        bg={
                          user.role === "ADMIN"
                            ? "danger"
                            : userTier
                            ? "success"
                            : "secondary"
                        }
                        pill
                      >
                        {user.role === "ADMIN"
                          ? "Admin"
                          : userTier?.name || "None"}
                      </Badge>
                    </p>
                    <div className="text-end mt-4">
                      <Button
                        variant="outline-dark"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Information
                      </Button>
                    </div>
                  </>
                ) : (
                  <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Form.Group className="mb-3" controlId="firstName">
                      <Form.Label className="fw-semibold">
                        First Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        {...register("firstName")}
                        isInvalid={!!errors.firstName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="lastName">
                      <Form.Label className="fw-semibold">Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        {...register("lastName")}
                        isInvalid={!!errors.lastName}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="phone">
                      <Form.Label className="fw-semibold">Phone</Form.Label>
                      <Form.Control
                        type="tel"
                        {...register("phone")}
                        isInvalid={!!errors.phone}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.phone?.message}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="email">
                      <Form.Label className="fw-semibold">Email</Form.Label>
                      <Form.Control value={user.email} readOnly disabled />
                    </Form.Group>

                    <div className="text-end mt-3">
                      <Button
                        variant="secondary"
                        className="me-2"
                        onClick={() => setIsEditing(false)}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="dark"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-2"
                            />
                            Saving...
                          </>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </div>
                  </Form>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* === Zona de favoritos === */}
          <Col md={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-4">
                <h5 className="fw-semibold mb-3">My Favorites</h5>
                <p className="text-muted small mb-4">
                  Only the reference number is stored. Price, condition, and
                  other details may vary based on daily market updates.
                </p>
                <FavoriteWatches />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </PageTransition>
  );
}
