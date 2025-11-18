/** @format */
/* eslint-disable no-unused-vars */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell } from "recharts";
import Modal from "../../components/Modal.jsx";

const PIE_COLORS = {
  completedGradientStart: "#76B28C", // soft emerald
  completedGradientEnd: "#A1D5BA", // mint highlight
  remaining: "#F7E8CF", // soft cream/peach
};

/* Small helpers */
const statusBadge = (status) => {
  const map = {
    pending_approval:
      "tw-bg-[#fff3e6] tw-text-[#7a4a1f] tw-border tw-border-[#f6debf]",
    active: "tw-bg-[#eef7ff] tw-text-[#1b4a7a] tw-border tw-border-[#cfe6ff]",
    completed:
      "tw-bg-[#ecf8f1] tw-text-[#1f6b4a] tw-border tw-border-[#cdecdc]",
    paused: "tw-bg-[#f6f6f6] tw-text-[#666] tw-border tw-border-[#e9e9e9]",
  };
  return map[status] || "tw-bg-white tw-text-cocoa-700 tw-border";
};

function CreateGoalModal({
  onClose,
  onCreated,
  patientInfo,
  setMessage,
  setMessageType,
}) {
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const [form, setForm] = useState({
    title: "",
    description: "",
    due_date: "",
    needsApproval: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!patientInfo?.id) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        `${base_URL}/patients/goals/${patientInfo.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            due_date: form.due_date || null,
            status: form.needsApproval ? "pending_approval" : "active",
          }),
        }
      );
      if (!response.ok) {
        setMessageType("error");
        setMessage("Could not create goal.");
        return;
      }
      const goal = await response.json();
      onCreated(goal);
      onClose();
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Could not create goal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center tw-px-4">
      <button
        className="tw-absolute tw-inset-0 tw-bg-black/30"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="tw-relative tw-z-10 tw-w-full tw-max-w-2xl tw-rounded-2xl tw-overflow-hidden tw-border tw-border-white/60 tw-shadow-2xl"
        style={{
          background: "linear-gradient(180deg, #f9f6f1, #f6ede7, #ecc4b1)",
        }}
      >
        <div className="tw-bg-white/60 tw-backdrop-blur-sm tw-px-6 tw-py-4 tw-flex tw-items-center tw-justify-between">
          <h3 className="tw-text-lg tw-font-semibold tw-text-clay-700">
            Create a Goal
          </h3>
          <button
            onClick={onClose}
            className="tw-rounded-lg tw-p-2 tw-text-clay-700 hover:tw-bg-blush-100"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={submit}
          className="tw-bg-white/60 tw-backdrop-blur tw-px-6 tw-py-5 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4"
        >
          <label className="tw-text-sm tw-text-cocoa-700">
            Title
            <input
              name="title"
              required
              value={form.title}
              onChange={onChange}
              className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-blush-200 tw-bg-white/80 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-clay-600"
              placeholder="e.g., 10-minute evening breathing"
            />
          </label>

          <label className="tw-text-sm tw-text-cocoa-700 md:tw-col-span-2">
            Description
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={onChange}
              className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-blush-200 tw-bg-white/80 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-clay-600"
              placeholder="Why this matters, supports needed, when you’ll do it…"
            />
          </label>

          <label className="tw-text-sm tw-text-cocoa-700">
            Due date (optional)
            <input
              type="date"
              name="due_date"
              value={form.due_date}
              onChange={onChange}
              className="tw-mt-1 tw-w-full tw-rounded-xl tw-border tw-border-blush-200 tw-bg-white/80 tw-px-3 tw-py-2 focus:tw-ring-2 focus:tw-ring-clay-600"
            />
          </label>

          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-cocoa-700 md:tw-col-span-2">
            <input
              type="checkbox"
              name="needsApproval"
              checked={form.needsApproval}
              onChange={onChange}
            />
            Requires clinician approval
          </label>

          <div className="md:tw-col-span-2 tw-flex tw-justify-end tw-gap-3 tw-pt-2">
            <button
              type="button"
              className="tw-rounded-xl tw-px-4 tw-py-2 hover:tw-bg-white/70"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="tw-bg-clay-600 hover:tw-bg-clay-700 tw-text-white tw-rounded-xl tw-px-4 tw-py-2 tw-shadow disabled:tw-opacity-60"
            >
              {submitting ? "Creating…" : "Create Goal"}
            </button>
          </div>
        </form>

        <div className="tw-px-6 tw-py-4 tw-bg-white/50 tw-text-xs tw-text-cocoa-700">
          Tip: For comfort-first goals, start tiny (5-minute breathing, gentle
          stretches with caregiver support).
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onToggleComplete, onDelete }) {
  const isDone = goal?.completed === true || goal?.status === "completed";
  return (
    <div className="tw-rounded-2xl tw-border tw-border-white/60 tw-bg-white/70 tw-backdrop-blur tw-shadow-soft tw-p-4 tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
        <div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <h4 className="tw-font-semibold tw-text-clay-700">{goal.title}</h4>
            <span
              className={`tw-text-[11px] tw-px-2 tw-py-0.5 tw-rounded-full ${statusBadge(
                goal.status
              )}`}
            >
              {goal.status || (isDone ? "completed" : "active")}
            </span>
          </div>
        </div>
        <div className="tw-flex tw-gap-2">
          <button
            onClick={() => onToggleComplete(goal)}
            className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-emerald-600 tw-text-white hover:tw-bg-emerald-700"
          >
            {isDone ? "Mark Active" : "Complete"}
          </button>
          <button
            onClick={() => onDelete(goal)}
            className="tw-text-xs tw-rounded-full tw-px-3 tw-py-1 tw-bg-rose-500 tw-text-white hover:tw-bg-rose-600"
          >
            Delete
          </button>
        </div>
      </div>

      {goal.description && (
        <p className="tw-text-sm tw-text-cocoa-700">{goal.description}</p>
      )}
      {goal.due_date && (
        <div className="tw-text-xs tw-text-cocoa-600">
          Due: {new Date(goal.due_date).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

const GoalsPage = ({ patientInfo, setPatientInfo }) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const base_URL = import.meta.env.VITE_BACKEND_URL;
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all"); // all | active | completed | pending
  const [resolvedPatientId, setResolvedPatientId] = useState(null);

  useEffect(() => {
    if (patientInfo?.id) {
      const id = Number(patientInfo.id);
      setResolvedPatientId(id);
      try {
        window.localStorage.setItem("pp_patient_id", String(id));
      } catch {
        // ignore storage errors
      }
    } else {
      // fallback on refresh
      try {
        const stored = window.localStorage.getItem("pp_patient_id");
        if (stored) {
          setResolvedPatientId(Number(stored));
        }
      } catch {
        // ignore storage errors
      }
    }
  }, [patientInfo?.id]);

  useEffect(() => {
    if (patientInfo?.aiSuggestions) {
      setAiSuggestions(patientInfo.aiSuggestions);
    }
  }, [patientInfo]);

  /* Helper: notify clinician in real-time about a new pending goal */
  const notifyClinicianPendingGoal = async (goal) => {
    if (!goal?.id) return;
    try {
      await fetch(`${base_URL}/realtime/pending-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id }),
      });
    } catch (e) {
      console.error("Failed to notify clinician about pending goal:", e);
    }
  };

  /* Fetch goals for this patient, using resolvedPatientId */
  useEffect(() => {
    if (!resolvedPatientId) return;
    const fetchGoals = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${base_URL}/patients/goals/${resolvedPatientId}`
        );
        if (!response.ok) {
          setMessageType("error");
          setMessage("Could not load goals.");
          return;
        }
        const data = await response.json();
        setGoals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setMessageType("error");
        setMessage("Could not load goals.");
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, [resolvedPatientId, base_URL]);

  const filteredGoals = useMemo(() => {
    if (!goals?.length) return [];
    if (filter === "active") {
      return goals.filter(
        (g) =>
          g?.completed !== true &&
          g?.status !== "completed" &&
          g?.status !== "pending_approval"
      );
    }
    if (filter === "completed") {
      return goals.filter(
        (g) => g?.completed === true || g?.status === "completed"
      );
    }
    if (filter === "pending") {
      return goals.filter((g) => g?.status === "pending_approval");
    }
    return goals;
  }, [goals, filter]);

  const { totalGoals, completedGoals, percentComplete } = useMemo(() => {
    const total = goals.length;
    const done = goals.filter(
      (g) => g?.completed === true || g?.status === "completed"
    ).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { totalGoals: total, completedGoals: done, percentComplete: pct };
  }, [goals]);

  const onCreated = (goal) => {
    setGoals((gs) => [goal, ...gs]);
    if (goal?.status === "pending_approval") {
      notifyClinicianPendingGoal(goal);
    }
  };

  const onToggleComplete = async (goal) => {
    try {
      const response = await fetch(`${base_URL}/patients/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed: !(
            goal?.completed === true || goal?.status === "completed"
          ),
          status:
            goal?.completed === true || goal?.status === "completed"
              ? "active"
              : "completed",
        }),
      });
      if (!response.ok) {
        setMessageType("error");
        setMessage("Could not update goal.");
        return;
      }
      setGoals((gs) =>
        gs.map((g) =>
          g.id === goal.id
            ? {
                ...g,
                completed: !(
                  goal?.completed === true || goal?.status === "completed"
                ),
                status:
                  goal?.completed === true || goal?.status === "completed"
                    ? "active"
                    : "completed",
              }
            : g
        )
      );
    } catch (e) {
      setMessageType("error");
      setMessage("Could not update goal.");
    }
  };

  const onDelete = async (goal) => {
    try {
      const response = await fetch(`${base_URL}/patients/goals/${goal.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setMessageType("error");
        setMessage("Could not delete goal.");
        return;
      }
      setGoals((gs) => gs.filter((g) => g.id !== goal.id));
    } catch (e) {
      setMessageType("error");
      setMessage("Could not delete goal.");
    }
  };

  const addSuggestionAsDraft = async (s) => {
    if (!resolvedPatientId) return;

    const [rawTitle, rawDescription] = s.suggestion_text.split(/\r?\n/, 2);

    const title = rawTitle?.trim() || "AI Goal";
    const description = `AI-suggested goal: ${
      rawDescription?.trim() || ""
    }`.trim();

    try {
      const response = await fetch(
        `${base_URL}/patients/goals/${resolvedPatientId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            status: "pending_approval",
            aiSuggestionId: s.id,
          }),
        }
      );

      if (!response.ok) {
        setMessageType("error");
        setMessage("Could not add suggested goal.");
        return;
      }

      const draft = await response.json();
      setGoals((gs) => [draft, ...gs]);

      if (draft?.status === "pending_approval") {
        notifyClinicianPendingGoal(draft);
      }
    } catch (e) {
      setMessageType("error");
      setMessage("Could not add suggested goal.");
    }
  };

  return (
    <div
      className="tw-min-h-screen tw-px-5 md:tw-px-8 tw-pb-10 tw-pt-6"
      style={{
        background: "linear-gradient(180deg, #faf7f3, #f6ede7, #ecc4b1)",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Top bar: Back to Dashboard */}
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <button
          onClick={() => navigate("/dashboard/patient")}
          className="tw-flex tw-items-center tw-gap-2 tw-text-clay-700 tw-rounded-xl tw-px-3 tw-py-1.5 hover:tw-bg-white/70"
          aria-label="Back to dashboard"
          title="Back to dashboard"
        >
          <svg
            className="tw-w-5 tw-h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path strokeWidth="2" strokeLinecap="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="tw-text-sm tw-font-medium">Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="tw-mb-6 tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between">
        <div>
          <h1 className="tw-text-2xl tw-font-semibold tw-text-emerald-700">
            Your Goals
          </h1>
          <p className="tw-text-cocoa-700 tw-text-sm tw-mt-1">
            Healing in your own rhythm. Gentle goals, lasting care.
          </p>
        </div>
        <div className="tw-mt-3 sm:tw-mt-0 tw-flex tw-gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="tw-bg-clay-400 hover:tw-bg-clay-600 tw-text-white tw-rounded-xl tw-px-4 tw-py-2 tw-shadow"
            disabled={!resolvedPatientId}
            title={!resolvedPatientId ? "Patient not loaded yet" : ""}
          >
            + Create Goal
          </button>
        </div>
      </div>

      {/* Summary ring + filters */}
      <div className="tw-rounded-[24px] tw-bg-white/60 tw-backdrop-blur-md tw-border tw-border-white/60 tw-shadow-soft tw-p-5 tw-flex tw-items-center tw-gap-6 tw-flex-wrap tw-mb-6">
        <PieChart width={140} height={140}>
          <defs>
            <linearGradient id="gpGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={PIE_COLORS.completedGradientStart} />
              <stop offset="100%" stopColor={PIE_COLORS.completedGradientEnd} />
            </linearGradient>
          </defs>
          <Pie
            data={[
              { name: "Completed", value: percentComplete },
              { name: "Remaining", value: 100 - percentComplete },
            ]}
            cx="50%"
            cy="50%"
            innerRadius={42}
            outerRadius={60}
            startAngle={90}
            endAngle={450}
            dataKey="value"
            stroke="none"
          >
            <Cell fill="url(#gpGradient)" />
            <Cell fill={PIE_COLORS.remaining} />
          </Pie>
        </PieChart>

        <div>
          <div className="tw-text-3xl tw-font-bold tw-text-clay-700">
            {percentComplete}%{" "}
            <span className="tw-text-base tw-font-medium tw-text-cocoa-700">
              completed
            </span>
          </div>
          <div className="tw-text-sm tw-text-cocoa-700 tw-mt-1">
            {completedGoals}/{totalGoals} goals
          </div>
          <div className="tw-text-xs tw-text-cocoa-600 tw-mt-1">
            Pace yourself—adjust to pain/energy; celebrate micro-steps.
          </div>
        </div>

        <div className="tw-ml-auto tw-flex tw-gap-2 tw-flex-wrap">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "pending", label: "Waiting Approval" },
            { key: "completed", label: "Completed" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={[
                "tw-text-xs tw-rounded-full tw-px-3 tw-py-1",
                filter === f.key
                  ? "tw-bg-clay-400 tw-text-white"
                  : "tw-bg-white/80 tw-text-clay-700 hover:tw-bg-white",
              ].join(" ")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Waiting for clinician approval */}
      <section className="tw-mb-6">
        <h2 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-3">
          Waiting for Clinician Approval
        </h2>
        {goals.filter((g) => g?.status === "pending_approval").length ? (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            {goals
              .filter((g) => g?.status === "pending_approval")
              .map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                />
              ))}
          </div>
        ) : (
          <p className="tw-text-cocoa-700 tw-text-sm">
            No goals awaiting approval.
          </p>
        )}
      </section>

      {/* Filtered goals list */}
      <section className="tw-mb-8">
        <h2 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-3">
          {filter === "all"
            ? "All Goals"
            : filter === "active"
            ? "Active Goals"
            : filter === "completed"
            ? "Completed Goals"
            : "Goals"}
        </h2>

        {loading ? (
          <p className="tw-text-sm tw-text-cocoa-700">Loading goals…</p>
        ) : filteredGoals.length ? (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
            {filteredGoals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <p className="tw-text-cocoa-700 tw-text-sm">No goals in this view.</p>
        )}
      </section>

      {/* AI Suggested Goals */}
      <section className="tw-mb-8">
        <h2 className="tw-text-lg tw-font-semibold tw-text-clay-700 tw-mb-3">
          AI-Suggested Goals
        </h2>

        {aiSuggestions?.length ? (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            {aiSuggestions.map((s) => (
              <div
                key={s.id ?? s.text}
                className="
                  tw-flex tw-flex-col tw-gap-2
                  tw-rounded-[20px]
                  tw-bg-gradient-to-br tw-from-amber-100 tw-via-amber-50 tw-to-emerald-100
                  tw-backdrop-blur-md
                  tw-border tw-border-white/60
                  tw-shadow-soft
                  tw-p-4
                "
              >
                {(() => {
                  const [title, description] = s.suggestion_text.split(
                    /\r?\n/,
                    2
                  );

                  return (
                    <div>
                      <div className="tw-font-semibold tw-text-sm tw-text-clay-700">
                        {title}
                      </div>
                      <div className="tw-text-xs tw-text-cocoa-700 tw-mt-1">
                        {description}
                      </div>
                    </div>
                  );
                })()}

                {s.trigger_reason && (
                  <div className="tw-text-xs tw-text-clay-600 tw-mt-1 tw-italic">
                    Why you’re seeing this:{" "}
                    <span className="tw-font-medium">
                      {s.trigger_reason.replace(/_/g, " ")}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => addSuggestionAsDraft(s)}
                  className="
                    tw-text-xs tw-rounded-full tw-px-3 tw-py-1
                    tw-bg-clay-600 tw-text-white
                    hover:tw-bg-clay-700
                    tw-self-start tw-mt-2
                  "
                  disabled={!resolvedPatientId}
                >
                  Add as draft
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="tw-text-cocoa-700 tw-text-sm">No suggestions yet.</p>
        )}
      </section>

      <div className="tw-mt-4 tw-text-xs tw-text-cocoa-700 tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-4">
        For long-term or terminal illness, prioritize comfort, safety,
        hydration, rest, and connection. Let goals flex with how you feel
        day-to-day. Invite your relative and clinician to adjust together.
      </div>

      {showCreate && resolvedPatientId && (
        <CreateGoalModal
          onClose={() => setShowCreate(false)}
          onCreated={onCreated}
          patientInfo={{ ...patientInfo, id: resolvedPatientId }}
          setPatientInfo={setPatientInfo}
          setMessage={setMessage}
          setMessageType={setMessageType}
        />
      )}

      {message && (
        <Modal
          message={message}
          type={messageType}
          duration={messageType === "success" ? 4000 : 7000}
          onClose={() => setMessage("")}
        />
      )}
    </div>
  );
};

export default GoalsPage;
