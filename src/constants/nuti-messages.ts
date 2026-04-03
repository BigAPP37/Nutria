// src/constants/nuti-messages.ts
// Todos los mensajes de Nuti en la app
// Regla: nunca mencionar calorías, déficit, TDEE, macros, IMC
// Tono: cercana, de tú, sin juicio, máximo 1 emoji por mensaje

export type NutiPose =
  | 'apple'
  | 'pear'
  | 'spoon'
  | 'broccoli'
  | 'celebration'
  | 'sad'
  | 'fire'
  | 'thinking'
  | 'sleepy'
  | 'wave'
  | 'calculator'
  | 'reading'
  | 'trophy'
  | 'cozy'

export interface NutiMessage {
  text: string
  pose: NutiPose
}

export const nutiMessages = {
  // ── Onboarding ───────────────────────────────────────────
  onboarding: {
    welcome: [
      { text: 'Hola, soy Nuti 🦦 Voy a ayudarte a comer mejor, sin dramas ni restricciones.', pose: 'apple' },
      { text: 'Me alegra que estés aquí. Vamos paso a paso, sin prisas.', pose: 'apple' },
    ],
    complete: [
      { text: 'Ya te conozco un poco mejor. Esto va a ir bien 🌱', pose: 'celebration' },
      { text: 'Listo. Ahora sé lo que necesitas. Empezamos.', pose: 'fire' },
    ],
    educational: [
      { text: 'Dato rápido: proteína en el desayuno te mantiene saciado más tiempo.', pose: 'broccoli' },
      { text: 'El agua también cuenta. No la olvides hoy 💧', pose: 'broccoli' },
    ],
  },

  // ── Registro de comidas ──────────────────────────────────
  logging: {
    firstOfDay: [
      { text: 'Buen comienzo. Así se hace 💪', pose: 'spoon' },
      { text: 'Primer registro del día, eso es lo importante.', pose: 'spoon' },
    ],
    analyzing: [
      { text: 'Analizando lo que comiste... dame un segundo 🔍', pose: 'thinking' },
      { text: 'Mirando tus datos. Ahora mismo.', pose: 'thinking' },
    ],
    success: [
      { text: 'Anotado. Sigue así.', pose: 'spoon' },
      { text: 'Registrado. Tu yo futuro te lo agradece.', pose: 'pear' },
    ],
  },

  // ── Objetivo diario ──────────────────────────────────────
  dailyGoal: {
    completed: [
      { text: 'Lo has clavado hoy. Así se construyen los hábitos 🎉', pose: 'celebration' },
      { text: 'Día completado. Tu cuerpo te lo agradece.', pose: 'fire' },
    ],
    over: [
      { text: 'Hoy te has pasado un poco, pasa. Mañana seguimos.', pose: 'pear' },
      { text: 'No es perfecto, pero está bien. Un día no define nada.', pose: 'pear' },
    ],
    under: [
      { text: 'Has comido menos de lo previsto. Intenta no saltarte comidas.', pose: 'spoon' },
    ],
  },

  // ── Recordatorios ────────────────────────────────────────
  reminders: {
    noLog: [
      { text: 'Oye, ¿qué has comido hoy? Cuéntame 🥄', pose: 'sleepy' },
      { text: 'Todavía no he visto tu comida de hoy. ¿Todo bien?', pose: 'sleepy' },
    ],
    drinkWater: [
      { text: 'No olvides el agua. Tu cuerpo lo nota 💧', pose: 'spoon' },
    ],
  },

  // ── Rachas ───────────────────────────────────────────────
  streak: {
    active: (days: number): NutiMessage => ({
      text: days >= 7
        ? `${days} días seguidos. Eso no es suerte, es hábito 🔥`
        : `Llevas ${days} días seguidos. No pares ahora.`,
      pose: 'fire',
    }),
    broken: [
      { text: 'Se rompió la racha, pero no el progreso. Empezamos una nueva.', pose: 'sad' },
      { text: 'Tranqui. Lo que construiste no desaparece. Seguimos 🦦', pose: 'sad' },
    ],
  },

  // ── Pesaje ───────────────────────────────────────────────
  weight: {
    down: [
      { text: 'El número baja. Vas en la dirección correcta 📉', pose: 'celebration' },
    ],
    up: [
      { text: 'El cuerpo fluctúa, es normal. Lo importante es la tendencia.', pose: 'pear' },
      { text: 'Un dato no es una tendencia. Seguimos.', pose: 'pear' },
    ],
    same: [
      { text: 'Sin cambios hoy. Normal, el cuerpo no es lineal.', pose: 'pear' },
    ],
  },

  // ── Errores ──────────────────────────────────────────────
  errors: {
    generic: [
      { text: 'Ups, algo no fue bien. Inténtalo otra vez.', pose: 'thinking' },
      { text: 'Error mío. Vuelve a intentarlo.', pose: 'thinking' },
    ],
    noConnection: [
      { text: 'Sin conexión. Cuando vuelvas la señal, continuamos.', pose: 'sleepy' },
    ],
  },
} as const

// Helper para elegir mensaje aleatorio de un array
export function randomNutiMessage(messages: readonly NutiMessage[]): NutiMessage {
  return messages[Math.floor(Math.random() * messages.length)]
}
