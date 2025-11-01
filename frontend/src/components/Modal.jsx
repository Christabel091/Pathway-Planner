// src/components/Modal.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/legacy/modal.css";

export default function Modal({
  message,
  type = "error", // "error" | "success" | "info"
  duration = 7000, // auto-dismiss (ms)
  onClose = () => {}, // parent should clear the message
  dismissible = true, // allow user to close early
}) {
  const [isOpen, setIsOpen] = useState(Boolean(message));
  const [isHiding, setIsHiding] = useState(false);

  // Start auto-dismiss timer
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => beginHide(), duration);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, duration]);

  // ESC to close
  useEffect(() => {
    if (!dismissible || !isOpen) return;
    const onKey = (e) => e.key === "Escape" && beginHide();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissible, isOpen]);

  const beginHide = () => {
    setIsHiding(true);
    // match CSS hide animation duration (280ms)
    setTimeout(() => {
      setIsOpen(false);
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`pp-modal__overlay ${
        isHiding ? "pp-modal__overlay--hide" : ""
      }`}
      aria-hidden={!isOpen}
      onClick={dismissible ? beginHide : undefined}
    >
      <div
        role="alert"
        aria-live="assertive"
        className={`pp-modal ${
          isHiding ? "pp-modal--hide" : ""
        } pp-modal--${type}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pp-modal__bar" aria-hidden="true" />
        <div className="pp-modal__content">
          <p className="pp-modal__text">{message}</p>
          {dismissible && (
            <button
              className="pp-modal__close"
              type="button"
              onClick={beginHide}
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
