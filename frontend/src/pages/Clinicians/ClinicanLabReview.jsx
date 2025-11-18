import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { Link } from "react-router-dom";
import Modal from "../../components/Modal";

export default function ClinicianLabReview() {
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  //load patients
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

        setPatients(data.patients || []);
      } catch (err) {
        console.error("Failed to load patients:", err);
      }
    }

    if (user?.id && base_URL) loadPatients();
  }, [base_URL, user?.id]);

  //load labs of selected patient
  async function loadLabs(patientId) {
    if (!patientId) {
      setLabs([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${base_URL}/patients/by-patient/${patientId}/labs`,
        { credentials: "include" }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      setLabs(data.labs || []);
    } catch (err) {
      console.error("Failed to load labs:", err);
      setMessageType("error");
      setMessage("Could not load lab results.");
    } finally {
      setLoading(false);
    }
  }

  //deletes lab
  async function deleteLab(labId) {
    if (!labId) return;

    try {
      const res = await fetch(`${base_URL}/patients/labs/${labId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      // remove from UI
      setLabs((prev) => prev.filter((l) => l.id !== labId));

      setMessageType("success");
      setMessage("Lab result deleted.");
    } catch (err) {
      console.error("Failed to delete lab:", err);
      setMessageType("error");
      setMessage("Could not delete lab result.");
    }
  }

  const openConfirm = (labId) => {
    setPendingDeleteId(labId);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setPendingDeleteId(null);
  };

  return (
    <div className="tw-min-h-screen tw-px-6 tw-py-6 tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#D4E8C7]">
      <div className="tw-max-w-4xl tw-mx-auto">
        {/* HEADER */}
        <header className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
            Clinician Lab Review
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
              const pid = e.target.value;
              setSelectedPatientId(pid);
              loadLabs(pid);
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

        {/* LAB LIST (patient LabsPage-style, plus Delete) */}
        {loading ? (
          <p>Loading lab results...</p>
        ) : !selectedPatientId ? (
          <p className="tw-text-sm tw-text-cocoa-700">
            Select a patient to view lab results.
          </p>
        ) : labs.length === 0 ? (
          <p>No lab results for this patient.</p>
        ) : (
          <ul className="tw-space-y-3">
            {labs.map((lab) => (
              <li
                key={lab.id}
                className="tw-rounded-2xl tw-bg-white tw-shadow-soft tw-border tw-border-white/60 tw-p-4"
              >
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                  <div>
                    <div className="tw-text-base tw-font-semibold tw-text-clay-700">
                      {lab.lab_type || "Lab Result"}
                      {lab.unit ? (
                        <span className="tw-text-sm tw-text-cocoa-600">
                          {" "}
                          &nbsp;({lab.unit})
                        </span>
                      ) : null}
                    </div>
                    <div className="tw-text-xs tw-text-cocoa-600">
                      {lab.created_at
                        ? new Date(lab.created_at).toLocaleString()
                        : ""}
                      {lab.read_at ? " • viewed" : ""}
                    </div>
                  </div>

                  <div className="tw-flex tw-gap-2">
                    {lab.file_url ? (
                      <a
                        href={lab.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-600 tw-text-white hover:tw-bg-clay-700"
                      >
                        Open File
                      </a>
                    ) : null}
                    <button
                      onClick={() => openConfirm(lab.id)}
                      className="tw-text-xs tw-bg-rose-600 tw-text-white tw-px-3 tw-py-1 tw-rounded-full hover:tw-bg-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="tw-mt-2 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
                  <div className="tw-bg-blush-50 tw-rounded-xl tw-p-3">
                    <div className="tw-text-xs tw-text-cocoa-600">Value</div>
                    <div className="tw-text-lg tw-font-semibold tw-text-clay-700">
                      {lab.lab_value ?? "—"}
                    </div>
                  </div>
                  <div className="tw-bg-blush-50 tw-rounded-xl tw-p-3">
                    <div className="tw-text-xs tw-text-cocoa-600">Unit</div>
                    <div className="tw-text-lg tw-font-semibold tw-text-clay-700">
                      {lab.unit || "—"}
                    </div>
                  </div>
                  <div className="tw-bg-blush-50 tw-rounded-xl tw-p-3">
                    <div className="tw-text-xs tw-text-cocoa-600">Source</div>
                    <div className="tw-text-lg tw-font-semibold tw-text-clay-700">
                      {lab.source || "—"}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CONFIRM DELETE MODAL */}
      {confirmOpen && (
        <div className="tw-fixed tw-inset-0 tw-z-40 tw-flex tw-items-center tw-justify-center">
          <div
            className="tw-absolute tw-inset-0 tw-bg-black/30"
            onClick={closeConfirm}
          />
          <div className="tw-relative tw-z-10 tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-6 tw-w-full tw-max-w-sm">
            <h2 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Delete lab result?
            </h2>
            <p className="tw-text-sm tw-text-cocoa-700 tw-mb-4">
              Are you sure you want to delete this lab record? This action
              cannot be undone.
            </p>
            <div className="tw-flex tw-justify-end tw-gap-3">
              <button
                className="tw-px-4 tw-py-2 tw-rounded-xl tw-border tw-border-sand-200 tw-bg-white hover:tw-bg-sand-50 tw-text-sm"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                className="tw-px-4 tw-py-2 tw-rounded-xl tw-bg-rose-600 hover:tw-bg-rose-700 tw-text-white tw-text-sm"
                onClick={async () => {
                  await deleteLab(pendingDeleteId);
                  closeConfirm();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
