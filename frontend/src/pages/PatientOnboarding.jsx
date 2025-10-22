import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import { getToken } from "../utility/auth.js";
import Modal from "../components/Modal.jsx";
import "../styles/onboarding.css";

export default function PatientOnboarding({ setUserProfile }) {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const token = getToken();
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const email = user?.email;

  const navigate = useNavigate();
  const didNavigate = useRef(false);

  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    gender: "prefer_not_say",
    phone_number: "",
    address: "",
    relative_contact_name: "",
    relative_contact_email: "",
    relative_contact_phone: "",
    blood_type: "",
    allergies: "",
    chronic_conditions: "",
    current_medications: "",
    height_cm: "",
    weight_kg: "",
    clinicianInviteCode: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const safeNavigate = (to, opts) => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    navigate(to, opts);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      safeNavigate("/Welcome", { replace: true });
      return;
    }

    if (!form.full_name || !form.dob) {
      setModalType("error");
      setModalMessage("Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch(`${base_URL}/onboarding/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, userId, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setModalType("success");
        setModalMessage("Profile completed successfully! Redirecting...");

        if (data.user) setUser(data.user);
        if (data.profile) setUserProfile?.(data.profile);
        setModalType("success");
        setModalMessage("Profile completed successfully! Redirecting...");
        // Small delay for UX, and guard for StrictMode
        setTimeout(() => safeNavigate("/home", { replace: true }), 1000);
      } else {
        setModalType("error");
        setModalMessage(
          data?.error || "An unknown error occurred. Please try again."
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      setModalType("error");
      setModalMessage("Server connection error. Please try again.");
    }
  };

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Patient Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Basic Information</h3>

          <label>
            Full Name
            <input
              name="full_name"
              value={form.full_name}
              onChange={onChange}
            />
          </label>

          <label>
            Date of Birth
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={onChange}
            />
          </label>

          <label>
            Gender
            <select name="gender" value={form.gender} onChange={onChange}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_say">Prefer not to say</option>
            </select>
          </label>

          <label>
            Phone Number
            <input
              name="phone_number"
              value={form.phone_number}
              onChange={onChange}
            />
          </label>

          <label>
            Address
            <input name="address" value={form.address} onChange={onChange} />
          </label>

          <label>
            Clinician Code (optional)
            <input
              name="clinicianInviteCode"
              value={form.clinicianInviteCode}
              onChange={onChange}
              placeholder="e.g., X9K2PD"
            />
          </label>
        </div>

        <div className="ob-card">
          <h3>Emergency Contact</h3>
          <label>
            Relative Name
            <input
              name="relative_contact_name"
              value={form.relative_contact_name}
              onChange={onChange}
            />
          </label>
          <label>
            Relative Email
            <input
              type="email"
              name="relative_contact_email"
              value={form.relative_contact_email}
              onChange={onChange}
            />
          </label>
          <label>
            Relative Phone
            <input
              name="relative_contact_phone"
              value={form.relative_contact_phone}
              onChange={onChange}
            />
          </label>
        </div>

        <div className="ob-card">
          <h3>Health Information</h3>
          <label>
            Blood Type
            <select
              name="blood_type"
              value={form.blood_type}
              onChange={onChange}
            >
              <option value="">Select...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </label>

          <label>
            Allergies
            <textarea
              name="allergies"
              value={form.allergies}
              onChange={onChange}
            />
          </label>

          <label>
            Chronic Conditions
            <textarea
              name="chronic_conditions"
              value={form.chronic_conditions}
              onChange={onChange}
            />
          </label>

          <label>
            Current Medications
            <textarea
              name="current_medications"
              value={form.current_medications}
              onChange={onChange}
            />
          </label>

          <label>
            Height (cm)
            <input
              type="number"
              name="height_cm"
              value={form.height_cm}
              onChange={onChange}
            />
          </label>

          <label>
            Weight (kg)
            <input
              type="number"
              name="weight_kg"
              value={form.weight_kg}
              onChange={onChange}
            />
          </label>
        </div>

        <button className="ob-btn" type="submit">
          Complete Profile
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
