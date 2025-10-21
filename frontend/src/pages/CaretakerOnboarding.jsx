import { useState } from "react";
import "../styles/onboarding.css";

export default function CaretakerOnboarding() {
  const [form, setForm] = useState({
    full_name: "",
    relationship: "",
    phone_number: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function onSubmit(e) {
    e.preventDefault();
    console.log("SUBMIT caretaker (demo):", form);

    // later:
    // await fetch("/api/info/caretakers", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(form),
    // });
  }

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Caretaker Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Profile</h3>

          <label>Full Name
            <input name="full_name" value={form.full_name} onChange={onChange} required />
          </label>

          <label>Relationship (e.g., mother, friend)
            <input name="relationship" value={form.relationship} onChange={onChange} />
          </label>

          <label>Phone Number
            <input name="phone_number" value={form.phone_number} onChange={onChange} />
          </label>
        </div>

        <button className="ob-btn" type="submit">Continue</button>
      </form>
    </div>
  );
}