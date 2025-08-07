import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Navbar from "../components/Navbar";
import ForgotPassword from "../pages/ForgotPassword";
import PrivateRoute from "./PrivateRoute";
import MyAccount from "../pages/MyAccount";
import Search from "../pages/search/Search";
import { useAuth } from "../contexts/AuthContext";
import Plans from "../pages/Plans";
import NotFound from "../pages/NotFound";
import { AnimatePresence } from "framer-motion";
import Footer from "../components/footer/Footer";
import UploadDocument from "../pages/admin/UploadDocument";
import UserManagement from "../pages/admin/UserManagement";
import { Spinner, Container } from "react-bootstrap";
import AdminTierManagement from "../pages/AdminTierManagement";
import ResetPassword from "../pages/ResetPassword";

export default function AppRouter() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="dark" />
      </Container>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <div className="container flex-grow-1 mt-4">
            <Routes>
              {/* Home: redirige si ya está autenticado */}
              <Route
                path="/"
                element={
                  isAuthenticated ? <Navigate to="/search" replace /> : <Home />
                }
              />

              {/* Evitar login y register si ya inició sesión */}
              <Route
                path="/login"
                element={
                  isAuthenticated ? (
                    <Navigate to="/search" replace />
                  ) : (
                    <Login />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  isAuthenticated ? (
                    <Navigate to="/search" replace />
                  ) : (
                    <Register />
                  )
                }
              />

              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/reset-password/:userId"
                element={<ResetPassword />}
              />
              {/* Rutas protegidas */}
              <Route
                path="/plans"
                element={
                  <PrivateRoute>
                    <Plans />
                  </PrivateRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <PrivateRoute>
                    <MyAccount />
                  </PrivateRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <PrivateRoute>
                    <Search />
                  </PrivateRoute>
                }
              />

              {/* Admin-only routes */}
              <Route
                path="/admin/upload"
                element={
                  user?.role === "ADMIN" ? (
                    <PrivateRoute>
                      <UploadDocument />
                    </PrivateRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/admin/users"
                element={
                  user?.role === "ADMIN" ? (
                    <PrivateRoute>
                      <UserManagement />
                    </PrivateRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/admin/tiers"
                element={
                  isAuthenticated && user?.role === "ADMIN" ? (
                    <PrivateRoute>
                      <AdminTierManagement />
                    </PrivateRoute>
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AnimatePresence>
  );
}
