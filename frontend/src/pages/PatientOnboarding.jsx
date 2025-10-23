import { useState } from "react";
import "../styles/onboarding.css";

export default function PatientOnboarding() {
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
    inviteCode: ""
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function onSubmit(e) {
    e.preventDefault();
    console.log("SUBMIT (demo, no backend yet):", form);
  }

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Patient Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Basic Information</h3>
          <div className="field-grid">
            <div className="field"><label>Full Name</label><input name="full_name" value={form.full_name} onChange={onChange} required /></div>
            <div className="field"><label>Date of Birth</label><input type="date" name="dob" value={form.dob} onChange={onChange} required /></div>
            <div className="field"><label>Gender</label>
              <select name="gender" value={form.gender} onChange={onChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_say">Prefer not to say</option>
              </select>
            </div>
            <div className="field"><label>Phone Number</label><input name="phone_number" value={form.phone_number} onChange={onChange} /></div>
            <div className="field span-2"><label>Address</label><input name="address" value={form.address} onChange={onChange} /></div>
            <div className="field"><label>Clinician Code (optional)</label><input name="inviteCode" value={form.inviteCode} onChange={onChange} placeholder="e.g., X9K2PD" /></div>
          </div>
        </div>

        <div className="ob-card">
          <h3>Emergency Contact</h3>
          <div className="field-grid">
            <div className="field"><label>Relative Name</label><input name="relative_contact_name" value={form.relative_contact_name} onChange={onChange} /></div>
            <div className="field"><label>Relative Email</label><input type="email" name="relative_contact_email" value={form.relative_contact_email} onChange={onChange} /></div>
            <div className="field"><label>Relative Phone</label><input name="relative_contact_phone" value={form.relative_contact_phone} onChange={onChange} /></div>
          </div>
        </div>

        <div className="ob-card">
          <h3>Health Information</h3>
          <div className="field-grid">
            <div className="field"><label>Blood Type</label>
              <select name="blood_type" value={form.blood_type} onChange={onChange}>
                <option value="">Select...</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div className="field span-2"><label>Allergies</label><textarea name="allergies" value={form.allergies} onChange={onChange} /></div>
            <div className="field span-2"><label>Chronic Conditions</label><textarea name="chronic_conditions" value={form.chronic_conditions} onChange={onChange} /></div>
            <div className="field span-2"><label>Current Medications</label><textarea name="current_medications" value={form.current_medications} onChange={onChange} /></div>
            <div className="field"><label>Height (cm)</label><input type="number" name="height_cm" value={form.height_cm} onChange={onChange} /></div>
            <div className="field"><label>Weight (kg)</label><input type="number" name="weight_kg" value={form.weight_kg} onChange={onChange} /></div>
          </div>
        </div>

        <div className="actions">
          <button className="ob-btn" type="submit">Continue</button>
        </div>
      </form>
    </div>
  );
}