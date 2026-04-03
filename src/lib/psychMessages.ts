// Mapa de flag_type a mensaje psicológico correspondiente
// Los textos son SAGRADOS — no modificar el copy bajo ninguna circunstancia

import type { FlagType } from '@/types/psych'

export const PSYCH_MESSAGES: Record<FlagType, { messageKey: string; messageContent: string }> = {
  consecutive_low_logging: {
    messageKey: 'low_intake_support',
    messageContent:
      'Hemos notado que algunos días has registrado muy poco. Nuti es una herramienta de apoyo, no de restricción. Recuerda que comer bien es parte del objetivo. 💛',
  },
  consecutive_zero_logging: {
    messageKey: 'missing_logs_checkin',
    messageContent:
      'Llevamos unos días sin saber de ti. No pasa nada — a veces la vida se pone intensa. ¿Cómo estás? 🤍',
  },
  restrictive_language: {
    messageKey: 'restrictive_language_support',
    messageContent:
      'Parece que estás teniendo un momento difícil con la comida. Está bien pedir ayuda. Nuti puede ser más útil si la usas a tu ritmo, sin presión. 💛',
  },
}

export function getMessageKey(flagType: FlagType): string {
  return PSYCH_MESSAGES[flagType].messageKey
}

export function getMessageContent(flagType: FlagType): string {
  return PSYCH_MESSAGES[flagType].messageContent
}
