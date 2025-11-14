// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";

export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName = user?.username || "Admin";

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const API_BASE = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError("");
        const res = await fetch(`${API_BASE}/admin/users`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err) {
        console.error(err);
        setUsersError("Could not load users.");
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [API_BASE]);

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      setSendMessage("Title and message are required.");
      return;
    }

    try {
      setIsSending(true);
      setSendMessage("");
      const res = await fetch(`${API_BASE}/admin/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: announcementTitle.trim(),
          message: announcementBody.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to send announcement");
      }
      setSendMessage("Announcement sent to all users.");
      setAnnouncementTitle("");
      setAnnouncementBody("");
    } catch (err) {
      console.error(err);
      setSendMessage("Error sending announcement. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to delete user");
      }
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error(err);
      alert("Could not delete user. Check server logs / constraints.");
    }
  };

  return (
    <div className="tw-min-h-screen tw-bg-gradient-to-b tw-from-rose-50 tw-via-amber-50 tw-to-emerald-50 tw-flex tw-items-start tw-justify-center tw-px-4 tw-py-10">
      <div className="tw-w-full tw-max-w-5xl tw-bg-white tw-rounded-3xl tw-shadow-xl tw-p-8 tw-space-y-8">
        {/* Header */}
        <header className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-gap-3">
          <div>
            <h1 className="tw-text-2xl tw-font-semibold tw-text-emerald-700">
              Admin Dashboard
            </h1>
            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
              Signed in as{" "}
              <span className="tw-font-medium tw-text-emerald-700">
                {displayName}
              </span>
            </p>
          </div>
          <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-emerald-50 tw-text-emerald-700 tw-px-4 tw-py-1 tw-text-xs tw-font-medium">
            Admin Control Panel
          </span>
        </header>

        {/* Content grid: Announcement + Manage Users */}
        <section className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
          {/* Announcement card */}
          <div className="tw-bg-gradient-to-br tw-from-rose-50 tw-via-amber-50 tw-to-rose-100 tw-rounded-2xl tw-shadow-md tw-p-6 tw-flex tw-flex-col tw-gap-4">
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-emerald-800">
                Send Announcement
              </h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Broadcast a message to all users. It will be saved in the
                notifications table and pushed in real time.
              </p>
            </div>

            <form
              className="tw-flex tw-flex-col tw-gap-3"
              onSubmit={handleSendAnnouncement}
            >
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="tw-w-full tw-rounded-xl tw-border tw-border-emerald-100 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
                  placeholder="System update, maintenance, or general notice"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Message
                </label>
                <textarea
                  className="tw-w-full tw-min-h-[120px] tw-rounded-xl tw-border tw-border-emerald-100 tw-bg-white tw-px-3 tw-py-2 tw-text-sm focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-emerald-400"
                  placeholder="Write the announcement you want every user to see..."
                  value={announcementBody}
                  onChange={(e) => setAnnouncementBody(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-xl tw-bg-emerald-600 tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 hover:tw-bg-emerald-700 tw-transition disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
              >
                {isSending ? "Sending..." : "Send Announcement"}
              </button>

              {sendMessage && (
                <p className="tw-text-xs tw-text-gray-600">{sendMessage}</p>
              )}
            </form>
          </div>

          {/* Manage Users card */}
          <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-6 tw-flex tw-flex-col tw-gap-3 tw-border tw-border-emerald-50">
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-emerald-800">
                Manage Users
              </h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                View all registered accounts and remove users if needed.
              </p>
            </div>

            {usersLoading && (
              <p className="tw-text-sm tw-text-gray-500">Loading users...</p>
            )}
            {usersError && (
              <p className="tw-text-sm tw-text-red-500">{usersError}</p>
            )}

            {!usersLoading && !usersError && (
              <div className="tw-max-h-80 tw-overflow-auto tw-mt-1 tw-border tw-border-gray-100 tw-rounded-xl">
                <table className="tw-w-full tw-text-xs tw-text-left">
                  <thead className="tw-bg-emerald-50 tw-text-emerald-800">
                    <tr>
                      <th className="tw-px-3 tw-py-2 tw-font-semibold">ID</th>
                      <th className="tw-px-3 tw-py-2 tw-font-semibold">
                        Email
                      </th>
                      <th className="tw-px-3 tw-py-2 tw-font-semibold">
                        Username
                      </th>
                      <th className="tw-px-3 tw-py-2 tw-font-semibold">Role</th>
                      <th className="tw-px-3 tw-py-2 tw-font-semibold">
                        Created At
                      </th>
                      <th className="tw-px-3 tw-py-2 tw-font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="tw-px-3 tw-py-4 tw-text-center tw-text-gray-400"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="tw-border-t tw-border-gray-100 hover:tw-bg-emerald-50/40"
                      >
                        <td className="tw-px-3 tw-py-2 tw-text-gray-700">
                          {u.id}
                        </td>
                        <td className="tw-px-3 tw-py-2 tw-text-gray-700">
                          {u.email}
                        </td>
                        <td className="tw-px-3 tw-py-2 tw-text-gray-700">
                          {u.UserName || u.username || "-"}
                        </td>
                        <td className="tw-px-3 tw-py-2 tw-text-gray-700">
                          {u.role}
                        </td>
                        <td className="tw-px-3 tw-py-2 tw-text-gray-700">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="tw-px-3 tw-py-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="tw-text-[11px] tw-text-red-600 hover:tw-text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="tw-text-[11px] tw-text-gray-400 tw-mt-1">
              Note: Deleting a user will remove them permanently from your
              database. IT IS IREVERSIBLE
            </p>
          </div>
        </section>

        <footer className="tw-text-[11px] tw-text-gray-400 tw-pt-2 tw-border-t tw-border-gray-100 tw-flex tw-justify-between">
          <span>© 2025 Pathway Planner</span>
          <span>Admin tools · minimal view</span>
        </footer>
      </div>
    </div>
  );
}
