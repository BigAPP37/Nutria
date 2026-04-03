-- Añadir campos TCA a user_context (se capturan en el onboarding pero faltaban en la tabla)
ALTER TABLE user_context
  ADD COLUMN IF NOT EXISTS tca_answer TEXT CHECK (tca_answer IN ('yes', 'no', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS tca_flagged BOOLEAN DEFAULT false;
