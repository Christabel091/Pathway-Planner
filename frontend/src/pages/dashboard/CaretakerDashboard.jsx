/** @format */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
import { PieChart, Pie, Cell } from "recharts";
import { getToken } from "../../utility/auth";

/* Progress ring palette */
const PIE_COLORS = {
  completedGradientStart: "#76B28C",
  completedGradientEnd: "#A1D5BA",
  remaining: "#F7E8CF",
};

export default function CaretakerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const displayName = user?.username || "Caretaker";
  const token = getToken();

  const [linkedPatients, setLinkedPatients] = useState([]);
  const [activePatientId, setActivePatientId] = useState(null);
  const [activePatient, setActivePatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Add patient (link) state — using inviteCode
  const [inviteCode, setInviteCode] = useState("");
  const [linkMessage, setLinkMessage] = useState("");
  const [linkMessageType, setLinkMessageType] = useState("info");
  const [linkLoading, setLinkLoading] = useState(false);

  const hasPatients = linkedPatients.length > 0;

  const fetchPatientSnapshot = async (id, signal) => {
    if (!base_URL || !user?.id) return;
    const options = {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
    if (signal) options.signal = signal;

    const res = await fetch(
      `${base_URL}/caretakers/patients/${id}?userId=${user.id}`,
      options
    );
    if (!res.ok) {
      throw new Error(`Failed to load patient (HTTP ${res.status})`);
    }
    const p = await res.json();
    setActivePatient(p);
  };

  // Load all patients linked to this caretaker
  useEffect(() => {
    if (!user?.id || !base_URL || !token) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(
          `${base_URL}/caretakers/me/patients?userId=${user.id}`,
          {
            credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
            signal: ctrl.signal,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        const patients = Array.isArray(data.patients) ? data.patients : [];
        setLinkedPatients(patients);

        const firstId = patients?.[0]?.id ?? null;
        setActivePatientId(firstId);

        if (firstId) {
          await fetchPatientSnapshot(firstId, ctrl.signal);
        } else {
          setActivePatient(null);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setErr(String(e.message || e));
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, base_URL, token]);

  const onChangePatient = async (id) => {
    setActivePatientId(id);
    if (!id) {
      setActivePatient(null);
      return;
    }

    try {
      setLoading(true);
      setErr("");
      await fetchPatientSnapshot(id);
    } catch (e) {
      console.error(e);
      setErr(String(e.message || e));
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

  const lastLab = activePatient?.labs?.[0];
  const nextDoseText = "—"; // placeholder

  const goalProgressData = [
    { name: "Completed", value: percentComplete },
    { name: "Remaining", value: 100 - percentComplete },
  ];

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    setLinkMessage("");
    setLinkMessageType("info");

    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setLinkMessageType("error");
      setLinkMessage("Enter the invite code from your patient's link.");
      return;
    }

    try {
      setLinkLoading(true);
      const res = await fetch(`${base_URL}/caretakers/link-patient`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          inviteCode: trimmed,
          caretakerUserId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLinkMessageType("error");
        setLinkMessage(
          data?.error || `Failed to link patient (HTTP ${res.status})`
        );
        return;
      }

      setLinkMessageType("success");
      setLinkMessage("Patient linked successfully.");
      setInviteCode("");

      // Refresh linked patients and auto-select the newly linked one
      try {
        const listRes = await fetch(
          `${base_URL}/caretakers/me/patients?userId=${user.id}`,
          {
            credentials: "include",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (listRes.ok) {
          const listData = await listRes.json();
          const patients = Array.isArray(listData.patients)
            ? listData.patients
            : [];
          setLinkedPatients(patients);

          const newlyLinked = data.patient; // from backend response
          const firstId = newlyLinked?.id ?? patients?.[0]?.id ?? null;
          setActivePatientId(firstId);

          if (firstId) {
            await fetchPatientSnapshot(firstId);
          } else {
            setActivePatient(null);
          }
        }
      } catch (err2) {
        console.error("Refresh patients after link failed:", err2);
      }
    } catch (e) {
      console.error(e);
      setLinkMessageType("error");
      setLinkMessage(String(e.message || e));
    } finally {
      setLinkLoading(false);
    }
  };

  const renderAddPatientCard = (extraClasses = "") => (
    <div
      className={
        "tw-rounded-[24px] tw-bg-gradient-to-br tw-from-[#FBE5D2] tw-via-[#FDEFE2] tw-to-[#F9D0C2] tw-border tw-border-white/70 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-between " +
        extraClasses
      }
    >
      <div>
        <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-1">
          Add Patient
        </h3>
        <p className="tw-text-xs tw-text-clay-700/80 tw-mb-3">
          Paste the invite code from the link your patient shares. You can link
          multiple patients.
        </p>
      </div>
      <form
        onSubmit={handleLinkPatient}
        className="tw-flex tw-flex-col tw-gap-2"
      >
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/80 tw-px-3 tw-py-2 tw-text-sm"
          placeholder="Enter invite code from patient link"
          disabled={linkLoading}
        />
        <button
          type="submit"
          disabled={linkLoading || !inviteCode.trim()}
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-clay-500 hover:tw-bg-clay-600 tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-shadow disabled:tw-opacity-50 disabled:tw-cursor-not-allowed"
        >
          {linkLoading ? "Linking..." : "Link Patient"}
        </button>

        {linkMessage && (
          <p
            className={[
              "tw-text-xs tw-mt-1",
              linkMessageType === "error"
                ? "tw-text-rose-700"
                : linkMessageType === "success"
                ? "tw-text-emerald-700"
                : "tw-text-clay-700",
            ].join(" ")}
          >
            {linkMessage}
          </p>
        )}
      </form>
    </div>
  );

  const handleLogout = () => {
    navigate("/logout", { replace: true });
  };

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

        {/* Header row (pink) + optional Snapshot (peach) */}
        {hasPatients ? (
          <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6 tw-mb-8">
            <header className="tw-col-span-1 xl:tw-col-span-2 tw-rounded-[20px] tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#F9E2DA] tw-backdrop-blur-sm tw-shadow-soft tw-p-6 tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center">
              <div>
                <h2 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
                  Welcome
                </h2>
                <p className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-clay-700 tw-tracking-wide">
                  {displayName}
                </p>
                <p className="tw-mt-1 tw-text-xs tw-text-clay-700/80">
                  Monitor your linked patients in view-only mode.
                </p>
              </div>

              <div className="tw-mt-4 md:tw-mt-0 tw-flex tw-flex-col tw-items-end tw-gap-2">
                <label className="tw-text-xs tw-text-clay-700">
                  Viewing patient
                </label>
                <select
                  value={activePatientId || ""}
                  onChange={(e) => onChangePatient(Number(e.target.value))}
                  className="tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/80 tw-px-3 tw-py-2 tw-text-sm tw-min-w-[200px]"
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

            {/* Patient Snapshot on same row as welcome */}
            <section className="tw-col-span-1 tw-rounded-[20px] tw-bg-[#FFF4E7] tw-shadow-soft tw-p-6">
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
                  {activePatient.dob && (
                    <div>
                      <span className="tw-font-medium">DOB:</span>{" "}
                      {new Date(activePatient.dob).toLocaleDateString()}
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
                <p className="tw-text-cocoa-700 tw-text-sm">
                  Select a patient from the top-right to view details.
                </p>
              )}
            </section>
          </div>
        ) : (
          // No patients yet: welcome spans full row
          <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6 tw-mb-8">
            <header className="tw-col-span-1 xl:tw-col-span-3 tw-rounded-[20px] tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#F9E2DA] tw-backdrop-blur-sm tw-shadow-soft tw-p-6 tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center">
              <div>
                <h2 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
                  Welcome
                </h2>
                <p className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-clay-700 tw-tracking-wide">
                  {displayName}
                </p>
                <p className="tw-mt-1 tw-text-xs tw-text-clay-700/80">
                  Link a patient to start monitoring their progress.
                </p>
              </div>
            </header>
          </div>
        )}

        {/* If no patients yet: show ONLY add-patient card (plus header above) */}
        {!hasPatients && (
          <section className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
            {renderAddPatientCard("xl:tw-col-span-3")}
          </section>
        )}

        {/* If there ARE patients: show dashboard cards */}
        {hasPatients && (
          <>
            {/* Main grid with add card + metrics */}
            <section className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
              {/* Peach zone: Add Patient + Goals */}
              {renderAddPatientCard()}

              {/* Goals progress (peach) */}
              <div className="tw-rounded-[24px] tw-bg-[#FFF4E7] tw-backdrop-blur-md tw-border tw-border-white/60 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-items-center tw-justify-center tw-relative">
                <span className="tw-absolute tw--top-3 tw-left-6 tw-bg-white/80 tw-backdrop-blur tw-text-clay-700 tw-text-xs tw-px-3 tw-py-1 tw-rounded-full tw-shadow">
                  Progress
                </span>
                <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-4">
                  Patient Goals
                </h3>
                <PieChart width={170} height={170}>
                  <defs>
                    <linearGradient
                      id="goalGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
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

              {/* Medications (view-only) – transitional gradient */}
              <div className="tw-rounded-[20px] tw-bg-amber-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
                <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                    Medications (view only)
                  </h3>
                  <span className="tw-text-xs tw-bg-white/70 tw-backdrop-blur tw-text-clay-700 tw-px-2.5 tw-py-1 tw-rounded-full">
                    Next: {nextDoseText}
                  </span>
                </div>
                <p className="tw-mt-2 tw-mb-3 tw-text-sm">
                  You can encourage and remind, but you cannot edit the
                  schedule.
                </p>
                <Link
                  to="/dashboard/caretaker/medications"
                  className="tw-self-start tw-bg-clay-400 hover:tw-bg-clay-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow tw-text-sm"
                >
                  View Medicine
                </Link>
              </div>

              {/* Lab Results (view-only) – same family gradient */}
              <div className="tw-rounded-[20px] tw-bg-amber-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
                <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                  Lab Results (view only)
                </h3>
                <p className="tw-mb-3 tw-text-sm">
                  {lastLab ? (
                    <>
                      Latest:{" "}
                      <span className="tw-font-medium">
                        {lastLab.lab_type} {lastLab.lab_value}
                        {lastLab.unit ? ` ${lastLab.unit}` : ""}
                      </span>
                      <span className="tw-text-xs tw-text-clay-700/70 tw-ml-1">
                        ({new Date(lastLab.created_at).toLocaleDateString()})
                      </span>
                    </>
                  ) : (
                    "No recent labs."
                  )}
                </p>
                <Link
                  to="/dashboard/caretaker/labs"
                  className="tw-bg-clay-400 hover:tw-bg-clay-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow tw-text-sm"
                >
                  View Lab Record
                </Link>
              </div>

              {/* Inbox – amber → emerald gradient */}
              <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-amber-100 tw-via-amber-50 tw-to-emerald-100 tw-shadow-soft tw-p-6 tw-flex tw-flex-col">
                <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                  Inbox
                </h3>
                <p className="tw-mb-3 tw-text-sm">
                  Updates from clinicians or the patient will appear here.
                </p>
                <Link
                  to="/dashboard/caretaker/inbox"
                  className="tw-self-start tw-text-white tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-400 hover:tw-bg-clay-600 tw-border tw-border-white/60"
                >
                  Open Inbox
                </Link>
              </div>

              {/* Care notes – green block */}
              <div className="tw-rounded-[20px] tw-bg-[#D4E8C7] tw-backdrop-blur tw-shadow-soft tw-border tw-border-white/60 tw-p-6 tw-col-span-1 xl:tw-col-span-2">
                <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                  Care Notes
                </h3>
                <ul className="tw-list-disc tw-list-inside tw-text-sm tw-space-y-1">
                  <li>Encourage hydration, rest, and small daily wins.</li>
                  <li>
                    Use gentle reminders for medications and light movement.
                  </li>
                  <li>
                    Reach out to the clinician if symptoms or mood worsen.
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}

        {/* Logout card – shifted to green palette since it comes after green zone */}
        <section className="tw-mt-6">
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-[#D4E8C7] tw-to-[#A1D5BA] tw-shadow-soft tw-border tw-border-white/70 tw-p-5 tw-flex tw-items-center tw-justify-between">
            <div className="tw-text-sm tw-text-clay-700 tw-pr-4">
              <p className="tw-font-semibold">Ready to log out?</p>
              <p className="tw-text-xs tw-text-clay-700/80 tw-mt-1">
                Finish checking on your patients and sign out safely.
              </p>
            </div>
            <button
              className="tw-flex tw-items-center tw-gap-2 tw-bg-white/90 hover:tw-bg-white tw-text-clay-700 tw-px-4 tw-py-2 tw-rounded-xl tw-border tw-border-clay-200"
              onClick={handleLogout}
            >
              <span>Log Out</span>
            </button>
          </div>
        </section>

        {/* Footer note */}
        <div className="tw-mt-6 tw-text-xs tw-text-cocoa-700 tw-bg-white/60 tw-border tw-border-white/60 tw-rounded-2xl tw-p-3">
          Caretaker access is <b>view-only</b>. For changes to goals,
          medications, or records, please contact the clinician or patient.
        </div>
      </main>
    </div>
  );
}
