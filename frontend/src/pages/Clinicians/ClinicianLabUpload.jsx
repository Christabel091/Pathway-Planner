import React, { useState, useEffect } from "react";

export default function ClinicianLabUpload({
  prefillPatientId = "",
  onSubmitted,
}) {
  const base_URL = import.meta.env.VITE_BACKEND_URL;

  const [form, setForm] = useState({
    patientId: prefillPatientId || "",
    lab_type: "",
    lab_value: "",
    unit: "",
    source: "",
    file_url: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }
  useEffect(() => {
    setForm((f) => ({ ...f, patientId: prefillPatientId || "" }));
  }, [prefillPatientId]);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");
    if (!form.patientId || !form.lab_type) {
      setMessage("patientId and lab_type are required.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`${base_URL}/labs`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: Number(form.patientId),
          lab_type: form.lab_type,
          lab_value: form.lab_value !== "" ? Number(form.lab_value) : undefined,
          unit: form.unit || undefined,
          source: form.source || undefined,
          file_url: form.file_url || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`Error: ${data?.error || res.status}`);
      } else {
        if (onSubmitted) onSubmit;
        setMessage(
          `Lab created with id ${data.labId}. has been sent to patient successfully .`
        );
        // optional: clear fields
        setForm({
          patientId: "",
          lab_type: "",
          lab_value: "",
          unit: "",
          source: "",
          file_url: "",
        });
      }
    } catch (err) {
      setMessage(`Error: ${String(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tw-max-w-xl tw-mx-auto tw-bg-white tw-shadow-soft tw-rounded-2xl tw-p-6">
      <h2 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-4">
        Upload Lab Result
      </h2>
      <form onSubmit={onSubmit} className="tw-space-y-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium">
            Patient ID
          </label>
          <input
            name="patientId"
            value={form.patientId}
            onChange={onChange}
            className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2"
            placeholder="e.g., 12"
            required
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium">
            Test Type
          </label>
          <input
            name="lab_type"
            value={form.lab_type}
            onChange={onChange}
            className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2"
            placeholder="CBC, A1C, Lipid Panel…"
            required
          />
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium">Value</label>
            <input
              name="lab_value"
              value={form.lab_value}
              onChange={onChange}
              className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2"
              placeholder="e.g., 12.4"
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium">Unit</label>
            <input
              name="unit"
              value={form.unit}
              onChange={onChange}
              className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2"
              placeholder="g/dL, mmol/L…"
            />
          </div>
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium">Source</label>
          <input
            name="source"
            value={form.source}
            onChange={onChange}
            className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2"
            placeholder="Quest, LabCorp…"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium">File URL</label>
          <input
            name="file_url"
            value={form.file_url}
            onChange={onChange}
            className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2"
            placeholder="https://…/result.pdf"
          />
          <p className="tw-text-xs tw-text-cocoa-600 tw-mt-1">
            Later this wil be replace with secure upload and presigned URLs.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl"
        >
          {submitting ? "Submitting…" : "Send to Patient"}
        </button>

        {message && <p className="tw-mt-2 tw-text-sm">{message}</p>}
      </form>
    </div>
  );
}
