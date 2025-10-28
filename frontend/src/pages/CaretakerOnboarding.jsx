import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import { getToken } from "../utility/auth.js";
import Modal from "../components/Modal.jsx";
import "../styles/onboarding.css";

export default function CaretakerOnboarding() {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const token = getToken();
  const navigate = useNavigate();
  const [modalType, setModalType] = useState("error");
  const [modalMessage, setModalMessage] = useState("");

  const { user, setUser } = useAuth();
  const userId = user?.id;
  const email = user?.email;

  const [form, setForm] = useState({
    full_name: "",
    relationship: "",
    phone_number: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();

    if (!token) {
      // no session — send them to welcome/login like your other flows
      navigate("/Welcome", { replace: true });
      return;
    }

    if (!form.full_name?.trim()) {
      setModalType("error");
      setModalMessage("Please enter your full name before continuing.");
      return;
    }

    try {
      const res = await fetch(`${base_URL}/onboarding/caretakers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          email, // included for parity with clinician route; backend can ignore if unused
          full_name: form.full_name,
          relationship: form.relationship || null,
          phone_number: form.phone_number || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error || "An unknown error occurred. Please try again.";
        setModalType("error");
        setModalMessage(msg);
        return;
      }

      // success: update auth context if user object is returned (mirrors clinician flow)
      if (data.user) setUser(data.user);

      // redirect home

      setModalType("success");
      setModalMessage("Profile completed successfully! Redirecting...");
      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Caretaker submit error:", err);
      setModalType("error");
      setModalMessage("A network error occurred. Please try again.");
    }
  }

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Caretaker Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Profile</h3>

          <label>
            Full Name
            <input
              name="full_name"
              value={form.full_name}
              onChange={onChange}
              required
            />
          </label>

          <label>
            Relationship (e.g., mother, friend)
            <input
              name="relationship"
              value={form.relationship}
              onChange={onChange}
            />
          </label>

          <label>
            Phone Number
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={onChange}
            />
          </label>
        </div>

        <button className="ob-btn" type="submit">
          Continue
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
  );
}
