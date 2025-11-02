import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import { getToken } from "../utility/auth.js";
import Modal from "../components/Modal.jsx";
import "../styles/legacy/onboarding.css";

export default function AdminOnboarding() {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const token = getToken();
  const navigate = useNavigate();
  const [modalType, setModalType] = useState("error");
  const [modalMessage, setModalMessage] = useState("");
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const emailFromAuth = user?.email;

  const [form, setForm] = useState({
    display_name: "",
    contact_email: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();

    if (!token) {
      navigate("/Welcome", { replace: true });
      return;
    }

    try {
      const res = await fetch(`${base_URL}/onboarding/admins`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          // prefer the user’s typed contact_email if provided, else fallback to auth email
          email: form.contact_email?.trim() || emailFromAuth,
          display_name: form.display_name?.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalType("error");
        setModalMessage(
          data?.error || "An unknown error occurred. Please try again."
        );
        return;
      }

      if (data.user) setUser(data.user);

      setModalType("success");
      setModalMessage("Profile completed successfully! Redirecting...");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin submit error:", err);

      setModalType("error");
      setModalMessage("A network error occurred. Please try again.");
    }
  }

  return (
    <div className="onboarding-bg">
      <div className="ob-wrap">
        <h1 className="ob-title">Admin Onboarding</h1>

        <form className="ob-form" onSubmit={onSubmit}>
          <div className="ob-card">
            <h3>Optional Details</h3>
            <label>
              Display Name
              <input
                name="display_name"
                value={form.display_name}
                onChange={onChange}
              />
            </label>

            <label>
              Contact Email
              <input
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={onChange}
              />
            </label>
          </div>

          <button className="ob-btn" type="submit">
            Finish
          </button>
        </form>

        {modalMessage && (
          <Modal
            message={modalMessage}
            type={modalType}
            duration={7000}
            onClose={() => setModalMessage("")}
          />
        )}
      </div>
    </div>
  );
}
