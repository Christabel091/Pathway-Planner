/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo, use } from "react";
import { useAuth } from "../../components/AuthContext";
import { PieChart, Pie, Cell } from "recharts";
import "../../styles/tailwind/dashboard.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AddClinicianModal from "../../components/AddClinicanModal";
import { connectWebSocket } from "../../utility/webSocket";

const PIE_COLORS = {
  completedGradientStart: "#aa7b4fff",
  completedGradientEnd: "#754829ff",
  remaining: "#dcb2a1ff",
};

// Simple inline SVG icons (no extra deps)
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
  goals: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M12 3v18M3 12h18M4 8h8M12 16h8" />
    </svg>
  ),
  daily: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path strokeWidth="2" d="M12 7v5l3 2" />
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
};

export default function PatientDashboard({ patientInfo, setPatientInfo }) {
  const { user, logout } = useAuth();
  const [labAlerts, setLabAlerts] = useState([]);
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const displayName = user?.username || "Patient";
  const navigate = useNavigate();
  const [isAddClinicanModal, setIsAddClinicanModal] = useState(false);
  const [patientsClinician, setPatientsClinician] = useState(null);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patientError, setPatientError] = useState(null);

  useEffect(() => {
    if (!user?.id || !base_URL) return; // guard until we have what we need

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoadingPatient(true);
        setPatientError(null);

        const res = await fetch(`${base_URL}/patients/${user.id}`, {
          method: "GET",
          credentials: "include",
          signal: ctrl.signal,
          // headers not required for GET, but harmless if you keep them
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPatientInfo(data);
        //then fetch patients clinician info based on clinician_id
        if (data.clinician_id && data.clinician_id !== 1) {
          const response = await fetch(
            `${base_URL}/onboarding/clinicians/${data.clinician_id}`,
            {
              method: "GET",
              credentials: "include",
              signal: ctrl.signal,
            }
          );
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const clinicianData = await response.json();
          setPatientsClinician(clinicianData.profile);
        }
      } catch (err) {
        if (err.name !== "AbortError") setPatientError(String(err));
      } finally {
        setLoadingPatient(false);
      }
    })();

    // cleanup cancels the fetch (important in StrictMode where effects run twice)
    return () => ctrl.abort();
  }, [user, base_URL, setPatientsClinician, setPatientInfo]);

  useEffect(() => {
    if (!user?.id) return;
    let opened = false;

    const handleMsg = (msg) => {
      if (msg?.type === "BOOTSTRAP") {
        //unread
        return;
      }
      if (msg?.type === "LAB_NEW") {
        const p = msg.payload || {};
        setLabAlerts((prev) => [{ ...p, ts: Date.now() }, ...prev]);
        console.log("Sending ack for notificationId:", p);
        //print lab alerts
        console.log("Current lab alerts:", labAlerts);
        window.socketInstance &&
          window.socketInstance.readyState === WebSocket.OPEN &&
          window.socketInstance.send(
            JSON.stringify({
              type: "notif:ack",
              notificationId: p.notificationId,
            })
          );
      }
    };

    if (
      !window.socketInstance ||
      window.socketInstance.readyState !== WebSocket.OPEN
    ) {
      connectWebSocket(user, handleMsg);
      opened = true;
    }

    return () => {
      // keeps socket running
    };
  }, [labAlerts, user, user?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const goals = patientInfo?.goals ?? [];
  const { totalGoals, completedGoals, percentComplete } = useMemo(() => {
    const total = Array.isArray(goals) ? goals.length : 0;
    const done = total
      ? goals.filter((g) => g?.completed === true || g?.status === "completed")
          .length
      : 0;

    const pct = total ? Math.round((done / total) * 100) : 0;

    return {
      totalGoals: total,
      completedGoals: done,
      percentComplete: Math.min(100, Math.max(0, pct)), // clamp for safety
    };
  }, [goals]);

  const goalProgress = useMemo(
    () => [
      { name: "Completed", value: percentComplete },
      { name: "Remaining", value: 100 - percentComplete },
    ],
    [percentComplete]
  );

  const hasClinician = !!(
    patientInfo?.clinician_id && patientInfo.clinician_id !== 1
  );

  // Sidebar behavior
  const [mobileOpen, setMobileOpen] = useState(false); // small screens
  const [collapsed, setCollapsed] = useState(false); // desktop collapse

  // inside component
  const location = useLocation();
  const navItems = [
    { key: "Dashboard", icon: Icons.dashboard, path: "/dashboard/patient" },
    { key: "Goals", icon: Icons.goals, path: "/dashboard/goals" },
    { key: "Daily Log", icon: Icons.daily, path: "/dashboard/daily-log" },
    { key: "Medications", icon: Icons.meds, path: "/dashboard/medications" },
    { key: "Lab Results", icon: Icons.labs, path: "/dashboard/lab-results" },
    { key: "Inbox", icon: Icons.inbox, path: "/dashboard/inbox" },
    {
      key: "Account Settings",
      icon: Icons.settings,
      path: "/dashboard/account-settings",
    },
    { key: "Log Out", icon: Icons.logout, path: "/logout" },
  ];

  return (
    <div className="tw-flex tw-min-h-screen tw-text-cocoa-700">
      {/* ---- MOBILE TOP BAR (shows on <lg) ---- */}
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

      <aside
        className={[
          "tw-hidden lg:tw-flex tw-h-screen tw-fixed tw-left-0 tw-top-0 tw-z-20",
          "tw-bg-gradient-to-b tw-from-sand-50 tw-via-blush-50 tw-to-sand-100",
          "tw-flex-col tw-justify-between tw-p-4",
          collapsed ? "tw-w-20" : "tw-w-72",
        ].join(" ")}
      >
        <div className="tw-flex tw-flex-col tw-gap-6">
          {/* Brand + collapse */}
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

          {/* Nav */}
          <nav aria-label="Main navigation">
            <ul className="tw-space-y-1.5">
              {navItems.map((item) => (
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
                {navItems.map((item) => (
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
        </div>
      )}

      <main
        className={[
          "tw-flex-1 tw-min-h-screen tw-bg-fixed",
          "tw-pt-16 lg:tw-pt-0", // account for mobile top bar
          collapsed ? "lg:tw-ml-20" : "lg:tw-ml-72",
          "tw-px-5 md:tw-px-8 tw-pb-10",
        ].join(" ")}
        style={{
          background: "linear-gradient(180deg, #faf7f3, #f6ede7, #ecc4b1)",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Decorative background blobs (soft, behind cards) */}
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw--z-10">
          <div className="tw-absolute tw-top-24 tw-right-[-6rem] tw-w-[22rem] tw-h-[22rem] tw-rounded-full tw-bg-blush-200/30 tw-blur-3xl" />
          <div className="tw-absolute tw-bottom-16 tw-left-[-4rem] tw-w-[18rem] tw-h-[18rem] tw-rounded-full tw-bg-sand-100/40 tw-blur-3xl" />
        </div>

        {/* Header row: Welcome + Clinician */}
        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6 tw-mb-8">
          {/* Welcome */}
          <header className="tw-col-span-1 xl:tw-col-span-2 tw-rounded-[20px] tw-bg-clay-200/80 tw-backdrop-blur-sm tw-shadow-soft tw-p-6 tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center">
            <div>
              <h2 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
                Welcome
              </h2>
              <p className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-clay-700 tw-tracking-wide">
                {displayName}
              </p>
            </div>
            {/* Daily log quick action */}
          </header>

          {/* Clinician */}
          <section className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Your Clinician
            </h3>
            {hasClinician ? (
              <div>
                <div className="tw-font-medium">
                  Dr. {patientsClinician?.full_name}
                </div>
                <div className="tw-text-sm">{patientsClinician?.specialty}</div>
                <div className="tw-text-sm tw-mt-1">
                  email: {patientsClinician?.contact_email}
                </div>
                <div className="tw-text-sm tw-mt-1">
                  Phone: {patientsClinician?.contact_phone}
                </div>
              </div>
            ) : (
              <div>
                <p className="tw-mb-3">
                  No clinician is linked to your account yet.
                </p>
                <button
                  onClick={() => setIsAddClinicanModal(true)}
                  className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
                >
                  Add Clinician
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Content */}
        <section className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
          {/* Goals progress — glass & floating */}
          <div className="tw-rounded-[24px] tw-bg-white/60 tw-backdrop-blur-md tw-border tw-border-white/60 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-items-center tw-justify-center tw-relative">
            {/* floating badge */}
            <span className="tw-absolute tw--top-3 tw-left-6 tw-bg-white/80 tw-backdrop-blur tw-text-clay-700 tw-text-xs tw-px-3 tw-py-1 tw-rounded-full tw-shadow">
              Progress
            </span>

            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-4">
              Goals Progress
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
                data={goalProgress}
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

            {/* Percent + counts */}
            <p className="tw-mt-3 tw-text-center">
              <span className="tw-text-2xl tw-font-bold tw-text-clay-700">
                {percentComplete}%
              </span>{" "}
              completed
            </p>
            <p className="tw-text-sm tw-mt-1 tw-text-cocoa-700">
              {completedGoals}/{totalGoals} goals
            </p>

            {/* Friendly empty state */}
            {totalGoals === 0 && (
              <p className="tw-mt-2 tw-text-xs tw-text-cocoa-600">
                No goals yet — add one to get started.
              </p>
            )}
          </div>

          {/* Inbox — clean card */}
          <div className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-flex tw-flex-col">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Inbox
            </h3>

            {labAlerts.length === 0 ? (
              <p>No new messages.</p>
            ) : (
              <ul className="tw-space-y-2">
                {labAlerts.map((a) => (
                  <li
                    key={`${a.notificationId}-${a.labId}-${a.ts}`}
                    className="tw-flex tw-items-center tw-justify-between tw-bg-blush-100 tw-text-clay-700 tw-rounded-xl tw-px-3 tw-py-2"
                  >
                    <span className="tw-text-sm">
                      New lab: <strong>{a.title}</strong>{" "}
                      {a.unit ? `(${a.unit})` : ""}
                    </span>
                    <Link
                      to={`/dashboard/lab-results?open=${a.labId}`}
                      className="tw-text-sm tw-underline"
                      onClick={() => {
                        if (
                          window.socketInstance?.readyState === WebSocket.OPEN
                        ) {
                          window.socketInstance.send(
                            JSON.stringify({
                              type: "notif:ack",
                              notificationId: a.notificationId,
                            })
                          );
                        }
                      }}
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Medications — soft gradient chip style */}
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                Medications
              </h3>
              <span className="tw-text-xs tw-bg-white/70 tw-backdrop-blur tw-text-clay-700 tw-px-2.5 tw-py-1 tw-rounded-full">
                Next:
              </span>
            </div>
            <p className="tw-mt-2 tw-mb-3">Stay on track with your schedule.</p>
            <button className="tw-self-start tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow">
              View Schedule
            </button>
          </div>

          {/* Lab Results — gradient w/ CTA */}
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Lab Results
            </h3>
            <p className="tw-mb-3">View results sent by your clinican </p>
            <button
              className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
              onClick={() => navigate("/dashboard/lab-results")}
            >
              View Lab Record
            </button>
          </div>

          {/* Suggested Goals (AI) — list chips */}
          <div className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-col-span-1 xl:tw-col-span-2">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-3">
              Suggested Goals (AI)
            </h3>

            {patientInfo?.aiSuggestions?.length > 0 ? (
              <ul className="tw-flex tw-flex-wrap tw-gap-2">
                {patientInfo.aiSuggestions.map((s) => (
                  <li
                    key={s.id}
                    className="tw-text-sm tw-bg-blush-100 tw-text-clay-700 tw-px-3 tw-py-2 tw-rounded-full"
                  >
                    {s.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tw-text-cocoa-700">No suggestions yet.</p>
            )}

            <div className="tw-mt-4">
              <button
                className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
                onClick={() => navigate("/dashboard/goals")}
              >
                Review in Goals
              </button>
            </div>
          </div>

          {/* Daily Log — simple card */}
          <div className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Daily Log
            </h3>
            <p className="tw-mb-3">
              Track symptoms, mood, meals, sleep, exercise and vitals.
            </p>
            <button className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow">
              Open Daily Log
            </button>
          </div>
        </section>
      </main>
      {isAddClinicanModal && (
        <AddClinicianModal
          patientId={patientInfo?.id}
          setIsAddClinicanModal={setIsAddClinicanModal}
          setPatientInfo={setPatientInfo}
          setPatientsClinician={setPatientsClinician}
        />
      )}
    </div>
  );
}
