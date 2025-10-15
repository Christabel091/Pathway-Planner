// src/pages/Services.jsx
import "../styles/Pages.css";

export default function Services() {
  return (
    <section className="page">
      <h1>Services</h1>
      <ul className="feature-list">
        <li><strong>Create goals:</strong> patients/caregivers define care goals.</li>
        <li><strong>Edit goals:</strong> update details as needs change.</li>
        <li><strong>Submit for approval:</strong> doctors approve goals.</li>
        <li><strong>Track progress:</strong> caregivers observe and log progress.</li>
      </ul>
    </section>
  );
}