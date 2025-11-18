import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";
export default function ClinicianMedicationsPage() {
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch(`${base_URL}/clinicians/by-user/${user.id}`, {
          credentials: "include",
        });
        const { clinician } = await res.json();

        const res2 = await fetch(
          `${base_URL}/clinicians/${clinician.id}/patients`,
          { credentials: "include" }
        );
        const data = await res2.json();

        console.log("PATIENTS:", data.patients);

        setPatients(data.patients || []);
      } catch (err) {
        console.error("Failed to load patients:", err);
      }
    }
    if (user?.id) loadPatients();
  }, [base_URL, user.id]);

  // ---------------- LOAD SELECTED PATIENT MEDS ----------------
  async function loadMeds(patientId) {
    if (!patientId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${base_URL}/patients/by-patient/${patientId}/medications`,
        { credentials: "include" }
      );

      const data = await res.json();

      console.log("Loaded meds:", data);

      setMeds(data.meds || []);
    } catch (err) {
      console.error("Failed to load meds:", err);
    } finally {
      setLoading(false);
    }
  }

  // ---------------- DELETE MEDICATION ----------------
  async function deleteMed(medId) {
    if (!confirm("Delete this medication?")) return;

    try {
      await fetch(`${base_URL}/patients/medications/${medId}`, {
        method: "DELETE",
        credentials: "include",
      });

      // Remove from UI
      setMeds((prev) => prev.filter((m) => m.id !== medId));
    } catch (err) {
      console.error("Failed to delete medication:", err);
      setMessageType("error");
      setMessage("could not delete medication");
    }
  }

  return (
    <div className="tw-min-h-screen tw-px-6 tw-py-6  tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#D4E8C7]">
      <div className="tw-max-w-3xl tw-mx-auto">
        {/* HEADER */}
        <header className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
            Clinician Medication Review
          </h1>
          <Link to="/dashboard/clinician" className="tw-text-sm tw-underline">
            Back
          </Link>
        </header>

        {/* PATIENT SELECT */}
        <div className="tw-mb-6">
          <label className="tw-text-sm tw-font-medium tw-text-clay-700">
            Select Patient
          </label>
          <select
            className="tw-w-full tw-p-3 tw-rounded-xl tw-border tw-border-sand-200 tw-mt-1"
            value={selectedPatientId}
            onChange={(e) => {
              setSelectedPatientId(e.target.value);
              loadMeds(e.target.value);
            }}
          >
            <option value="">Choose patient…</option>

            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.name}
              </option>
            ))}
          </select>
        </div>

        {/* MEDICATION LIST */}
        {loading ? (
          <p>Loading medications...</p>
        ) : meds.length === 0 ? (
          <p>No medications assigned.</p>
        ) : (
          <ul className="tw-space-y-4">
            {meds.map((m) => (
              <li
                key={m.id}
                className="tw-bg-[#FFF4E7] tw-rounded-2xl tw-shadow-soft tw-border tw-border-white/60 tw-p-5"
              >
                <div className="tw-flex tw-items-center tw-justify-between">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700">
                    {m.medicine_name}
                  </h3>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => deleteMed(m.id)}
                    className="tw-text-xs tw-bg-rose-600 tw-text-white tw-px-3 tw-py-1 tw-rounded-full hover:tw-bg-rose-700"
                  >
                    Delete
                  </button>
                </div>

                {m.dosage && (
                  <p className="tw-text-sm tw-mt-2">
                    <strong>Dosage:</strong> {m.dosage}
                  </p>
                )}
                {m.frequency && (
                  <p className="tw-text-sm">
                    <strong>Frequency:</strong> {m.frequency}
                  </p>
                )}
                {m.preferred_time && (
                  <p className="tw-text-sm">
                    <strong>Time:</strong> {m.preferred_time}
                  </p>
                )}
                {m.instructions && (
                  <p className="tw-text-sm tw-mt-2 tw-text-cocoa-700">
                    <strong>Instructions:</strong> {m.instructions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

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
}
