import Anthropic from "@anthropic-ai/sdk";
import { DayTotals, Profile } from "@/types";

const client = new Anthropic();

export async function getDailyAdvice(
  profile: Profile,
  todayTotals: DayTotals,
  currentHour: number
): Promise<string> {
  const remaining = {
    calories: profile.target_calories - todayTotals.calories,
    protein: profile.target_protein - todayTotals.protein_g,
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 150,
    system: `Eres un nutricionista personal. Da un consejo breve (máx 2 frases) en español, directo y útil. Sin saludos.`,
    messages: [
      {
        role: "user",
        content: `Usuario: objetivo ${profile.goal}, dieta ${profile.diet_type}.
Hoy lleva: ${todayTotals.calories} kcal / ${profile.target_calories} objetivo.
Proteína restante: ${remaining.protein}g. Hora: ${currentHour}h.
Consejo para ahora:`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export function calculateAdjustedTDEE(
  avgCalories: number,
  weightStart: number,
  weightEnd: number
): number {
  const weightDelta = weightEnd - weightStart;
  const kcalFromWeight = weightDelta * 7700;
  const realTDEE = avgCalories - kcalFromWeight / 7;
  return Math.round(realTDEE);
}
