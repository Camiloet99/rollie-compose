import {
  Navbar,
  Nav,
  Container,
  Button,
  Badge,
  NavDropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

export default function AppNavbar() {
  const { user, isAuthenticated, logout, tiers } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("You have successfully logged out.");
    navigate("/");
  };

  const currentTier = tiers?.find((t) => t.id === user?.planId);

  const getBadgeLabel = () => {
    if (user?.role === "ADMIN") return "Admin";
    if (currentTier?.name) return currentTier.name.toUpperCase();
    return "Plan";
  };

  const getBadgeColor = () => {
    if (user?.role === "ADMIN") return "danger";
    return "secondary";
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          Rollie
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="rollie-navbar" />
        <Navbar.Collapse id="rollie-navbar">
          <Nav className="ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <Nav.Link
                  disabled
                  className="d-flex align-items-center gap-2 text-white"
                >
                  Welcome, <strong>{user?.firstName}</strong>
                  <Badge bg={getBadgeColor()} pill>
                    {getBadgeLabel()}
                  </Badge>
                </Nav.Link>

                {user?.role === "ADMIN" && (
                  <NavDropdown
                    title="Admin Panel"
                    id="admin-dropdown"
                    menuVariant="dark"
                  >
                    <NavDropdown.Item as={Link} to="/admin/upload">
                      Upload Document
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/users">
                      Manage Users
                    </NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/admin/tiers">
                      Manage Tiers
                    </NavDropdown.Item>
                  </NavDropdown>
                )}

                <Nav.Link as={Link} to="/search">
                  Search
                </Nav.Link>
                <Nav.Link as={Link} to="/account">
                  My Account
                </Nav.Link>
                {user?.role !== "ADMIN" && (
                  <Nav.Link as={Link} to="/plans">
                    Plans
                  </Nav.Link>
                )}

                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleLogout}
                  className="ms-lg-2 mt-2 mt-lg-0"
                >
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Log In
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
