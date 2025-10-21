import { useState } from "react";
import "../styles/onboarding.css"; // we'll add a tiny style next

export default function PatientOnboarding() {
  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    inviteCode: "" // optional
  });

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  function onSubmit(e) {
    e.preventDefault();
    console.log("SUBMIT (no backend yet):", form);
    // we'll wire the POST in the next step
  }

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Patient Onboarding</h1>
      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <label>Full Name
            <input
              name="full_name"
              value={form.full_name}
              onChange={onChange}
              required
            />
          </label>

          <label>Date of Birth
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={onChange}
              required
            />
          </label>

          <label>Clinician Code (optional)
            <input
              name="inviteCode"
              value={form.inviteCode}
              onChange={onChange}
              placeholder="e.g., X9K2PD"
            />
          </label>
        </div>

        <button className="ob-btn" type="submit">Continue</button>
      </form>
    </div>
  );
}