// backend/src/goalAi.js
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getGoalSuggestionsForPatient(prisma, patientId) {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      goals: {
        where: { status: "active" },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!patient) return null;

  const goalLines =
    patient.goals.length > 0
      ? patient.goals
          .map((g, i) => {
            const due = g.due_date
              ? new Date(g.due_date).toISOString().split("T")[0]
              : "no deadline set";

            return `${i + 1}. ${g.title}${
              g.description ? ` — ${g.description}` : ""
            } (status: ${g.status}, deadline: ${due})`;
          })
          .join("\n")
      : "No active goals.";

  const prompt = `
You are helping a chronic-care patient create structured, meaningful goals.

Patient chronic conditions: ${patient.chronic_conditions || "Not recorded"}.

Current active goals:
${goalLines}

Return 3–5 NEW suggested goals in the following strict format:

• Title of the goal
  Description of the goal in 1–2 sentences

RULES:
- The FIRST line of each suggestion must be the TITLE only.
- The SECOND line must be the DESCRIPTION only.
- Separate title and description with exactly ONE newline.
- No extra newlines between suggestions.
- No lists within descriptions.
- Keep everything concise and actionable.
`.trim();

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = response.output[0].content[0].text;
  return text;
}

export async function generateAndStoreGoalSuggestions(
  prisma,
  patientId,
  goalId,
  triggerReason
) {
  const suggestionText = await getGoalSuggestionsForPatient(prisma, patientId);
  if (!suggestionText) return;
  console.log("creating ai suggestion for patient", patientId);
  await prisma.aiSuggestion.create({
    data: {
      patient_id: patientId,
      goal_id: goalId ?? null,
      suggestion_text: suggestionText,
      requires_approval: true,
      trigger_reason: triggerReason ?? null,
      suggested_delta_pct: null,
      confidence: null,
    },
  });
}
