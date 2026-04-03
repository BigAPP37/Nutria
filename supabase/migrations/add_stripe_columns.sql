-- Añadir columnas de Stripe y suscripción a user_profiles

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS subscription_status text
DEFAULT 'free'
CHECK (subscription_status IN ('free', 'trialing', 'active', 'past_due', 'canceled'));

-- Asegurarse de que is_premium e premium_expires_at existan
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS premium_expires_at timestamptz;
