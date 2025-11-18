/** @format */
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import ClinicianLabUpload from "../Clinicians/ClinicianLabUpload";
import { PieChart, Pie, Cell } from "recharts";
import { connectWebSocket } from "../../utility/webSocket";

const PIE_COLORS = {
  completedGradientStart: "#C58A78", // rose-clay
  completedGradientEnd: "#C58A78", // solid
  remaining: "#FCEFE8", // soft peach cream
};

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
  const navigate = useNavigate();
  const displayName = user?.username || "Clinician";
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [showUpload, setShowUpload] = useState(false);
  const [prefillPatientId, setPrefillPatientId] = useState("");

  const [clinicianId, setClinicianId] = useState(null);
  const [inviteCode, setInviteCode] = useState("—");
  const [patients, setPatients] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [alerts, setAlerts] = useState([]); // announcements for inbox

  useEffect(() => {
    let alive = true;
    if (!user?.id || !base_URL) return;

    (async () => {
      try {
        setLoading(true);
        setErr("");

        // 1) Resolve clinician by user id
        const r1 = await fetch(`${base_URL}/clinicians/by-user/${user.id}`, {
          credentials: "include",
        });
        if (!r1.ok) throw new Error(`resolve clinician ${r1.status}`);
        const { clinician } = await r1.json();
        if (!alive) return;

        setClinicianId(clinician.id);
        setInviteCode(clinician.inviteCode || "—");

        // 2) Patients
        const r2 = await fetch(
          `${base_URL}/clinicians/${clinician.id}/patients`,
          {
            credentials: "include",
          }
        );
        if (!r2.ok) throw new Error(`patients ${r2.status}`);
        const pj = await r2.json();
        if (!alive) return;
        setPatients(Array.isArray(pj.patients) ? pj.patients : []);

        // 3) Pending approvals
        const r3 = await fetch(
          `${base_URL}/clinicians/${clinician.id}/approvals`,
          {
            credentials: "include",
          }
        );
        if (!r3.ok) throw new Error(`approvals ${r3.status}`);
        const aj = await r3.json();
        if (!alive) return;
        console.log("approvals", aj.approvals);
        setApprovals(Array.isArray(aj.approvals) ? aj.approvals : []);
      } catch (e) {
        setErr(String(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id, base_URL]);

  async function handleRegenerate() {
    if (!clinicianId) return;
    try {
      const r = await fetch(
        `${base_URL}/regenerate/clinician/invite/${clinicianId}`,
        { method: "POST", credentials: "include" }
      );
      console.log("response", r);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
      setInviteCode(j.inviteCode || "—");
    } catch (e) {
      setErr(String(e));
    }
  }

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

  const ackNotification = (notificationId) => {
    if (
      notificationId &&
      window.socketInstance?.readyState === WebSocket.OPEN
    ) {
      window.socketInstance.send(
        JSON.stringify({
          type: "notif:ack",
          notificationId,
        })
      );
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const handleMsg = (msg) => {
      if (msg?.type === "BOOTSTRAP") return;

      if (msg?.type === "ANNOUNCEMENT") {
        const p = msg.payload || {};
        setAlerts((prev) => [
          {
            notificationId: p.notificationId,
            title: p.title,
            message: p.message,
            created_at: p.created_at,
            ts: Date.now(),
          },
          ...prev,
        ]);
        ackNotification(p.notificationId);
        return;
      }

      if (msg?.type === "GOAL_PENDING") {
        const p = msg.payload || {};
        setApprovals((prev) => [
          {
            id: p.id,
            title: p.title,
            description: p.description,
            patient: p.patient,
            submitted: p.submitted,
          },
          ...prev,
        ]);
        return;
      }
    };

    if (
      !window.socketInstance ||
      window.socketInstance.readyState !== WebSocket.OPEN
    ) {
      connectWebSocket(user, handleMsg);
    } else {
      const ws = window.socketInstance;
      const onMessage = (ev) => {
        let parsed;
        try {
          parsed = JSON.parse(ev.data);
        } catch {
          return;
        }
        handleMsg(parsed);
      };
      ws.addEventListener("message", onMessage);
      return () => ws.removeEventListener("message", onMessage);
    }
  }, [user, user?.id]);

  const hasInboxItems = approvals.length > 0 || alerts.length > 0;

  const handleLogout = () => {
    navigate("/logout", { replace: true });
  };

  return (
    <div
      className="tw-min-h-screen tw-flex tw-justify-center tw-items-stretch tw-text-cocoa-700 tw-px-4 md:tw-px-8 tw-py-10"
      style={{
        background: "linear-gradient(180deg, #faf7f3, #f6ede7, #ecc4b1)",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="tw-w-full tw-max-w-6xl tw-relative">
        {/* Soft blobs */}
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw--z-10">
          <div className="tw-absolute tw-top-24 tw-right-[-6rem] tw-w-[22rem] tw-h-[22rem] tw-rounded-full tw-bg-blush-200/30 tw-blur-3xl" />
          <div className="tw-absolute tw-bottom-16 tw-left-[-4rem] tw-w-[18rem] tw-h-[18rem] tw-rounded-full tw-bg-sand-100/40 tw-blur-3xl" />
        </div>

        <div className="tw-space-y-8">
          {/* Header row */}
          <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
            <header className="tw-col-span-1 xl:tw-col-span-2 tw-rounded-[20px] tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#F9E2DA] tw-backdrop-blur-sm tw-shadow-soft tw-p-6 tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center">
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

            {/* Invite code */}
            <section className="tw-rounded-[20px] tw-bg-[#FFF4E7] tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
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
                <button
                  className="tw-bg-clay-400 hover:tw-bg-clay-600 tw-text-white tw-px-3 tw-py-2 tw-rounded-xl tw-shadow"
                  onClick={handleRegenerate}
                  disabled={!clinicianId}
                >
                  Regenerate
                </button>
              </div>
              {err && (
                <p className="tw-text-xs tw-text-red-600 tw-mt-2">{err}</p>
              )}
            </section>
          </div>

          {/* Content grid */}
          <section className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
            {/* Inbox — Pending goals + announcements */}
            <div className="tw-rounded-[20px] tw-bg-[#FFF4E7] tw-shadow-soft tw-p-6 tw-col-span-1">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                Inbox
              </h3>

              {loading ? (
                <p className="tw-text-sm">Loading…</p>
              ) : !hasInboxItems ? (
                <p className="tw-text-sm tw-text-cocoa-700">
                  No items waiting.
                </p>
              ) : (
                <ul className="tw-space-y-2">
                  {/* Pending goals */}
                  {approvals.map((a) => (
                    <li
                      key={`approval-${a.id}`}
                      className="tw-rounded-xl tw-bg-white/70 tw-border tw-border-white/60 tw-p-3 tw-flex tw-items-center tw-justify-between"
                    >
                      <div>
                        <div className="tw-text-[11px] tw-uppercase tw-font-semibold tw-text-amber-800 tw-mb-0.5">
                          Pending goal
                        </div>
                        <div className="tw-text-sm tw-font-semibold tw-text-clay-700">
                          {a.title}
                        </div>
                        <div className="tw-text-sm">{a.description}</div>
                        <div className="tw-text-xs tw-text-cocoa-600">
                          {a.patient} •{" "}
                          {a.submitted
                            ? new Date(a.submitted).toLocaleString()
                            : ""}
                        </div>
                        <span className="tw-inline-block tw-mt-1 tw-text-[11px] tw-bg-amber-100 tw-text-amber-800 tw-px-2 tw-py-0.5 tw-rounded-full">
                          pending
                        </span>
                      </div>
                      <div className="tw-flex tw-gap-2">
                        <button
                          className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-400 tw-text-white hover:tw-bg-clay-700"
                          onClick={async () => {
                            try {
                              const r = await fetch(
                                `${base_URL}/patients/goals/${a.id}`,
                                {
                                  method: "PATCH",
                                  credentials: "include",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ status: "active" }),
                                }
                              );
                              if (!r.ok) throw new Error(`HTTP ${r.status}`);
                              setApprovals((cur) =>
                                cur.filter((g) => g.id !== a.id)
                              );
                            } catch (e) {
                              setErr(String(e));
                            }
                          }}
                        >
                          Approve
                        </button>
                        <button
                          className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-rose-500 tw-text-white hover:tw-bg-rose-600"
                          onClick={async () => {
                            try {
                              const r = await fetch(
                                `${base_URL}/patients/goals/${a.id}`,
                                {
                                  method: "PATCH",
                                  credentials: "include",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ status: "rejected" }),
                                }
                              );
                              if (!r.ok) throw new Error(`HTTP ${r.status}`);
                              setApprovals((cur) =>
                                cur.filter((g) => g.id !== a.id)
                              );
                            } catch (e) {
                              setErr(String(e));
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}

                  {/* Announcements */}
                  {alerts.map((a) => (
                    <li
                      key={`announcement-${a.notificationId}-${a.ts}`}
                      className="tw-rounded-xl tw-bg-blush-100 tw-text-clay-700 tw-p-3 tw-flex tw-items-center tw-justify-between"
                    >
                      <div className="tw-flex-1 tw-pr-2">
                        <div className="tw-text-[11px] tw-uppercase tw-font-semibold tw-text-clay-700 tw-mb-0.5">
                          Announcement
                        </div>
                        <div className="tw-text-sm tw-font-semibold">
                          {a.title}
                        </div>
                        {a.message && (
                          <div className="tw-text-sm tw-mt-0.5">
                            {a.message}
                          </div>
                        )}
                        <div className="tw-text-xs tw-text-cocoa-600 tw-mt-1">
                          {a.created_at
                            ? new Date(a.created_at).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <Link
                        to="/dashboard/clinician/inbox"
                        className="tw-text-xs tw-underline"
                        onClick={() => ackNotification(a.notificationId)}
                      >
                        Open
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Patients list */}
            <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-amber-100 tw-via-amber-50 tw-to-emerald-100 tw-shadow-soft tw-p-6 tw-col-span-1 xl:tw-col-span-2">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-3">
                Your Patients
              </h3>
              {loading ? (
                <p className="tw-text-sm">Loading…</p>
              ) : patients.length ? (
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
                              {
                                name: "Completed",
                                value: p.goals_completed_pct || 0,
                              },
                              {
                                name: "Remaining",
                                value: 100 - (p.goals_completed_pct || 0),
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
                            {p.goals_completed_pct || 0}%
                          </div>
                          <div className="tw-text-xs tw-text-cocoa-700">
                            Goals completed
                          </div>
                        </div>
                      </div>

                      <div className="tw-flex tw-gap-2 tw-mt-2">
                        <Link
                          to={`/dashboard/clinician/patients/${p.id}`}
                          className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-400 tw-text-white hover:tw-bg-clay-700"
                        >
                          View Profile
                        </Link>
                        <button
                          className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-white/80 hover:tw-bg-white"
                          onClick={() => {
                            setPrefillPatientId(String(p.id));
                            setShowUpload(true);
                          }}
                        >
                          Upload Lab
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="tw-text-sm tw-text-cocoa-700">No patients yet.</p>
              )}
            </div>

            {/* Medications */}
            <div className="tw-rounded-[20px] tw-bg-[#D4E8C7] tw-from-blush-100 tw-via-sand-100 tw-to-blush-200 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
              <div className="tw-flex tw-items-start tw-justify-between tw-w-full">
                <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                  Medications
                </h3>
                <span className="tw-text-xs tw-bg-white/70 tw-backdrop-blur tw-text-clay-700 tw-px-2.5 tw-py-1 tw-rounded-full">
                  Next:
                </span>
              </div>
              <p className="tw-mt-2 tw-mb-3">
                Assign medicine to your patients.
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-3 tw-mt-1">
                <button
                  className="tw-bg-clay-400 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
                  onClick={() => navigate("/dashboard/clinician/medications")}
                >
                  Assign Medicine
                </button>
                <button
                  className="tw-bg-white/80 hover:tw-bg-white tw-text-clay-700 tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
                  onClick={() =>
                    navigate("/dashboard/clinician/medications-review")
                  }
                >
                  Review Medicine
                </button>
              </div>
            </div>

            {/* Lab Results CTA */}
            <div className="tw-rounded-[20px] tw-bg-[#D4E8C7] tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                Lab Results
              </h3>
              <p className="tw-mb-3">Upload or review recent labs.</p>
              <div className="tw-flex tw-gap-2">
                <button
                  className="tw-bg-clay-400 hover:tw-bg-clay-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
                  onClick={() => {
                    setPrefillPatientId("");
                    setShowUpload(true);
                  }}
                >
                  Upload Lab
                </button>
                <button className="tw-bg-white/80 hover:tw-bg-white tw-px-4 tw-py-2 tw-rounded-xl">
                  Review
                </button>
              </div>
            </div>

            {/* Account & session controls */}
            <div className="tw-rounded-[20px] tw-bg-white/80 tw-shadow-soft tw-p-6 tw-flex tw-flex-col tw-justify-center">
              <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-2">
                Account & Session
              </h3>
              <p className="tw-text-sm tw-text-cocoa-700 tw-mb-3">
                Manage your account settings or end your current session.
              </p>
              <div className="tw-flex tw-flex-wrap tw-gap-3">
                <button
                  className="tw-flex tw-items-center tw-gap-2 tw-bg-clay-400 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl tw-shadow"
                  onClick={() => navigate("/account-settings")}
                >
                  {Icons.settings("tw-w-4 tw-h-4")}
                  <span>Account Settings</span>
                </button>
                <button
                  className="tw-flex tw-items-center tw-gap-2 tw-bg-white hover:tw-bg-blush-100 tw-text-clay-700 tw-px-4 tw-py-2 tw-rounded-xl tw-border tw-border-clay-200"
                  onClick={handleLogout}
                >
                  {Icons.logout("tw-w-4 tw-h-4")}
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {showUpload && (
          <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center">
            <button
              className="tw-absolute tw-inset-0 tw-bg-black/30"
              aria-label="Close"
              onClick={() => setShowUpload(false)}
            />
            <div className="tw-relative tw-z-10 tw-w-full md:tw-w-[560px]">
              <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-4">
                <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700">
                    Upload Lab Result
                  </h3>
                  <button
                    className="tw-text-cocoa-700 tw-rounded-lg tw-p-2 hover:tw-bg-blush-100"
                    onClick={() => setShowUpload(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
                <ClinicianLabUploadWrapper
                  prefillPatientId={prefillPatientId}
                  onSubmitted={() => setShowUpload(false)}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ClinicianLabUploadWrapper({ prefillPatientId, onSubmitted }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    setKey((k) => k + 1);
  }, [prefillPatientId]);
  return (
    <ClinicianLabUpload
      key={key}
      prefillPatientId={prefillPatientId}
      onSubmitted={onSubmitted}
    />
  );
}
