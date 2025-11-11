/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthContext";

const typeMeta = {
  LAB_NEW: {
    label: "Lab result",
    bg: "tw-bg-[#fff3e6] tw-border-[#f6debf] tw-text-[#7a4a1f]",
    to: (n) =>
      `/dashboard/lab-results?open=${n?.payload?.labId ?? n.entity_id}`,
  },
  GOAL_APPROVED: {
    label: "Goal approved",
    bg: "tw-bg-[#e8f7ef] tw-border-[#c7ebd8] tw-text-[#1f7a4a]",
    to: (n) => `/dashboard/goals?focus=${n?.payload?.goalId ?? n.entity_id}`,
  },
  MESSAGE: {
    label: "Message",
    bg: "tw-bg-[#eef3ff] tw-border-[#d3ddff] tw-text-[#1f3f7a]",
    to: () => `/dashboard/inbox`,
  },
};

function fmtWhen(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = Date.now();
  const diff = Math.max(0, (now - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleString();
}

export default function InboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function fetchNotifications() {
    try {
      setLoading(true);
      setErr("");
      const res = await fetch(`${base_URL}/notifications/${user?.id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.notifications || []);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await fetch(`${base_URL}/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      setItems((xs) =>
        xs.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
    } catch (_) {
      //ignore any error
    }
  }

  useEffect(() => {
    if (!user?.id || !base_URL) return;
    fetchNotifications();
    const onFocus = () => fetchNotifications();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, base_URL]);

  return (
    <div className="tw-max-w-3xl tw-mx-auto tw-px-4 tw-py-6">
      <header className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700 tw-mb-3">
          Inbox
        </h1>
        <Link to="/dashboard/patient" className="tw-text-sm tw-underline">
          Back to Dashboard
        </Link>
      </header>
      <p className="tw-text-sm tw-text-cocoa-700 tw-mb-4">
        All notifications from your clinician and system.
      </p>

      {loading && <div className="tw-text-sm">Loading…</div>}
      {err && <div className="tw-text-sm tw-text-red-600">Error: {err}</div>}

      {!loading && items.length === 0 && (
        <div className="tw-text-sm tw-text-cocoa-700">
          No notifications yet.
        </div>
      )}

      <ul className="tw-space-y-2">
        {items.map((n) => {
          const meta = typeMeta[n.type] || typeMeta.MESSAGE;
          const link = meta.to(n);
          const unread = !n.read_at;
          return (
            <li
              key={n.id}
              className={[
                "tw-flex tw-items-start tw-justify-between tw-rounded-xl tw-border tw-p-3 tw-gap-3",
                meta.bg,
                unread ? "tw-ring-2 tw-ring-offset-0 tw-ring-black/5" : "",
              ].join(" ")}
            >
              <div className="tw-flex-1">
                <div className="tw-text-[12px] tw-font-semibold tw-uppercase tw-tracking-wide">
                  {meta.label}
                </div>
                <div className="tw-text-sm tw-mt-0.5 tw-break-words">
                  {n.payload?.title || n.payload?.message || n.entity || n.type}
                </div>
                <div className="tw-text-[11px] tw-mt-1 tw-opacity-80">
                  {fmtWhen(n.created_at)}
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-gap-2">
                <Link
                  to={link}
                  className="tw-text-xs tw-underline"
                  onClick={() => unread && markRead(n.id)}
                >
                  Open
                </Link>
                {unread && (
                  <button
                    className="tw-text-xs tw-rounded-full tw-px-2 tw-py-1 tw-bg-white/80 hover:tw-bg-white"
                    onClick={() => markRead(n.id)}
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="tw-mt-4 tw-flex tw-justify-end">
        <button
          className="tw-text-sm tw-rounded-xl tw-bg-white tw-border tw-px-3 tw-py-1 hover:tw-bg-white/80"
          onClick={fetchNotifications}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
