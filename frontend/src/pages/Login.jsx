/** @format */

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/legacy/login.css";
import { useAuth } from "../components/AuthContext";
import { Link } from "react-router-dom";
const Login = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { login } = useAuth();
  const [error, setError] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    const response = await login(email, password);
    if (response.token) navigate("/");
    else setError(response.error);
  };

  return (
    <div className="login-bg">
      <div className="overlay">
        <div className="auth-container">
          <form onSubmit={handleLogin} className="auth-form">
            <h2>Log in</h2>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="error-message">{error}</p>
            <button className="btn-auth" type="Log in">
              Login
            </button>
            <p className="link-text">
              Don't have an account? <a href="/signup">Sign up</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
