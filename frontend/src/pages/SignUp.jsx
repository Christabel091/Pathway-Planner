import "../styles/SignUp.css";
import "../pages/PatientOnboarding";
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

    if (response.token) {
      // decide onboarding path based on selected role
      const r = (role || "").toLowerCase();
      if (r === "patient") navigate("/onboarding/patient");
      else if (r === "physician" || r === "clinician") navigate("/onboarding/clinician");
      else if (r === "caretaker") navigate("/onboarding/caretaker");
      else if (r === "admin") navigate("/onboarding/admin");
      else navigate("/onboarding/patient"); // safe default
    } else {
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

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="category"
            required
          >
            <option value="">select role</option>
            <option value="patient">patient</option>
            <option value="physician">physician</option>
            <option value="caretaker">caretaker</option>
            <option value="admin">admin</option>
          </select>
          <p className="error-message">{error}</p>
          <button type="submit" className="btn-auth">
            Create account
          </button>
          <p className="link-text">
            Already have an account? <a href="/Login">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
