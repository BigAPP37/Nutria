import Anthropic from "@anthropic-ai/sdk";
import { ParsedMeal } from "@/types";

const client = new Anthropic();

export async function parseMealFromText(
  input: string,
  dietType = "balanceada"
): Promise<ParsedMeal> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `Eres un nutricionista experto con base de datos de alimentos españoles y latinoamericanos.
Analiza el input y devuelve SOLO un objeto JSON válido, sin markdown, sin texto extra.
Usa porciones típicas españolas cuando no se especifique cantidad.
Dieta del usuario: ${dietType}.

Formato exacto de respuesta:
{"name":"string","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number,"confidence":number,"notes":"string o null"}`,
    messages: [{ role: "user", content: input }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("No se pudo analizar la respuesta de IA");
  }
}
