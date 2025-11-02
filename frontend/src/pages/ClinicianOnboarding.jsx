import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import { getToken } from "../utility/auth.js";
import Modal from "../components/Modal.jsx";
import "../styles/legacy/onboarding.css";

export default function ClinicianOnboarding({ setUserProfile }) {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const token = getToken();
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const email = user?.email;

  const navigate = useNavigate();

  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    license_number: "",
    clinic_name: "",
    contact_email: email || "",
    contact_phone: "",
    office_address: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      navigate("/Welcome", { replace: true });
      return;
    }

    if (!form.full_name) {
      setModalType("error");
      setModalMessage("Please enter your full name before continuing.");
      return;
    }

    try {
      console.log("Submitting clinician form:", form);
      console.log("UserId:", userId, "Email:", email);

      const response = await fetch(`${base_URL}/onboarding/clinicians`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          userId,
          email: form.contact_email || email,
        }),
      });

      const data = await response.json();
      console.log("Response:", data);

      if (response.ok) {
        setModalType("success");
        setModalMessage("Clinician profile created successfully!");

        // update auth context
        if (data.user) setUser(data.user);
        if (data.profile) setUserProfile(data.profile);
        setModalType("success");
        setModalMessage("Profile completed successfully! Redirecting...");
        // redirect after short delay
        setTimeout(() => navigate("/dashboard", { replace: true }), 1800);
      } else {
        setModalType("error");
        setModalMessage(
          data?.error || "An unknown error occurred. Please try again."
        );
      }
    } catch (err) {
      console.error("Error submitting clinician form:", err);
      setModalType("error");
      setModalMessage("Server connection error. Please try again.");
    }
  };

  return (
    <div className="onboarding-bg">
      <div className="ob-wrap">
        <h1 className="ob-title">Clinician Onboarding</h1>

        <form className="ob-form" onSubmit={onSubmit}>
          <div className="ob-card">
            <h3>Profile</h3>

            <label>
              Full Name
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
              />
            </label>

            <label>
              Specialty
              <input
                name="specialty"
                value={form.specialty}
                onChange={onChange}
              />
            </label>

            <label>
              License Number
              <input
                name="license_number"
                value={form.license_number}
                onChange={onChange}
              />
            </label>

            <label>
              Clinic Name
              <input
                name="clinic_name"
                value={form.clinic_name}
                onChange={onChange}
              />
            </label>
          </div>

          <div className="ob-card">
            <h3>Contact</h3>

            <label>
              Contact Email
              <input
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={onChange}
              />
            </label>

            <label>
              Contact Phone
              <input
                name="contact_phone"
                value={form.contact_phone}
                onChange={onChange}
              />
            </label>

            <label>
              Office Address
              <input
                name="office_address"
                value={form.office_address}
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
    </div>
  );
}
