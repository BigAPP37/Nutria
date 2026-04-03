// Tipos para el sistema de detección de patrones psicológicos

export interface PsychFlag {
  id: string
  user_id: string
  flag_type: 'consecutive_low_logging' | 'consecutive_zero_logging' | 'restrictive_language'
  detected_at: string
  details: Record<string, unknown> | null
  consecutive_days: number | null
  trigger_text: string | null
}

export interface PsychResponse {
  id: string
  user_id: string
  flag_id: string
  message_key: string
  message_content: string
  shown_at: string
  dismissed_at: string | null
  was_helpful: boolean | null
}

export type FlagType = PsychFlag['flag_type']
