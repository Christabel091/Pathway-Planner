import '../styles/SignUp.css';

/** @format */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useState } from "react";
const SignUp = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const { signUp } = useAuth();
  const handleSignUp = async (e) => {
    e.preventDefault();
    const response = await signUp(username, email, password, role);
    if (response.user) navigate("/");
    else {
      setError(response.error);
    }
  };

  return (
    <div className="overlay">
      <div className="auth-container">
        <form onSubmit={handleSignUp} className="auth-form">
          <h2>Create an account</h2>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="select-wrap">
            <select
              className="category"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              aria-label="Select role"
            >
              <option value="" disabled hidden>
                Select role
              </option>
              <option value="patient">Patient</option>
              <option value="student">Physician</option>
              <option value="staff">Caretaker</option>
            </select>
          </div>
          <p className="error-message">{error}</p>
          <button type="sign up" className="btn-auth">
            Create account
          </button>
          <p className="link-text">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
