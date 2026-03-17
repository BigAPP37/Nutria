-- NutriAI — Supabase Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name TEXT,
  age INT,
  gender TEXT CHECK (gender IN ('male','female','other')),
  height_cm INT,
  weight_kg DECIMAL(5,2),
  goal TEXT CHECK (goal IN ('cut','maintain','bulk','recomp')) DEFAULT 'cut',
  diet_type TEXT DEFAULT 'balanced',
  activity_level TEXT DEFAULT 'moderate',
  target_calories INT DEFAULT 2000,
  target_protein INT DEFAULT 150,
  target_carbs INT DEFAULT 200,
  target_fat INT DEFAULT 65,
  tdee_estimated INT DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  meal_type TEXT CHECK (meal_type IN ('breakfast','lunch','dinner','snack')) DEFAULT 'snack',
  raw_input TEXT NOT NULL,
  parsed_name TEXT,
  calories INT DEFAULT 0,
  protein_g DECIMAL(6,2) DEFAULT 0,
  carbs_g DECIMAL(6,2) DEFAULT 0,
  fat_g DECIMAL(6,2) DEFAULT 0,
  fiber_g DECIMAL(6,2) DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.8,
  source TEXT DEFAULT 'ai'
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logged_at DATE DEFAULT CURRENT_DATE,
  weight_kg DECIMAL(5,2),
  body_fat_pct DECIMAL(4,2),
  UNIQUE (user_id, logged_at)
);

CREATE TABLE IF NOT EXISTS fasting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  target_hours INT DEFAULT 16,
  completed BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_date ON meal_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user ON weight_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_fasting_user ON fasting_sessions(user_id, started_at DESC);

-- RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fasting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own meals" ON meal_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own weights" ON weight_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own fasting" ON fasting_sessions FOR ALL USING (auth.uid() = user_id);
