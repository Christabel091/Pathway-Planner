// src/pages/About.jsx
import "../styles/legacy/Pages.css";

export default function About() {
  return (
  <div className= "pages-bg">
    <section className="page about-page">
      <div className="about-content">
        <div className="about-text">
          <h1>About Us</h1>
          <p>
            Pathway Planner bridges patients, caregivers, and clinicians to bring clarity and calm to care planning. 
            Our goal is to simplify communication, encourage collaboration, and make goal tracking intuitive and compassionate.
          </p>
          <p>
            We believe healthcare should feel connected — every patient supported, every caregiver empowered, 
            and every clinician informed. Pathway Planner turns care coordination into a partnership.
          </p>
        </div>
      </div>
      <div className="about-flower">
        <img
          src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExNm4ydWV3MDllb3JucG56bHpyZDU1MjVvaGd6dXAyaTFwbTN2N2tscyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/X7mrnQbbk3L9vD9NMN/giphy.gif"
          alt="Animated Flower"
          className="flower-bottom"
        />
      </div>
    </section>
  </div>
  );
}