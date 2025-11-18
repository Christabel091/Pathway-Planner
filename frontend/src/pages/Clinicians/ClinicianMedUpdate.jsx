import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import Modal from "../../components/Modal";
import { Link } from "react-router-dom";

export default function ClinicianMedUpdate() {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    patientId: "",
    medName: "",
    dosage: "",
    frequency: "",
    time: "",
    instructions: "",
  });

  // ------------------------------ FETCH PATIENTS ------------------------------
  useEffect(() => {
    async function fetchPatients() {
      try {
        const r = await fetch(`${base_URL}/clinicians/by-user/${user.id}`, {
          credentials: "include",
        });
        const { clinician } = await r.json();

        const r2 = await fetch(
          `${base_URL}/clinicians/${clinician.id}/patients`,
          { credentials: "include" }
        );
        const pj = await r2.json();

        setPatients(pj.patients || []);
      } catch (e) {
        console.error("Failed to load patients:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, [user?.id, base_URL]);

  // ------------------------------ FORM HANDLERS ------------------------------
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      medicine_name: form.medName,
      dosage: form.dosage,
      frequency: form.frequency,
      time_of_day: form.time,
      instructions: form.instructions,
    };

    try {
      const r = await fetch(
        `${base_URL}/patients/${form.patientId}/medications`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!r.ok) throw new Error("Failed to assign medication");

      setMessageType("success");
      setMessage("Medication assigned successfully");

      // Reset form
      setForm({
        patientId: "",
        medName: "",
        dosage: "",
        frequency: "",
        time: "",
        instructions: "",
      });
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("error assigning medication, try again later");
    }
  };

  // ------------------------------ UI ------------------------------
  return (
    <div className="tw-min-h-screen tw-p-6 tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#D4E8C7]">
      <header className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <Link to="/dashboard/clinician" className="tw-text-sm tw-underline">
          Back
        </Link>
      </header>
      <div className="tw-max-w-xl tw-mx-auto tw-bg-[#FFF4E7] tw-rounded-2xl tw-shadow-soft tw-p-6">
        <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700 tw-mb-4">
          Assign Medication
        </h1>

        <p className="tw-text-cocoa-600 tw-mb-6">
          Select a patient and enter medication details.
        </p>

        <form onSubmit={handleSubmit} className="tw-space-y-6">
          {/* PATIENT SELECT */}
          <div>
            <label className="tw-text-sm tw-font-medium tw-text-clay-700">
              Patient
            </label>
            <select
              name="patientId"
              value={form.patientId}
              onChange={handleChange}
              required
              className="tw-w-full tw-mt-1 tw-p-3 tw-rounded-xl tw-border tw-border-sand-200"
            >
              <option value="">Select a patient…</option>

              {loading ? (
                <option>Loading…</option>
              ) : patients.length ? (
                patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              ) : (
                <option>No patients found</option>
              )}
            </select>
          </div>

          {/* MED NAME */}
          <div>
            <label className="tw-text-sm tw-font-medium tw-text-clay-700">
              Medication Name
            </label>
            <input
              type="text"
              name="medName"
              required
              value={form.medName}
              onChange={handleChange}
              className="tw-w-full tw-mt-1 tw-p-3 tw-rounded-xl tw-border tw-border-sand-200"
              placeholder="E.g., Amoxicillin"
            />
          </div>

          {/* DOSAGE */}
          <div>
            <label className="tw-text-sm tw-font-medium tw-text-clay-700">
              Dosage
            </label>
            <input
              type="text"
              name="dosage"
              required
              value={form.dosage}
              onChange={handleChange}
              className="tw-w-full tw-mt-1 tw-p-3 tw-rounded-xl tw-border tw-border-sand-200"
              placeholder="E.g., 250 mg"
            />
          </div>

          {/* FREQUENCY */}
          <div>
            <label className="tw-text-sm tw-font-medium tw-text-clay-700">
              Frequency
            </label>
            <input
              type="text"
              name="frequency"
              required
              value={form.frequency}
              onChange={handleChange}
              className="tw-w-full tw-mt-1 tw-p-3 tw-rounded-xl tw-border tw-border-sand-200"
              placeholder="E.g., Twice daily"
            />
          </div>

          {/* TIME */}
          <div>
            <label className="tw-text-sm tw-font-medium tw-text-clay-700">
              Time of Day
            </label>
            <input
              type="time"
              name="time"
              required
              value={form.time}
              onChange={handleChange}
              className="tw-w-full tw-mt-1 tw-p-3 tw-rounded-xl tw-border tw-border-sand-200"
            />
          </div>

          {/* INSTRUCTIONS */}
          <div>
            <label className="tw-text-sm tw-font-medium tw-text-clay-700">
              Instructions (optional)
            </label>
            <textarea
              name="instructions"
              value={form.instructions}
              onChange={handleChange}
              rows={3}
              className="tw-w-full tw-mt-1 tw-p-3 tw-rounded-xl tw-border tw-border-sand-200"
              placeholder="Any notes or warnings?"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="tw-w-full tw-bg-clay-400 hover:tw-bg-clay-600 tw-text-white tw-font-semibold tw-py-3 tw-rounded-xl tw-shadow"
          >
            Assign Medication
          </button>
        </form>
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
