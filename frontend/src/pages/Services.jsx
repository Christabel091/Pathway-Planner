// src/pages/Services.jsx
import "../styles/Pages.css";

export default function Services() {
  return (
    <section className="page">
      <h1>Services</h1>
      <div className="services-container">
        <div className="service-card">
          <h2> Create Goals</h2>
          <p>Patients and caregivers define care goals.</p>
        </div>
        <div className="service-card">
          <h2> Edit Goals</h2>
          <p>Update details as needs change.</p>
        </div>
        <div className="service-card">
          <h2> Track your daily activities</h2>
          <p>from meals, medicine, sleep to journals.</p>
        </div>
        <div className="service-card">
          <h2> Track Progress</h2>
          <p>Caregivers observe and log progress.</p>
        </div>
        <div className="service-card">
          <h2>AI Goal Suggestions</h2>
          <p>We suggest goals adjustments, approved by your clinican.</p>
        </div>
      </div>
    </section>
  );
}
