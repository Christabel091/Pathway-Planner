import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext.jsx";
import { getToken } from "../utility/auth.js";
import { importRsaPublicKey, rsaEncryptToBase64 } from "../utility/crypto.js";
import Modal from "../components/Modal.jsx";
import "../styles/legacy/onboarding.css";

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
  const [serverPubKey, setServerPubKey] = useState(null); // CryptoKey

  useEffect(() => {
    let cancelled = false;

    async function fetchKey() {
      try {
        const res = await fetch(`${base_URL}/onboarding/crypto/public-key`, {
          method: "GET",
          headers: { Accept: "text/plain" },
        });
        const pem = await res.text(); // can be JSON too; adjust if needed
        if (!res.ok || !pem.includes("BEGIN PUBLIC KEY")) {
          throw new Error("Invalid public key response");
        }
        const key = await importRsaPublicKey(pem);
        if (!cancelled) setServerPubKey(key);
      } catch (err) {
        console.error("Failed to load server public key:", err);
        if (!cancelled) {
          setModalType("error");
          setModalMessage("Security setup error: cannot load encryption key.");
        }
      }
    }

    fetchKey();
    return () => {
      cancelled = true;
    };
  }, [base_URL]);

  const safeNavigate = (to, opts) => {
    if (didNavigate.current) return;
    didNavigate.current = true;
    navigate(to, opts);
  };

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
    clinicianInviteCode: "", // unified naming
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Small helpers to lightly sanitize/mask common inputs (optional)
  const onPhoneChange = (e) => {
    const digits = e.target.value.replace(/[^\d+()-\s]/g, "");
    setForm((f) => ({ ...f, [e.target.name]: digits }));
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

    if (!serverPubKey) {
      setModalType("error");
      setModalMessage("Encryption not ready. Please try again in a moment.");
      return;
    }
    const sensitiveFields = {
      full_name: form.full_name,
      dob: form.dob,
      phone_number: form.phone_number,
      address: form.address,
      relative_contact_name: form.relative_contact_name,
      relative_contact_email: form.relative_contact_email,
      relative_contact_phone: form.relative_contact_phone,
      allergies: form.allergies,
      chronic_conditions: form.chronic_conditions,
      current_medications: form.current_medications,
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
    };

    const nonSensitive = {
      gender: form.gender,
      blood_type: form.blood_type,
      clinicianInviteCode: form.clinicianInviteCode || "",
    };

    try {
      const sensitiveJson = JSON.stringify(sensitiveFields);
      const ciphertextB64 = await rsaEncryptToBase64(
        serverPubKey,
        sensitiveJson
      );

      const payload = {
        userId,
        email,
        ...nonSensitive,
        sensitive: ciphertextB64,
        enc_alg: "RSA-OAEP-256",
        enc_v: 1,
      };

      const response = await fetch(`${base_URL}/onboarding/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && response.status === 201) {
        setModalType("success");
        setModalMessage("Profile completed successfully! Redirecting...");

        if (data.user) setUser(data.user);
        if (data.profile) setUserProfile?.(data.profile);

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
  <div className="onboarding-bg">
    <div className="ob-wrap">
      <h1 className="ob-title">Patient Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Basic Information</h3>
          <div className="field-grid">
            <div className="field">
              <label>Full Name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
                required
              />
            </div>
            <div className="field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={onChange}
                required
              />
            </div>
            <div className="field">
              <label>Gender</label>
              <select name="gender" value={form.gender} onChange={onChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </div>
            <div className="field">
              <label>Phone Number</label>
              <input
                name="phone_number"
                value={form.phone_number}
                onChange={onPhoneChange}
              />
            </div>
            <div className="field span-2">
              <label>Address</label>
              <input name="address" value={form.address} onChange={onChange} />
            </div>
            <div className="field">
              <label>Clinician Code (optional)</label>
              <input
                name="clinicianInviteCode"
                value={form.clinicianInviteCode}
                onChange={onChange}
                placeholder="e.g., X9K2PD"
              />
            </div>
          </div>
        </div>

        <div className="ob-card">
          <h3>Emergency Contact</h3>
          <div className="field-grid">
            <div className="field">
              <label>Relative Name</label>
              <input
                name="relative_contact_name"
                value={form.relative_contact_name}
                onChange={onChange}
              />
            </div>
            <div className="field">
              <label>Relative Email</label>
              <input
                type="email"
                name="relative_contact_email"
                value={form.relative_contact_email}
                onChange={onChange}
              />
            </div>
            <div className="field">
              <label>Relative Phone</label>
              <input
                name="relative_contact_phone"
                value={form.relative_contact_phone}
                onChange={onPhoneChange}
              />
            </div>
          </div>
        </div>

        <div className="ob-card">
          <h3>Health Information</h3>
          <div className="field-grid">
            <div className="field">
              <label>Blood Type</label>
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
            </div>
            <div className="field span-2">
              <label>Allergies</label>
              <textarea
                name="allergies"
                value={form.allergies}
                onChange={onChange}
              />
            </div>
            <div className="field span-2">
              <label>Chronic Conditions</label>
              <textarea
                name="chronic_conditions"
                value={form.chronic_conditions}
                onChange={onChange}
              />
            </div>
            <div className="field span-2">
              <label>Current Medications</label>
              <textarea
                name="current_medications"
                value={form.current_medications}
                onChange={onChange}
              />
            </div>
            <div className="field">
              <label>Height (cm)</label>
              <input
                type="number"
                name="height_cm"
                value={form.height_cm}
                onChange={onChange}
              />
            </div>
            <div className="field">
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight_kg"
                value={form.weight_kg}
                onChange={onChange}
              />
            </div>
          </div>
        </div>

        <div className="actions">
          <button className="ob-btn" type="submit">
            {serverPubKey ? "Continue" : "Securing…"}
          </button>
        </div>
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
