import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import PageTransition from "../components/PageTransition";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <PageTransition>
      <Helmet>
        <title>Rollie - Luxury Watch Price Checker</title>
        <meta
          name="description"
          content="Find out the value of your luxury watch using AI-based analysis. Search by brand, reference, condition, and color. Sign up for free or unlock unlimited searches."
        />
      </Helmet>

      <section className="text-center py-5 bg-light">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="display-4 fw-bold">
            Welcome to <span className="text-primary">Rollie</span>
          </h1>
          <p className="lead mt-3 text-dark">
            Discover the true value of luxury watches — powered by artificial
            intelligence.
          </p>
          <p className="text-muted mx-auto" style={{ maxWidth: "720px" }}>
            Our AI engine analyzes thousands of data points to help you estimate
            fair market prices for any luxury watch. Make informed decisions.
          </p>
          <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
            <Link
              to="/register"
              className="btn btn-primary btn-lg px-4 shadow-sm"
            >
              Sign Up for Free
            </Link>
            <Link to="/login" className="btn btn-outline-dark btn-lg px-4">
              Log In
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="container py-5">
        <h2 className="text-center mb-5 fw-semibold">
          What can you do with Rollie?
        </h2>
        <div className="row g-4">
          <motion.div
            className="col-md-4"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 150 }}
          >
            <div className="card h-100 shadow-sm border-0 rounded-4">
              <div className="card-body text-center p-4">
                <h5 className="card-title fw-semibold">
                  AI-Based Price Estimations
                </h5>
                <p className="card-text text-muted">
                  Our intelligent system evaluates real-time listings, sales
                  history and market trends to estimate accurate prices.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="col-md-4"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 150 }}
          >
            <div className="card h-100 shadow-sm border-0 rounded-4">
              <div className="card-body text-center p-4">
                <h5 className="card-title fw-semibold">Search by Reference</h5>
                <p className="card-text text-muted">
                  Quickly find results by brand, model, reference number, or
                  other watch features.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="col-md-4"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 150 }}
          >
            <div className="card h-100 shadow-sm border-0 rounded-4">
              <div className="card-body text-center p-4">
                <h5 className="card-title fw-semibold">
                  Compare Condition & Color
                </h5>
                <p className="card-text text-muted">
                  Understand how different conditions or styles affect resale
                  value and desirability.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-5">
          <Link
            to="/search"
            className="btn btn-secondary btn-lg px-4 shadow-sm"
          >
            Start Searching
          </Link>
        </div>
      </section>
    </PageTransition>
  );
}
