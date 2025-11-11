import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { useLocation, Link } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function LabsPage() {
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const q = useQuery();
  const openId = q.get("open");

  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!user?.id || !base_URL) return;
    let abort = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${base_URL}/patients/${user.id}/labs`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        if (!abort) setLabs(data.labs || []);
      } catch (e) {
        if (!abort) setErr(String(e.message || e));
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [user?.id, base_URL]);

  useEffect(() => {
    if (!openId) return;
    const el = document.getElementById(`lab-${openId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (window.socketInstance?.readyState === WebSocket.OPEN && openId) {
      window.socketInstance.send(
        JSON.stringify({ type: "lab:read", labId: Number(openId) })
      );
    }
  }, [openId, labs]);

  return (
    <div className="tw-min-h-screen tw-px-5 md:tw-px-8 tw-py-6 tw-bg-[#faf7f3]">
      <div className="tw-max-w-4xl tw-mx-auto">
        <header className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
            Lab Results
          </h1>
          <Link to="/dashboard/patient" className="tw-text-sm tw-underline">
            Back to Dashboard
          </Link>
        </header>

        {loading && <p>Loading…</p>}
        {err && <p className="tw-text-rose-600">Error: {err}</p>}

        {!loading &&
          !err &&
          (labs.length === 0 ? (
            <p>No lab results yet.</p>
          ) : (
            <ul className="tw-space-y-3">
              {labs.map((lab) => (
                <li
                  key={lab.id}
                  id={`lab-${lab.id}`}
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
                        {new Date(lab.created_at).toLocaleString()}
                        {lab.read_at ? " • viewed" : ""}
                      </div>
                    </div>
                    {lab.file_url ? (
                      <a
                        href={lab.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="tw-text-sm tw-rounded-full tw-px-3 tw-py-1 tw-bg-clay-600 tw-text-white hover:tw-bg-clay-700"
                      >
                        Open File
                      </a>
                    ) : null}
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
          ))}
      </div>
    </div>
  );
}
