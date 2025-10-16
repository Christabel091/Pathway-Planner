/** @format */
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "../styles/intro.css";

export default function Intro() {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [leaving, setLeaving] = useState(false);

  // Basic swipe detection (left or tap) to proceed

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;

    const onStart = (e) => {
      const t = e.touches?.[0];
      startX = (t ? t.clientX : e.clientX) || 0;
      startY = (t ? t.clientY : e.clientY) || 0;
    };
    const onEnd = (e) => {
      const t = e.changedTouches?.[0];
      const endX = (t ? t.clientX : e.clientX) || 0;
      const endY = (t ? t.clientY : e.clientY) || 0;
      const dx = endX - startX;
      const dy = endY - startY;
      // Trigger on left swipe or tiny tap
      if (dx < -40 || (Math.abs(dx) < 6 && Math.abs(dy) < 6)) {
        proceed();
      }
    };
    el.addEventListener("mousedown", onStart);
    el.addEventListener("mouseup", onEnd);
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("mousedown", onStart);
      el.removeEventListener("mouseup", onEnd);
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  const proceed = () => {
    if (leaving) return;
    setLeaving(true);
    // match CSS transition-duration (450ms)
    setTimeout(() => navigate("/Welcome"), 650);
  };

  return (
    <div
      ref={rootRef}
      className={`intro-screen ${leaving ? "leaving" : ""}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? proceed() : null)}
      aria-label="Welcome screen. Tap or swipe to continue."
    >
      <main className="intro-card" aria-labelledby="app-title">
        <p className="eyebrow delayed-intro">Welcome to</p>
        <h1 id="app-title" className="intro-title">Pathway Planner</h1>
        <p className="intro-tag">Gentle goals, lasting care</p>

        <button className="arrow-next" onClick={proceed} aria-label="Continue to next page">
          <span className="arrow" aria-hidden>→</span>
        </button>
      </main>
    </div>
  );
}