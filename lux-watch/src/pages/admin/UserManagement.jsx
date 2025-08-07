import React, { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Badge,
  Spinner,
  Pagination,
  Alert,
} from "react-bootstrap";
import {
  getAllUsers,
  updateUserPlan,
  deactivateUser,
  activateUser,
} from "../../services/adminService";
import { toast } from "react-toastify";
import PageTransition from "../../components/PageTransition";
import { useAuth } from "../../contexts/AuthContext";

const USERS_PER_PAGE = 10;

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [error, setError] = useState("");
  const { tiers } = useAuth();

  const getPlanName = (planId) => {
    const plan = tiers.find((t) => t.id === planId);
    return plan ? plan.name : "Unknown";
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const { userList, totalUsers } = await getAllUsers(
        page - 1,
        USERS_PER_PAGE
      );
      setUsers(userList);
      setTotalUsers(totalUsers);
    } catch (err) {
      console.error(err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleDeactivate = async (userId) => {
    try {
      await deactivateUser(userId);
      toast.success("User deactivated.");
      fetchUsers();
    } catch {
      toast.error("Failed to deactivate user.");
    }
  };

  const handleActivate = async (userId) => {
    try {
      await activateUser(userId);
      toast.success("User activated.");
      fetchUsers();
    } catch {
      toast.error("Failed to activate user.");
    }
  };

  const handleCheckActivity = (user) => {
    console.log("Checking activity for user:", user);
    toast.info(`Coming soon: Activity for ${user.firstName}`);
    // Aquí puedes abrir un modal con más info si lo deseas
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE);
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => setPage(i)}>
          {i}
        </Pagination.Item>
      );
    }
    return totalPages > 1 ? <Pagination>{items}</Pagination> : null;
  };

  return (
    <Container className="mt-4">
      <h2 className="mb-4 text-center fw-semibold">User Management</h2>

      {error && (
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="dark" />
        </div>
      ) : (
        <PageTransition>
          <div className="table-responsive shadow-sm">
            <Table
              bordered
              hover
              responsive
              striped
              className="mb-0 text-center align-middle"
            >
              <thead className="table-dark text-white">
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-muted text-center py-4">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.userId}>
                      <td>{`${u.firstName} ${u.lastName}`}</td>
                      <td className="text-muted">{u.email}</td>
                      <td>
                        <Badge
                          bg={
                            u.role === "ADMIN"
                              ? "danger"
                              : u.active
                              ? "success"
                              : "secondary"
                          }
                          className="text-uppercase px-3 py-1"
                        >
                          {u.role === "ADMIN" ? "ADMIN" : getPlanName(u.planId)}
                        </Badge>
                      </td>
                      <td>
                        <span
                          className={
                            u.active
                              ? "text-success fw-medium"
                              : "text-danger fw-medium"
                          }
                        >
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          <Button
                            variant={
                              u.active ? "outline-warning" : "outline-success"
                            }
                            size="sm"
                            onClick={() =>
                              u.active
                                ? handleDeactivate(u.userId)
                                : handleActivate(u.userId)
                            }
                          >
                            {u.active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleCheckActivity(u)}
                          >
                            Check Activity
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-center mt-4 mb-4">
            {renderPagination()}
          </div>
        </PageTransition>
      )}
    </Container>
  );
}
