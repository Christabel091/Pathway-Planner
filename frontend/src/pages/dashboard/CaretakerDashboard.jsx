/** @format */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
import { PieChart, Pie, Cell } from "recharts";

/* Progress ring palette (warm, like patient dashboard) */
const PIE_COLORS = {
  completedGradientStart: "#aa7b4fff",
  completedGradientEnd: "#754829ff",
  remaining: "#dcb2a1ff",
};

export default function CaretakerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const displayName = user?.username || "Caretaker";
  const [linkedPatients, setLinkedPatients] = useState([]); // patient linked to caretaker
  const [activePatientId, setActivePatientId] = useState(null);
  const [activePatient, setActivePatient] = useState(null); // full patient object (readonly)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user?.id || !base_URL) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // TODO: Replace with your real endpoint to get caretaker's linked patients
        // Example: GET /caretakers/:userId/patients (returns array of basic patient profiles)
        const res = await fetch(`${base_URL}/caretakers/${user.id}/patients`, {
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const patients = await res.json();
        setLinkedPatients(Array.isArray(patients) ? patients : []);

        // Auto-select first patient
        const firstId = patients?.[0]?.id ?? null;
        setActivePatientId(firstId);

        if (firstId) {
          // Fetch the full (readonly) patient snapshot
          // Reuse your patients/:userId route if it returns full record by userId,
          // or add a dedicated caretakers view route that enforces read-only access.
          const pRes = await fetch(
            `${base_URL}/caretakers/patient/${firstId}`,
            {
              credentials: "include",
              signal: ctrl.signal,
            }
          );
          if (!pRes.ok) throw new Error(`HTTP ${pRes.status}`);
          const p = await pRes.json();
          setActivePatient(p);
        }
      } catch (e) {
        if (e.name !== "AbortError") setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [user?.id, base_URL]);

  /* ------ When user selects a different patient from dropdown ------ */
  const onChangePatient = async (id) => {
    setActivePatientId(id);
    if (!id) return;
    try {
      setLoading(true);
      setErr("");
      // TODO: same readonly endpoint as above (secure to allow caretakers)
      const pRes = await fetch(`${base_URL}/caretakers/patient/${id}`, {
        credentials: "include",
      });
      if (!pRes.ok) throw new Error(`HTTP ${pRes.status}`);
      const p = await pRes.json();
      setActivePatient(p);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goals = activePatient?.goals ?? [];
  const { totalGoals, completedGoals, percentComplete } = useMemo(() => {
    const total = goals.length;
    const done = goals.filter(
      (g) => g?.completed === true || g?.status === "completed"
    ).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { totalGoals: total, completedGoals: done, percentComplete: pct };
  }, [goals]);

  const lastLab = activePatient?.labs?.[0]; // assuming already sorted desc in your API include
  const nextDoseText = (() => {
    // You might compute this from medicines + schedules in your API; placeholder here:
    return "—"; // TODO show next scheduled medication time if you store schedules
  })();

  const location = useLocation();
  const goalProgressData = [
    { name: "Completed", value: percentComplete },
    { name: "Remaining", value: 100 - percentComplete },
  ];

  return (
    <div className="tw-flex tw-min-h-screen tw-text-cocoa-700">
      <main
        className={[
          "tw-flex-1 tw-min-h-screen tw-bg-fixed",
          "tw-pt-16 lg:tw-pt-0",
          "tw-px-5 md:tw-px-8 tw-pb-10",
        ].join(" ")}
        style={{
          background: "linear-gradient(180deg, #faf7f3, #f6ede7, #ecc4b1)",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Decor blobs */}
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw--z-10">
          <div className="tw-absolute tw-top-24 tw-right-[-6rem] tw-w-[22rem] tw-h-[22rem] tw-rounded-full tw-bg-blush-200/30 tw-blur-3xl" />
          <div className="tw-absolute tw-bottom-16 tw-left-[-4rem] tw-w-[18rem] tw-h-[18rem] tw-rounded-full tw-bg-sand-100/40 tw-blur-3xl" />
        </div>

        {/* Header row */}
        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6 tw-mb-8">
          {/* Welcome + patient selector */}
          <header className="tw-col-span-1 xl:tw-col-span-2 tw-rounded-[20px] tw-bg-clay-200/80 tw-backdrop-blur-sm tw-shadow-soft tw-p-6 tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center">
            <div>
              <h2 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
                Welcome
              </h2>
              <p className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-clay-700 tw-tracking-wide">
                {displayName}
              </p>
            </div>

            {/* Patient chooser (if multiple) */}
            <div className="tw-mt-4 md:tw-mt-0 tw-flex tw-items-center tw-gap-3">
              <label className="tw-text-sm tw-text-clay-700">Viewing:</label>
              <select
                value={activePatientId || ""}
                onChange={(e) => onChangePatient(Number(e.target.value))}
                className="tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/80 tw-px-3 tw-py-2 tw-text-sm"
                disabled={loading || !linkedPatients.length}
                aria-label="Select patient"
              >
                {linkedPatients.length === 0 && (
                  <option value="">No linked patients</option>
                )}
                {linkedPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? `Patient ${p.id}`}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {/* Patient snapshot (readonly) */}
          <section className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Patient Snapshot
            </h3>
            {activePatient ? (
              <div className="tw-text-sm tw-space-y-1">
                <div>
                  <span className="tw-font-medium">Name:</span>{" "}
                  {activePatient.full_name}
                </div>
                {activePatient.gender && (
                  <div>
                    <span className="tw-font-medium">Gender:</span>{" "}
                    {activePatient.gender}
                  </div>
                )}
                {activePatient.chronic_conditions && (
                  <div className="tw-line-clamp-2">
                    <span className="tw-font-medium">Conditions:</span>{" "}
                    {activePatient.chronic_conditions}
                  </div>
                )}
                {activePatient.current_medications && (
                  <div className="tw-line-clamp-2">
                    <span className="tw-font-medium">Medications:</span>{" "}
                    {activePatient.current_medications}
                  </div>
                )}
              </div>
            ) : (
              <p className="tw-text-cocoa-700">
                Select a patient to view details.
              </p>
            )}
          </section>
        </div>

        {/* Content grid */}
        <section className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
          {/* Goals progress — glass & floating (readonly) */}
          <div className="tw-rounded-[24px] tw-bg-white/60 tw-backdrop-blur-md tw-border tw-border-white/60 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-items-center tw-justify-center tw-relative">
            <span className="tw-absolute tw--top-3 tw-left-6 tw-bg-white/80 tw-backdrop-blur tw-text-clay-700 tw-text-xs tw-px-3 tw-py-1 tw-rounded-full tw-shadow">
              Progress
            </span>

            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-4">
              Patient Goals
            </h3>

            <PieChart width={170} height={170}>
              <defs>
                <linearGradient id="goalGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop
                    offset="0%"
                    stopColor={PIE_COLORS.completedGradientStart}
                  />
                  <stop
                    offset="100%"
                    stopColor={PIE_COLORS.completedGradientEnd}
                  />
                </linearGradient>
              </defs>
              <Pie
                data={goalProgressData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={74}
                startAngle={90}
                endAngle={450}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="url(#goalGradient)" />
                <Cell fill={PIE_COLORS.remaining} />
              </Pie>
            </PieChart>

            <p className="tw-mt-3 tw-text-center">
              <span className="tw-text-2xl tw-font-bold tw-text-clay-700">
                {percentComplete}%
              </span>{" "}
              completed
            </p>
            <p className="tw-text-sm tw-mt-1">
              {completedGoals}/{totalGoals} goals
            </p>
          </div>

          {/* Medications — soft gradient, view-only */}
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                Medications (view only)
              </h3>
              <span className="tw-text-xs tw-bg-white/70 tw-backdrop-blur tw-text-clay-700 tw-px-2.5 tw-py-1 tw-rounded-full">
                Next: {nextDoseText}
              </span>
            </div>
            <p className="tw-mt-2 tw-mb-3">
              You can remind or encourage, but not edit.
            </p>
            <Link
              to="/dashboard/caretaker/medications"
              className="tw-self-start tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
            >
              View Schedule
            </Link>
          </div>

          {/* Lab Results — gradient, view-only */}
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Lab Results (view only)
            </h3>
            <p className="tw-mb-3">
              {lastLab ? (
                <>
                  Latest:{" "}
                  <span className="tw-font-medium">
                    {lastLab.title ?? "New result"}
                  </span>
                </>
              ) : (
                "No recent labs."
              )}
            </p>
            <Link
              to="/dashboard/caretaker/labs"
              className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
            >
              View Lab Record
            </Link>
          </div>

          {/* Inbox / Messages */}
          <div className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-flex tw-flex-col">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Inbox
            </h3>
            <p className="tw-mb-3">
              Updates from clinicians or the patient will appear here.
            </p>
            <Link
              to="/dashboard/caretaker/inbox"
              className="tw-self-start tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-bg-white/80 hover:tw-bg-white tw-border tw-border-white/60"
            >
              Open Inbox
            </Link>
          </div>

          {/* Patient details quick view — readonly facts */}
          <div className="tw-rounded-[20px] tw-bg-white/70 tw-backdrop-blur tw-shadow-soft tw-border tw-border-white/60 tw-p-6 tw-col-span-1 xl:tw-col-span-2">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Care Notes
            </h3>
            <ul className="tw-list-disc tw-list-inside tw-text-sm tw-space-y-1">
              <li>Encourage hydration and rest; celebrate small wins.</li>
              <li>
                Use gentle reminders (meds, light walks, breathing exercises).
              </li>
              <li>
                If pain spikes or mood dips, contact the clinician promptly.
              </li>
            </ul>
            {/* Optional: show AI summary of the week (readonly) */}
            {/* TODO: GET /caretakers/patient/:id/ai/summary */}
          </div>
        </section>

        {/* Footer note */}
        <div className="tw-mt-6 tw-text-xs tw-text-cocoa-700 tw-bg-white/60 tw-border tw-border-white/60 tw-rounded-2xl tw-p-3">
          Caretaker access is <b>view-only</b>. For changes to goals, meds, or
          records, please contact the clinician.
        </div>

        {/* Errors */}
        {err && (
          <div
            className="tw-mt-4 tw-text-sm tw-text-rose-700 tw-bg-rose-50 tw-border tw-border-rose-200 tw-rounded-xl tw-px-3 tw-py-2"
            onClick={() => navigate("/logout")}
          >
            LOG OUT
          </div>
        )}
      </main>
    </div>
  );
}
