import "../styles/legacy/Welcome.css";

/** @format */

import { Link } from "react-router-dom";

const Welcome = () => {
  return (
    <div className="welcome-bg">
      <div className="welcome-container">
        <h1 className="">Pathway-Planner</h1>
        <p className="motto"> - Gentle goals lasting care - </p>
        <div className="#">
          <Link to="/login" className="#">
            Log In
          </Link>
        </div>

        <div className="">
          <div className="">
            <Link to="/signup" className="hero-btn primary">
              Get Started
            </Link>
          </div>
        </div>

        <footer className="">
          <p>
            Pathway-planner © {new Date().getFullYear()} | All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Welcome;
