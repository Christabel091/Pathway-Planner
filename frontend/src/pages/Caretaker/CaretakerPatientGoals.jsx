import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";

export default function CaretakerPatientGoalsPage() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !patientId || !base_URL) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `${base_URL}/caretakers/patients/${patientId}`,
          {
            credentials: "include",
            signal: ctrl.signal,
          }
        );
        if (!res.ok) {
          const msg = `HTTP ${res.status}`;
          setError(msg);
          throw new Error(msg);
        }
        const data = await res.json();
        setPatient(data);
      } catch (err) {
        console.error("Error loading caretaker patient snapshot:", err);
        if (!error) setError("Unable to load patient.");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [user, patientId, base_URL]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="tw-text-red-600">{error}</div>;
  if (!patient) return <div>Patient not found.</div>;

  return (
    <div className="tw-space-y-4">
      {/* Basic info */}
      <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow">
        <h2 className="tw-text-xl tw-font-semibold tw-mb-1">
          {patient.full_name}{" "}
          <span className="tw-text-sm tw-font-normal tw-text-gray-500">
            (ID #{patient.id})
          </span>
        </h2>
        <p className="tw-text-sm tw-text-gray-700">
          Gender: {patient.gender || "—"} • DOB:{" "}
          {patient.dob ? patient.dob.slice(0, 10) : "—"}
        </p>
        <p className="tw-text-sm tw-text-gray-700 tw-mt-2">
          Conditions: {patient.chronic_conditions || "—"}
        </p>
        <p className="tw-text-sm tw-text-gray-700 tw-mt-1">
          Current meds (summary): {patient.current_medications || "—"}
        </p>
      </div>

      {/* Goals */}
      <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Goals</h3>
        {(!patient.goals || patient.goals.length === 0) ? (
          <p className="tw-text-sm tw-text-gray-600">
            No goals available for this patient.
          </p>
        ) : (
          <ul className="tw-space-y-2">
            {patient.goals.map((g) => (
              <li
                key={g.id}
                className="tw-border tw-border-gray-100 tw-rounded-xl tw-p-3"
              >
                <div className="tw-flex tw-justify-between tw-items-start">
                  <div>
                    <div className="tw-font-medium">{g.title}</div>
                    {g.description && (
                      <div className="tw-text-sm tw-text-gray-700 tw-mt-1">
                        {g.description}
                      </div>
                    )}
                  </div>
                  <div className="tw-text-xs tw-text-gray-500 tw-ml-3">
                    Status: {g.status || "—"}
                    <br />
                    Completed: {g.completed ? "Yes" : "No"}
                    {g.due_date && (
                      <>
                        <br />
                        Due: {g.due_date.slice(0, 10)}
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Labs */}
      <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Recent Labs</h3>
        {(!patient.labs || patient.labs.length === 0) ? (
          <p className="tw-text-sm tw-text-gray-600">No lab results found.</p>
        ) : (
          <ul className="tw-space-y-2">
            {patient.labs.map((l) => (
              <li
                key={l.id}
                className="tw-border tw-border-gray-100 tw-rounded-xl tw-p-3 tw-text-sm"
              >
                <div className="tw-font-medium">{l.lab_type}</div>
                <div className="tw-text-gray-700">
                  {l.lab_value} {l.unit || ""}
                </div>
                <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                  {l.created_at
                    ? new Date(l.created_at).toLocaleDateString()
                    : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="tw-text-xs tw-text-gray-500">
        Caretaker access is view-only. For changes, please contact the clinician.
      </div>
    </div>
  );
}