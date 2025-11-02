/** @format */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { PieChart, Pie, Cell } from "recharts";

/* Ring colors aligned to theme */
const PIE_COLORS = {
  completedGradientStart: "#aa7b4fff",
  completedGradientEnd: "#754829ff",
  remaining: "#dcb2a1ff",
};

/* Simple inline icons (no deps) */
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
  inbox: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        strokeWidth="2"
        d="M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v7l4 5h12l4-5z"
      />
      <path strokeWidth="2" d="M6 10l6 3 6-3" />
    </svg>
  ),
  patients: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="9" cy="7" r="4" strokeWidth="2" />
      <path strokeWidth="2" d="M2 21a7 7 0 0114 0" />
      <circle cx="18" cy="8" r="3" strokeWidth="2" />
      <path strokeWidth="2" d="M22 21a5 5 0 00-7-4" />
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
  calendar: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
      <path strokeWidth="2" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  key: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="7" cy="12" r="3" strokeWidth="2" />
      <path strokeWidth="2" d="M10 12h10l-2 2 2 2-2 2" />
    </svg>
  ),
  settings: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
      <path strokeWidth="2" d="M2 12h2m16 0h2M12 2v2m0 16v2" />
    </svg>
  ),
  logout: (cls = "tw-w-5 tw-h-5") => (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeWidth="2" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path strokeWidth="2" d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
};

export default function ClinicianDashboard() {
  const { user } = useAuth();
  const displayName = user?.username || "Clinician";

  /* ---------- Local state (front-end only; add your API where noted) ---------- */
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [inviteCode, setInviteCode] = useState("PP-7H2K-93Q"); // TODO: GET /clinicians/:id -> invite_code
  const [patients, setPatients] = useState([]); // TODO: GET /clinicians/:id/patients
  const [approvals, setApprovals] = useState([]); // TODO: GET /clinicians/:id/approvals (pending goals)
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch real data for clinician
    setPatients([
      {
        id: 5,
        name: "Christabel Obi-Nwosu",
        last_update: "Today",
        alerts: 1,
        goals_completed_pct: 45,
      },
      {
        id: 8,
        name: "Sayuri Shrestha",
        last_update: "Yesterday",
        alerts: 0,
        goals_completed_pct: 72,
      },
      {
        id: 11,
        name: "Mutlu E.N.",
        last_update: "2d ago",
        alerts: 2,
        goals_completed_pct: 30,
      },
    ]);
    setApprovals([
      {
        id: 101,
        patient: "Christabel Obi-Nwosu",
        title: "Hydration—6 cups daily",
        submitted: "Today",
      },
      {
        id: 102,
        patient: "Mutlu E.N.",
        title: "Evening breathing (10 min)",
        submitted: "Yesterday",
      },
    ]);
  }, []);

  const totalPatients = patients.length;
  const avgCompletion = useMemo(() => {
    if (!patients.length) return 0;
    return Math.round(
      patients.reduce((a, p) => a + (p.goals_completed_pct || 0), 0) /
        patients.length
    );
  }, [patients]);

  const ringData = [
    { name: "Completed", value: avgCompletion },
    { name: "Remaining", value: 100 - avgCompletion },
  ];

  const navItems = [
    { key: "Dashboard", icon: Icons.patients, path: "/dashboard/clinician" },
    {
      key: "Patients",
      icon: Icons.patients,
      path: "/dashboard/clinician/patients",
    },
    { key: "Inbox", icon: Icons.inbox, path: "/dashboard/clinician/inbox" },
    {
      key: "Appointments",
      icon: Icons.calendar,
      path: "/dashboard/clinician/appointments",
    },
    { key: "Lab Results", icon: Icons.labs, path: "/dashboard/clinician/labs" },
    {
      key: "Invite / Code",
      icon: Icons.key,
      path: "/dashboard/clinician/invite",
    },
    { key: "Settings", icon: Icons.settings, path: "/account-settings" },
    { key: "Log Out", icon: Icons.logout, path: "/logout" },
  ];
  const location = useLocation();

  /* ---------- UI ---------- */
  return (
    <div className="tw-flex tw-min-h-screen tw-text-cocoa-700">
      {/* MOBILE TOP BAR */}
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

      {/* SIDEBAR (desktop) */}
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

      {/* MOBILE DRAWER */}
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

      {/* MAIN */}
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
        {/* Decorative background blobs */}
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw--z-10">
          <div className="tw-absolute tw-top-24 tw-right-[-6rem] tw-w-[22rem] tw-h-[22rem] tw-rounded-full tw-bg-blush-200/30 tw-blur-3xl" />
          <div className="tw-absolute tw-bottom-16 tw-left-[-4rem] tw-w-[18rem] tw-h-[18rem] tw-rounded-full tw-bg-sand-100/40 tw-blur-3xl" />
        </div>

        {/* Header */}
        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6 tw-mb-8">
          {/* Welcome */}
          <header className="tw-col-span-1 xl:tw-col-span-2 tw-rounded-[20px] tw-bg-clay-200/80 tw-backdrop-blur-sm tw-shadow-soft tw-p-6 tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center">
            <div>
              <h2 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
                Welcome
              </h2>
              <p className="tw-mt-1 tw-text-xl tw-font-semibold tw-text-clay-700 tw-tracking-wide">
                Dr. {displayName}
              </p>
              <p className="tw-text-sm tw-text-cocoa-700 tw-mt-1">
                Monitor patients, approve goals, share notes, and coordinate
                care.
              </p>
            </div>

            {/* Avg completion ring */}
            <div className="tw-mt-4 md:tw-mt-0 tw-flex tw-items-center tw-gap-4">
              <PieChart width={120} height={120}>
                <defs>
                  <linearGradient id="clinAvg" x1="0" y1="0" x2="1" y2="1">
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
                  data={ringData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={52}
                  startAngle={90}
                  endAngle={450}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="url(#clinAvg)" />
                  <Cell fill={PIE_COLORS.remaining} />
                </Pie>
              </PieChart>
              <div>
                <div className="tw-text-2xl tw-font-bold tw-text-clay-700">
                  {avgCompletion}%
                </div>
                <div className="tw-text-xs tw-text-cocoa-700">
                  Avg. goals completed
                </div>
              </div>
            </div>
          </header>

          {/* Invite code / Regenerate */}
          <section className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Invite Code
            </h3>
            <p className="tw-text-sm tw-text-cocoa-700 tw-mb-3">
              Share this code with patients to link to your care.
            </p>
            <div className="tw-flex tw-items-center tw-gap-2">
              <code className="tw-text-base tw-font-semibold tw-bg-white/70 tw-border tw-border-white/60 tw-rounded-xl tw-px-3 tw-py-1">
                {inviteCode}
              </code>
              <button className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-3 tw-py-2 tw-rounded-xl tw-shadow">
                Regenerate
              </button>
            </div>
          </section>
        </div>

        {/* Content */}
        <section className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
          {/* Inbox / Approvals */}
          <div className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-col-span-1">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Inbox — Pending Approvals
            </h3>
            {approvals.length ? (
              <ul className="tw-space-y-2">
                {approvals.map((a) => (
                  <li
                    key={a.id}
                    className="tw-rounded-xl tw-bg-white/70 tw-border tw-border-white/60 tw-p-3 tw-flex tw-items-center tw-justify-between"
                  >
                    <div>
                      <div className="tw-text-sm tw-font-semibold tw-text-clay-700">
                        {a.title}
                      </div>
                      <div className="tw-text-xs tw-text-cocoa-600">
                        {a.patient} • {a.submitted}
                      </div>
                    </div>
                    <div className="tw-flex tw-gap-2">
                      <button
                        className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-600 tw-text-white hover:tw-bg-clay-700"
                        onClick={() => {
                          // TODO: PATCH /goals/:id -> { status: 'active' }
                        }}
                      >
                        Approve
                      </button>
                      <button
                        className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-rose-500 tw-text-white hover:tw-bg-rose-600"
                        onClick={() => {
                          // TODO: PATCH /goals/:id -> { status: 'rejected' }
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="tw-text-sm tw-text-cocoa-700">No items waiting.</p>
            )}
          </div>

          {/* Patients list (click-through or expand) */}
          <div className="tw-rounded-[20px] tw-bg-white tw-shadow-soft tw-p-6 tw-col-span-1 xl:tw-col-span-2">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-3">
              Your Patients
            </h3>
            {patients.length ? (
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                {patients.map((p) => (
                  <div
                    key={p.id}
                    className="tw-rounded-2xl tw-border tw-border-white/60 tw-bg-white/70 tw-backdrop-blur tw-shadow-soft tw-p-4 tw-flex tw-flex-col tw-gap-2"
                  >
                    <div className="tw-flex tw-items-center tw-justify-between">
                      <div className="tw-font-semibold tw-text-clay-700">
                        {p.name}
                      </div>
                      {p.alerts > 0 && (
                        <span className="tw-text-[11px] tw-rounded-full tw-px-2 tw-py-0.5 tw-bg-[#fff3e6] tw-text-[#7a4a1f] tw-border tw-border-[#f6debf]">
                          {p.alerts} alert{p.alerts > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="tw-text-xs tw-text-cocoa-600">
                      Last update: {p.last_update}
                    </div>

                    {/* Mini progress ring */}
                    <div className="tw-flex tw-items-center tw-gap-3 tw-mt-1">
                      <PieChart width={84} height={84}>
                        <defs>
                          <linearGradient
                            id={`pp-${p.id}`}
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
                          data={[
                            { name: "Completed", value: p.goals_completed_pct },
                            {
                              name: "Remaining",
                              value: 100 - p.goals_completed_pct,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={26}
                          outerRadius={34}
                          startAngle={90}
                          endAngle={450}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={`url(#pp-${p.id})`} />
                          <Cell fill={PIE_COLORS.remaining} />
                        </Pie>
                      </PieChart>
                      <div>
                        <div className="tw-text-lg tw-font-bold tw-text-clay-700">
                          {p.goals_completed_pct}%
                        </div>
                        <div className="tw-text-xs tw-text-cocoa-700">
                          Goals completed
                        </div>
                      </div>
                    </div>

                    <div className="tw-flex tw-gap-2 tw-mt-2">
                      <Link
                        to={`/dashboard/clinician/patients/${p.id}`}
                        className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-600 tw-text-white hover:tw-bg-clay-700"
                      >
                        View Profile
                      </Link>
                      <button
                        className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-white/80 hover:tw-bg-white"
                        onClick={() => {
                          // TODO: quick note / contact action
                        }}
                      >
                        Quick Note
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tw-text-sm tw-text-cocoa-700">No patients yet.</p>
            )}
          </div>

          {/* Appointments */}
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                Appointments
              </h3>
              <span className="tw-text-xs tw-bg-white/70 tw-backdrop-blur tw-text-clay-700 tw-px-2.5 tw-py-1 tw-rounded-full">
                Today: 2
              </span>
            </div>
            <p className="tw-mt-2 tw-mb-3">Send reminders, mark attendance.</p>
            <div className="tw-flex tw-gap-2">
              <button className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow">
                Send Reminder
              </button>
              <button className="tw-bg-white/80 hover:tw-bg-white tw-px-4 tw-py-2 tw-rounded-xl">
                View Calendar
              </button>
            </div>
            {/* TODO: Integrate calendar data & reminder API */}
          </div>

          {/* Lab Results */}
          <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
            <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
              Lab Results
            </h3>
            <p className="tw-mb-3">Upload or review recent labs.</p>
            <div className="tw-flex tw-gap-2">
              <button className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow">
                Upload Lab
              </button>
              <button className="tw-bg-white/80 hover:tw-bg-white tw-px-4 tw-py-2 tw-rounded-xl">
                Review
              </button>
            </div>
            {/* TODO: Wire to /labs endpoints */}
          </div>
        </section>
      </main>
    </div>
  );
}
