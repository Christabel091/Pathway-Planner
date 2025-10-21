import { useState } from "react";
import "../styles/onboarding.css";

export default function ClinicianOnboarding() {
  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    license_number: "",
    clinic_name: "",
    contact_email: "",
    contact_phone: "",
    office_address: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function onSubmit(e) {
    e.preventDefault();
    console.log("SUBMIT clinician (demo):", form);

    // later:
    // await fetch("/api/info/clinicians", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(form),
    // });
  }

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Clinician Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Profile</h3>

          <label>Full Name
            <input name="full_name" value={form.full_name} onChange={onChange} required />
          </label>

          <label>Specialty
            <input name="specialty" value={form.specialty} onChange={onChange} />
          </label>

          <label>License Number
            <input name="license_number" value={form.license_number} onChange={onChange} />
          </label>

          <label>Clinic Name
            <input name="clinic_name" value={form.clinic_name} onChange={onChange} />
          </label>
        </div>

        <div className="ob-card">
          <h3>Contact</h3>

          <label>Contact Email
            <input type="email" name="contact_email" value={form.contact_email} onChange={onChange} />
          </label>

          <label>Contact Phone
            <input name="contact_phone" value={form.contact_phone} onChange={onChange} />
          </label>

          <label>Office Address
            <input name="office_address" value={form.office_address} onChange={onChange} />
          </label>
        </div>

        <button className="ob-btn" type="submit">Continue</button>
      </form>
    </div>
  );
}