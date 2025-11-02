import React, { useEffect, useRef, useState } from "react";
import Modal from "./Modal.jsx"; // your toast/alert component

/**
 * Props:
 * - patientId: number | string
 * - SetIsAddClinicianOpen: (boolean) => void   // closes this modal on success or when user clicks X
 * - setPatientInfo: (patientObj) => void       // update parent with new patient profile on success
 */
const AddClinicianModal = ({
  patientId,
  setIsAddClinicanModal,
  setPatientInfo,
  setPatientsClinician,
}) => {
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "success" | "error"
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  // Focus the input when the modal mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsAddClinicanModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setIsAddClinicanModal]);

  const addClinician = async (e) => {
    e.preventDefault();
    const clinicianInviteCode = e.target.clinicianCode.value?.trim();

    if (!clinicianInviteCode) {
      setMessageType("error");
      setMessage("Please enter an invite code.");
      inputRef.current?.focus();
      return;
    }

    if (!base_URL || !patientId) {
      setMessageType("error");
      setMessage("Configuration error. Please try again later.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const res = await fetch(
        `${base_URL}/onboarding/patients/clinician/${patientId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ clinicianInviteCode }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Backend may return { error: "..."} or message
        const errText =
          data?.error ||
          data?.message ||
          `Failed to add clinician (HTTP ${res.status}).`;
        setMessageType("error");
        setMessage(errText);
        return; // keep modal open
      }

      setPatientInfo(data.profile ?? data);
      setMessageType("success");
      setMessage("Clinician added successfully!");

      //get updated clinician info
      const clinicianRes = await fetch(
        `${base_URL}/onboarding/clinicians/${data.profile.clinician_id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      const clinicianData = await clinicianRes.json();
      console.log("Clinician data:", clinicianData.profile);
      if (clinicianRes.ok) setPatientsClinician(clinicianData.profile);

      // Close the modal shortly after success, or immediately:
      setIsAddClinicanModal(false);
    } catch (err) {
      console.error("Error adding clinician:", err);
      setMessageType("error");
      setMessage("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay
    <div
      className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-px-4"
      aria-labelledby="add-clinician-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="tw-absolute tw-inset-0 tw-bg-black/30"
        onClick={() => setIsAddClinicanModal(false)}
      />

      {/* Modal panel */}
      <div
        ref={dialogRef}
        className="tw-relative tw-z-10 tw-w-full tw-max-w-md tw-rounded-2xl tw-shadow-2xl tw-overflow-hidden tw-border tw-border-white/60"
        style={{
          background: "linear-gradient(180deg, #f9f6f1, #f5ece5, #e7b19d)",
        }}
      >
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-bg-white/60 tw-backdrop-blur-sm">
          <h2
            id="add-clinician-title"
            className="tw-text-lg tw-font-semibold tw-text-clay-700"
          >
            Add a Clinician
          </h2>
          <button
            onClick={() => setIsAddClinicanModal(false)}
            className="tw-text-clay-700 tw-rounded-lg tw-p-2 hover:tw-bg-blush-100"
            aria-label="Close"
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={addClinician}
          className="tw-px-5 tw-pt-5 tw-pb-6 tw-bg-white/55 tw-backdrop-blur-md"
        >
          <label
            htmlFor="clinicianCode"
            className="tw-block tw-text-sm tw-font-medium tw-text-cocoa-700"
          >
            Clinician invite code
          </label>
          <input
            id="clinicianCode"
            name="clinicianCode"
            type="text"
            ref={inputRef}
            className="tw-mt-2 tw-w-full tw-rounded-xl tw-border tw-border-blush-200 tw-bg-white/80 tw-backdrop-blur tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-clay-600"
            placeholder="e.g., CARE-ABCD-1234"
            disabled={loading}
            autoComplete="off"
            required
          />

          {/* Inline message (error/success) */}
          {message && (
            <div
              className={[
                "tw-mt-3 tw-text-sm tw-rounded-lg tw-px-3 tw-py-2",
                messageType === "error" && "tw-bg-[#fbeaea] tw-text-[#7a2e2e]",
                messageType === "success" &&
                  "tw-bg-[#ecf8f1] tw-text-[#1f6b4a]",
                messageType === "info" && "tw-bg-white/70 tw-text-cocoa-700",
              ]
                .filter(Boolean)
                .join(" ")}
              role={messageType === "error" ? "alert" : undefined}
            >
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="tw-mt-5 tw-flex tw-items-center tw-justify-end tw-gap-3">
            <button
              type="button"
              className="tw-px-4 tw-py-2 tw-rounded-xl tw-text-cocoa-700 hover:tw-bg-white/70"
              onClick={() => setIsAddClinicanModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Adding…" : "Add Clinician"}
            </button>
          </div>
        </form>
      </div>

      {/* Optional toast/modal message (your existing <Modal/> component) */}
      {message && (
        <Modal
          message={message}
          type={messageType}
          duration={messageType === "success" ? 4000 : 7000}
          onClose={() => setMessage("")}
        />
      )}
    </div>
  );
};

export default AddClinicianModal;
