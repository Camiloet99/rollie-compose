import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  FaInstagram,
  FaTwitter,
  FaFacebookF,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="bg-dark text-light pt-5 pb-3 mt-5">
      <Container>
        <Row className="mb-4">
          <Col md={4} className="mb-4 mb-md-0">
            <h4 className="fw-bold footer-logo mb-2">Rollie</h4>
            <p style={{ fontSize: "0.95rem" }}>
              Your trusted source for luxury watch valuations. Explore, compare,
              and track the value of your timepiece — in real time.
            </p>
            <div className="d-flex gap-3 mt-3">
              <a
                href="https://instagram.com"
                className="text-light"
                target="_blank"
                rel="noreferrer"
              >
                <FaInstagram size={20} />
              </a>
              <a
                href="https://twitter.com"
                className="text-light"
                target="_blank"
                rel="noreferrer"
              >
                <FaTwitter size={20} />
              </a>
              <a
                href="https://facebook.com"
                className="text-light"
                target="_blank"
                rel="noreferrer"
              >
                <FaFacebookF size={20} />
              </a>
            </div>
          </Col>

          {/* Navigation */}
          <Col md={4} className="mb-4 mb-md-0">
            <h6 className="fw-semibold mb-3">Quick Links</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/search" className="text-light text-decoration-none">
                  Search
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/plans" className="text-light text-decoration-none">
                  Plans
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/account" className="text-light text-decoration-none">
                  My Account
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/login" className="text-light text-decoration-none">
                  Log In
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/register"
                  className="text-light text-decoration-none"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </Col>

          {/* Contact Info */}
          <Col md={4}>
            <h6 className="fw-semibold mb-3">Contact Us</h6>
            <ul className="list-unstyled" style={{ fontSize: "0.95rem" }}>
              <li className="mb-2">
                <FaEnvelope className="me-2" />
                support@rollie.com
              </li>
              <li className="mb-2">
                <FaPhone className="me-2" />
                +1 888-555-0199
              </li>
              <li>
                <FaMapMarkerAlt className="me-2" />
                123 Luxury Lane, Beverly Hills, CA
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="border-light" />

        <Row>
          <Col className="text-center">
            <small>
              &copy; {new Date().getFullYear()} <strong>Rollie</strong>. All
              rights reserved.
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
