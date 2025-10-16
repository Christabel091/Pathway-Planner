import React from "react";
import { NavLink } from "react-router-dom";   // ✅ use NavLink from React Router
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <nav className="floating-nav">
      <div className="nav-brand">🌿 Pathway Planner</div>

      <div className="nav-links">
        <NavLink to="/Welcome" className="nav-link">Home</NavLink>
        <NavLink to="/About" className="nav-link">About</NavLink>
        <NavLink to="/Services" className="nav-link">Services</NavLink>
        <NavLink to="/Contact" className="nav-link">Contact</NavLink>
      </div>

      <div className="nav-cta">
        <button className="login-btn">Sign In</button>
        <button className="try-btn">Try it Now</button>
      </div>
    </nav>
  );
}