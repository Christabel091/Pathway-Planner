/** @format */
import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../utility/auth";

const ClinicianAccount = () => {
  const { user } = useAuth();
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    specialty: "",
    license_number: "",
    clinic_name: "",
    contact_email: "",
    contact_phone: "",
    office_address: "",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  // Load clinician account data
  useEffect(() => {
    if (!user?.id || !base_URL) return;
    const token = getToken();
    if (!token) return;

    const ctrl = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch(`${base_URL}/clinicians/account/${user.id}`, {
          method: "GET",
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Clinician record not found for this account.");
          }
          throw new Error(`Unable to load account (HTTP ${res.status})`);
        }

        const data = await res.json();

        setForm({
          full_name: data.full_name || "",
          specialty: data.specialty || "",
          license_number: data.license_number || "",
          clinic_name: data.clinic_name || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          office_address: data.office_address || "",
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(String(err.message || err));
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [user?.id, base_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!base_URL || !user?.id) return;
    const token = getToken();
    if (!token) return;

    setError("");
    setSuccess("");

    try {
      setSaving(true);

      const body = {
        specialty: form.specialty || "",
        clinic_name: form.clinic_name || "",
        contact_email: form.contact_email || "",
        contact_phone: form.contact_phone || "",
        office_address: form.office_address || "",
      };

      const res = await fetch(`${base_URL}/clinicians/account/${user.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || `Unable to save changes (HTTP ${res.status})`
        );
      }

      setSuccess("Your account details have been updated.");
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const displayName = user?.username || "Clinician";
  const displayEmail = user?.email || "";

  return (
    <div className="tw-min-h-screen tw-flex tw-justify-center tw-bg-[linear-gradient(180deg,#faf7f3,#f6ede7,#ecc4b1)] tw-px-4 tw-py-8">
      <div className="tw-w-full tw-max-w-3xl">
        {/* Back header */}
        <button
          onClick={() => navigate("/dashboard/clinician")}
          className="tw-flex tw-items-center tw-gap-2 tw-text-clay-700 tw-text-sm tw-font-medium tw-mb-4 hover:tw-text-clay-900 tw-transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="tw-w-5 tw-h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </button>

        {/* Header card */}
        <div className="tw-rounded-[20px] tw-bg-gradient-to-br tw-from-[#F7D2C9] tw-to-[#F9E2DA] tw-shadow-soft tw-border tw-border-white/70 tw-p-6 tw-mb-6">
          <h1 className="tw-text-2xl tw-font-semibold tw-text-clay-700">
            Account Settings
          </h1>
          <p className="tw-text-xs tw-text-clay-700/80 tw-mt-1">
            Review your profile and update your contact and practice details.
          </p>
          <div className="tw-mt-4 tw-flex tw-flex-col sm:tw-flex-row tw-gap-4 tw-text-sm">
            <div className="tw-flex-1">
              <p className="tw-font-medium tw-text-clay-700">Signed in as</p>
              <p className="tw-text-clay-700/90 tw-text-xs tw-mt-1">
                {displayName}
              </p>
              {displayEmail && (
                <p className="tw-text-clay-700/80 tw-text-xs">{displayEmail}</p>
              )}
            </div>
            {loading && (
              <div className="tw-text-xs tw-text-clay-700 tw-self-end">
                Loading profile…
              </div>
            )}
          </div>
        </div>

        {/* Main form card */}
        <form
          onSubmit={handleSubmit}
          className="tw-rounded-[20px] tw-bg-[#FFF4E7] tw-shadow-soft tw-border tw-border-white/70 tw-p-6 tw-space-y-5"
        >
          <h2 className="tw-text-lg tw-font-semibold tw-text-clay-700">
            Professional Profile
          </h2>

          {/* Mostly static core info */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                disabled
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/60 tw-px-3 tw-py-2 tw-text-sm tw-text-clay-700 tw-opacity-80 tw-cursor-not-allowed"
              />
              <p className="tw-text-[11px] tw-text-clay-700/60 tw-mt-1">
                Contact the system administrator if your name needs to be
                updated.
              </p>
            </div>

            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                License Number
              </label>
              <input
                type="text"
                value={form.license_number}
                disabled
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/60 tw-px-3 tw-py-2 tw-text-sm tw-text-clay-700 tw-opacity-80 tw-cursor-not-allowed"
              />
              <p className="tw-text-[11px] tw-text-clay-700/60 tw-mt-1">
                License details are verified and cannot be edited here.
              </p>
            </div>

            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                Specialty
              </label>
              <input
                type="text"
                value={form.specialty}
                onChange={handleChange("specialty")}
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/90 tw-px-3 tw-py-2 tw-text-sm"
                placeholder="e.g., Endocrinology, Family Medicine"
              />
            </div>
          </div>

          <hr className="tw-border-sand-200/70" />

          {/* Editable practice/contact info */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                Clinic / Practice Name
              </label>
              <input
                type="text"
                value={form.clinic_name}
                onChange={handleChange("clinic_name")}
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/90 tw-px-3 tw-py-2 tw-text-sm"
                placeholder="Clinic name"
              />
            </div>

            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={handleChange("contact_email")}
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/90 tw-px-3 tw-py-2 tw-text-sm"
                placeholder="Clinic contact email"
              />
            </div>

            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={handleChange("contact_phone")}
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/90 tw-px-3 tw-py-2 tw-text-sm"
                placeholder="Clinic phone number"
              />
            </div>

            <div className="tw-col-span-1 md:tw-col-span-2">
              <label className="tw-block tw-text-xs tw-font-medium tw-text-clay-700 tw-mb-1">
                Office Address
              </label>
              <textarea
                value={form.office_address}
                onChange={handleChange("office_address")}
                rows={3}
                className="tw-w-full tw-rounded-xl tw-border tw-border-white/70 tw-bg-white/90 tw-px-3 tw-py-2 tw-text-sm tw-resize-none"
                placeholder="Street, city, state, ZIP"
              />
            </div>
          </div>

          {(error || success) && (
            <div className="tw-mt-2">
              {error && (
                <p className="tw-text-xs tw-text-rose-700 tw-mb-1">{error}</p>
              )}
              {success && (
                <p className="tw-text-xs tw-text-emerald-700 tw-mb-1">
                  {success}
                </p>
              )}
            </div>
          )}

          <div className="tw-flex tw-justify-end tw-pt-2">
            <button
              type="submit"
              disabled={saving}
              className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-xl tw-bg-clay-500 hover:tw-bg-clay-600 tw-text-white tw-text-sm tw-font-medium tw-px-4 tw-py-2 tw-shadow disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClinicianAccount;
