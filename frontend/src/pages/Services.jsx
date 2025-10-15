// src/pages/Services.jsx
import "../styles/Pages.css";

export default function Services() {
  return (
    <section className="page">
      <h1>Services</h1>
      <div className="services-container">
        <div className="service-card">
          <h2>🎯 Create Goals</h2>
          <p>Patients and caregivers define care goals.</p>
        </div>
        <div className="service-card">
          <h2> 🔧 Edit Goals</h2>
          <p>Update details as needs change.</p>
        </div>
        <div className="service-card">
          <h2> 📤 Submit for Approval</h2>
          <p>Doctors approve goals.</p>
        </div>
        <div className="service-card">
          <h2> 📊 Track Progress</h2>
          <p>Caregivers observe and log progress.</p>
        </div>
      </div>
    </section>
  );
}