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
You are helping a chronic-care patient get a well structured and thought out goal or a plan to achieve their goal.

Patient chronic conditions: ${patient.chronic_conditions || "Not recorded"}.

Current active goals:
${goalLines}

Based on these goals, give 3–5 short, concrete, motivational suggestions
the patient can work by the given deadline they have mentioned. Use bullet points.
`.trim();

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = response.output[0].content[0].text;
  return text;
}