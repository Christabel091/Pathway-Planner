import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { Link } from "react-router-dom";

export default function MedicationsPage() {
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // ---------------------- MAKE loadData GLOBAL ----------------------
  async function loadData() {
    try {
      setLoading(true);

      // 1) Fetch meds
      const r = await fetch(`${base_URL}/patients/${user.id}/medications`, {
        credentials: "include",
      });
      const medsJson = await r.json();
      setMeds(medsJson.meds || []);

      // 2) Fetch notifications
      const nr = await fetch(`${base_URL}/notifications/${user.id}`, {
        credentials: "include",
      });
      const notifJson = await nr.json();
      setNotifications(notifJson || []);

      // 3) Mark med notifications as read
      const unreadMedNotifications = notifJson.filter(
        (n) => n.type === "MEDICATION_ASSIGNED" && !n.read_at
      );

      unreadMedNotifications.forEach(async (n) => {
        await fetch(`${base_URL}/notifications/${n.id}/read`, {
          method: "PATCH",
          credentials: "include",
        });
      });
    } catch (e) {
      console.error("Error fetching meds or notifications:", e);
    } finally {
      setLoading(false);
    }
  }
  // -------------------------------------------------------------------

  // Initial load
  useEffect(() => {
    if (!user?.id) return;
    loadData();
  }, [user?.id, base_URL]);

  // ---------------------- NEW: RELOAD WHEN PAGE IS FOCUSED ----------------------
  useEffect(() => {
    function onFocus() {
      loadData(); // refresh when page becomes active
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);
  // ------------------------------------------------------------------------------

  return (
    <div className=" tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#D4E8C7] tw-min-h-screen tw-px-6 tw-py-6 ">
      <div className="tw-max-w-3xl tw-mx-auto">
        <header className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
            Medications
          </h1>

          {/* Badge if there's a new medication notification */}
          {notifications.some(
            (n) => n.type === "MEDICATION_ASSIGNED" && !n.read_at
          ) && (
            <span className="tw-text-xs tw-bg-rose-200 tw-text-rose-700 tw-px-2 tw-py-1 tw-rounded-xl">
              New medication assigned!
            </span>
          )}

          <Link to="/dashboard/patient" className="tw-text-sm tw-underline">
            Back to Dashboard
          </Link>
        </header>

        {loading ? (
          <p>Loading medications…</p>
        ) : meds.length === 0 ? (
          <p>No medications assigned yet.</p>
        ) : (
          <ul className="tw-space-y-4">
            {meds.map((m) => (
              <li
                key={m.id}
                className="tw-bg-[#FFF4E7] tw-rounded-2xl tw-shadow-soft tw-border tw-border-white/60 tw-p-5"
              >
                <div className="tw-flex tw-items-center tw-justify-between">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700">
                    {m.medicine_name}
                  </h3>

                </div>

                {m.dosage && (
                  <p className="tw-text-sm tw-mt-2">
                    <strong>Dosage:</strong> {m.dosage}
                  </p>
                )}

                {m.frequency && (
                  <p className="tw-text-sm">
                    <strong>Frequency:</strong> {m.frequency}
                  </p>
                )}

                {m.preferred_time && (
                  <p className="tw-text-sm">
                    <strong>Time:</strong> {m.preferred_time}
                  </p>
                )}

                {m.instructions && (
                  <p className="tw-text-sm tw-mt-2 tw-text-cocoa-700">
                    <strong>Instructions:</strong> {m.instructions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
