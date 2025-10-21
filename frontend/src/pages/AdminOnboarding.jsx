import { useState } from "react";
import "../styles/onboarding.css";

export default function AdminOnboarding() {
  const [form, setForm] = useState({
    display_name: "",
    contact_email: "",
  });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  function onSubmit(e) {
    e.preventDefault();
    console.log("SUBMIT admin (demo):", form);

    // later: you might not POST anything (no table),
    // just mark profile complete on the frontend and navigate to /home.
  }

  return (
    <div className="ob-wrap">
      <h1 className="ob-title">Admin Onboarding</h1>

      <form className="ob-form" onSubmit={onSubmit}>
        <div className="ob-card">
          <h3>Optional Details</h3>
          <label>Display Name
            <input name="display_name" value={form.display_name} onChange={onChange} />
          </label>

          <label>Contact Email
            <input type="email" name="contact_email" value={form.contact_email} onChange={onChange} />
          </label>
        </div>

        <button className="ob-btn" type="submit">Finish</button>
      </form>
    </div>
  );
}