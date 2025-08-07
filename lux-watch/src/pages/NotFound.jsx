import { FaCompass } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found - Rollie</title>
      </Helmet>

      <div className="container text-center mt-5">
        <FaCompass size={80} className="text-primary mb-4" />
        <h1 className="display-1 fw-bold text-danger">404</h1>
        <p className="lead">Oops! The page you’re looking for doesn’t exist.</p>
        <p className="mb-4">
          It may have been moved, deleted or never existed at all.
        </p>

        <Link to="/" className="btn btn-primary me-2">
          Go to Home
        </Link>
        <Link to="/search" className="btn btn-outline-dark">
          Go to Search
        </Link>
      </div>
    </>
  );
}
