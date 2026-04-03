CREATE TABLE user_context (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight_loss_experience TEXT CHECK (weight_loss_experience IN ('lost_want_more','tried_failed','lost_regained','on_medication','never_tried')),
  past_diets TEXT[],
  biggest_challenge TEXT CHECK (biggest_challenge IN ('cravings','motivation','portion_size','knowledge','time','emotional_eating','social_pressure','other')),
  biggest_challenges TEXT[],
  eating_triggers TEXT[],
  emotional_eating_frequency TEXT CHECK (emotional_eating_frequency IN ('never','rarely','sometimes','often','always')),
  food_relationship TEXT CHECK (food_relationship IN ('healthy','complicated','improving','struggling')),
  restriction_history BOOLEAN DEFAULT false,
  meals_per_day INT CHECK (meals_per_day BETWEEN 1 AND 6),
  snacking_frequency TEXT CHECK (snacking_frequency IN ('never','rarely','sometimes','often','always')),
  cooking_frequency TEXT CHECK (cooking_frequency IN ('never','rarely','sometimes','often','daily')),
  eats_out_frequency TEXT CHECK (eats_out_frequency IN ('never','rarely','weekly','several_weekly','daily')),
  water_intake TEXT CHECK (water_intake IN ('very_low','low','moderate','good','excellent')),
  sleep_quality TEXT CHECK (sleep_quality IN ('poor','fair','good','excellent')),
  stress_level TEXT CHECK (stress_level IN ('low','moderate','high','very_high')),
  secondary_goals TEXT[],
  motivation_level TEXT CHECK (motivation_level IN ('low','moderate','high','very_high')),
  commitment_time TEXT CHECK (commitment_time IN ('5min','10min','15min','30min')),
  progress_tracking TEXT[],
  living_situation TEXT CHECK (living_situation IN ('alone','partner','family','roommates')),
  household_support TEXT CHECK (household_support IN ('very_supportive','somewhat_supportive','neutral','unsupportive')),
  diet_restrictions TEXT[],
  allergies TEXT[],
  ai_tone_preference TEXT CHECK (ai_tone_preference IN ('warm_supportive','direct_honest','coach_motivational','scientific')),
  wants_daily_tips BOOLEAN DEFAULT true,
  notification_time TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own context" ON user_context FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own context" ON user_context FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own context" ON user_context FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON user_context FOR ALL TO service_role USING (true);

CREATE TRIGGER update_user_context_updated_at
  BEFORE UPDATE ON user_context
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
