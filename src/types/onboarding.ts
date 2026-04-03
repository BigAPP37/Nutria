// Tipos del sistema de onboarding ampliado

// Identificadores únicos de cada pantalla
export type ScreenId =
  | 'welcome'
  | 'goal'
  | 'weight-experience'
  | 'past-diets'
  | 'body-name'
  | 'body-about'
  | 'body-measurements'
  | 'activity-level'
  | 'education-restrictive-diets'
  | 'food-relationship'
  | 'eating-triggers'
  | 'emotional-eating'
  | 'biggest-challenges'
  | 'education-normal'
  | 'education-ai-scanner'
  | 'meals-routine'
  | 'lifestyle'
  | 'diet-restrictions'
  | 'secondary-goals'
  | 'commitment'
  | 'progress-tracking'
  | 'living-situation'
  | 'household-support'
  | 'education-environment'
  | 'ai-preferences'
  | 'tca-screening'
  | 'ready'
  | 'register'

// Opción de selección genérica
export interface SelectOption {
  value: string
  label: string
  description?: string
  emoji?: string
  icon?: string
}

// Tipos para campos de user_context
export type WeightLossExperience = 'lost_want_more' | 'tried_failed' | 'lost_regained' | 'on_medication' | 'never_tried'
export type FoodRelationship = 'healthy' | 'complicated' | 'improving' | 'struggling'
export type EmotionalEatingFrequency = 'never' | 'rarely' | 'sometimes' | 'often' | 'always'
export type SnackingFrequency = 'never' | 'rarely' | 'sometimes' | 'often' | 'always'
export type CookingFrequency = 'never' | 'rarely' | 'sometimes' | 'often' | 'daily'
export type EatsOutFrequency = 'never' | 'rarely' | 'weekly' | 'several_weekly' | 'daily'
export type WaterIntake = 'very_low' | 'low' | 'moderate' | 'good' | 'excellent'
export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent'
export type StressLevel = 'low' | 'moderate' | 'high' | 'very_high'
export type CommitmentTime = '5min' | '10min' | '15min' | '30min'
export type LivingSituation = 'alone' | 'partner' | 'family' | 'roommates'
export type HouseholdSupport = 'very_supportive' | 'somewhat_supportive' | 'neutral' | 'unsupportive'
export type AiTonePreference = 'warm_supportive' | 'direct_honest' | 'coach_motivational' | 'scientific'
export type TcaAnswer = 'yes' | 'no' | 'prefer_not_to_say'
