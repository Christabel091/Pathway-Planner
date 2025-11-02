/** @format */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";
import { PieChart, Pie, Cell } from "recharts";

/* ---------- Inline icons (no extra deps) ---------- */
const Icons = {
  menu: (cls = "tw-w-6 tw-h-6") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  chevron: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" d="M15 19l-7-7 7-7" />
    </svg>
  ),
  dashboard: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeWidth="2"
        d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"
      />
    </svg>
  ),
  users: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
      <path strokeWidth="2" d="M23 21v-2a4 4 0 00-3-3.87" />
      <path strokeWidth="2" d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  goals: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M12 3v18M3 12h18M4 8h8M12 16h8" />
    </svg>
  ),
  meds: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="7" width="18" height="13" rx="2" strokeWidth="2" />
      <path strokeWidth="2" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
      <path strokeWidth="2" d="M12 11v6M9 14h6" />
    </svg>
  ),
  labs: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeWidth="2"
        d="M9 3v6l-5 9a2 2 0 001.7 3h12.6a2 2 0 001.7-3l-5-9V3"
      />
      <path strokeWidth="2" d="M9 3h6" />
    </svg>
  ),
  inbox: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeWidth="2"
        d="M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v7l4 5h12l4-5z"
      />
      <path strokeWidth="2" d="M6 10l6 3 6-3" />
    </svg>
  ),
  settings: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
      <path
        strokeWidth="2"
        d="M2 12h2m16 0h2M12 2v2m0 16v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
      />
    </svg>
  ),
  logout: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path strokeWidth="2" d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  eye: (cls = "tw-w-4 tw-h-4") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" strokeWidth="2" />
    </svg>
  ),
};

/* Progress ring palette (warm, like patient dashboard) */
const PIE_COLORS = {
  completedGradientStart: "#aa7b4fff",
  completedGradientEnd: "#754829ff",
  remaining: "#dcb2a1ff",
};

export default function CaretakerDashboard() {
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const displayName = user?.username || "Caretaker";

  /* ------ State ------ */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // The caretaker may supervise multiple relatives; pick one
  const [linkedPatients, setLinkedPatients] = useState([]); // [{id, full_name, ...}]
  const [activePatientId, setActivePatientId] = useState(null);
  const [activePatient, setActivePatient] = useState(null); // full patient object (readonly)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  /* ------ Fetch caretaker's linked patients then chosen patient's overview ------ */
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

  /* ------ Derived metrics (readonly) ------ */
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
  const nav = [
    { key: "Dashboard", icon: Icons.dashboard, path: "/dashboard/caretaker" },
    {
      key: "Patient Overview",
      icon: Icons.users,
      path: "/dashboard/caretaker",
    },
    {
      key: "Goals (view only)",
      icon: Icons.goals,
      path: "/dashboard/caretaker/goals",
    },
    {
      key: "Medications (view only)",
      icon: Icons.meds,
      path: "/dashboard/caretaker/medications",
    },
    {
      key: "Lab Results (view only)",
      icon: Icons.labs,
      path: "/dashboard/caretaker/labs",
    },
    { key: "Inbox", icon: Icons.inbox, path: "/dashboard/caretaker/inbox" },
    {
      key: "Account Settings",
      icon: Icons.settings,
      path: "/account-settings",
    },
    { key: "Log Out", icon: Icons.logout, path: "/logout" },
  ];

  const goalProgressData = [
    { name: "Completed", value: percentComplete },
    { name: "Remaining", value: 100 - percentComplete },
  ];

  return (
    <div className="tw-flex tw-min-h-screen tw-text-cocoa-700">
      {/* ---- MOBILE TOP BAR ---- */}
      <div className="tw-fixed tw-top-0 tw-left-0 tw-right-0 tw-z-30 tw-flex tw-items-center tw-justify-between tw-bg-white/80 tw-backdrop-blur tw-border-b tw-border-white/60 tw-px-4 tw-py-3 lg:tw-hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="tw-flex tw-items-center tw-gap-2 tw-text-clay-700"
          aria-label="Open navigation menu"
        >
          {Icons.menu()}
          <span className="tw-font-semibold">Menu</span>
        </button>
        <span className="tw-font-bold tw-text-clay-700">Pathway Planner</span>
        <span className="tw-w-10" />
      </div>

      {/* ---- SIDEBAR (desktop) ---- */}
      <aside
        className={[
          "tw-hidden lg:tw-flex tw-h-screen tw-fixed tw-left-0 tw-top-0 tw-z-20",
          "tw-bg-gradient-to-b tw-from-sand-50 tw-via-blush-50 tw-to-sand-100",
          "tw-flex-col tw-justify-between tw-p-4",
          collapsed ? "tw-w-20" : "tw-w-72",
        ].join(" ")}
      >
        <div className="tw-flex tw-flex-col tw-gap-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <h1
              className={[
                "tw-text-2xl tw-font-bold tw-text-clay-700 tw-tracking-tight",
                collapsed ? "tw-sr-only" : "",
              ].join(" ")}
            >
              Pathway Planner
            </h1>
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="tw-p-2 tw-rounded-lg tw-text-clay-700 hover:tw-bg-blush-100 tw-transition"
              title={collapsed ? "Expand" : "Collapse"}
            >
              {Icons.chevron(
                collapsed ? "tw-w-5 tw-h-5 tw-rotate-180" : "tw-w-5 tw-h-5"
              )}
            </button>
          </div>

          <nav aria-label="Main navigation">
            <ul className="tw-space-y-1.5">
              {nav.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.path}
                    className={[
                      "tw-w-full tw-flex tw-items-center tw-gap-3 tw-p-2 tw-rounded-xl tw-transition",
                      location.pathname === item.path
                        ? "tw-bg-clay-600 tw-text-white"
                        : "tw-text-cocoa-700 hover:tw-bg-blush-100 hover:tw-text-clay-700",
                    ].join(" ")}
                  >
                    {item.icon("tw-w-5 tw-h-5")}
                    <span className={collapsed ? "tw-sr-only" : ""}>
                      {item.key}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <footer
          className={collapsed ? "tw-sr-only" : "tw-text-xs tw-text-cocoa-600"}
        >
          © 2025 Pathway Planner
        </footer>
      </aside>

      {/* ---- MOBILE DRAWER ---- */}
      {mobileOpen && (
        <div className="tw-fixed tw-inset-0 tw-z-40 lg:tw-hidden">
          <button
            className="tw-absolute tw-inset-0 tw-bg-black/20"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          />
          <div className="tw-absolute tw-left-0 tw-top-0 tw-h-full tw-w-72 tw-bg-gradient-to-b tw-from-sand-50 tw-via-blush-50 tw-to-sand-100 tw-p-4 tw-shadow-xl">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h2 className="tw-text-xl tw-font-semibold tw-text-clay-700">
                Menu
              </h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="tw-p-2 tw-rounded-lg tw-text-clay-700 hover:tw-bg-blush-100"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav aria-label="Mobile navigation">
              <ul className="tw-space-y-1.5">
                {nav.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className="tw-w-full tw-flex tw-items-center tw-gap-3 tw-p-2 tw-rounded-xl tw-text-cocoa-700 hover:tw-bg-blush-100 hover:tw-text-clay-700 tw-transition"
                    >
                      {item.icon()}
                      <span>{item.key}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* ---- MAIN ---- */}
      <main
        className={[
          "tw-flex-1 tw-min-h-screen tw-bg-fixed",
          "tw-pt-16 lg:tw-pt-0",
          collapsed ? "lg:tw-ml-20" : "lg:tw-ml-72",
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

            <Link
              to="/dashboard/caretaker/goals"
              className="tw-mt-4 tw-inline-flex tw-items-center tw-gap-2 tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-white/80 hover:tw-bg-white"
              title="View goals (read-only)"
            >
              {Icons.eye()} View goals
            </Link>
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
          <div className="tw-mt-4 tw-text-sm tw-text-rose-700 tw-bg-rose-50 tw-border tw-border-rose-200 tw-rounded-xl tw-px-3 tw-py-2">
            {err}
          </div>
        )}
      </main>
    </div>
  );
}
