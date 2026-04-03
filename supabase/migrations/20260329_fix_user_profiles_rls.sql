-- Fix: añadir política UPDATE en user_profiles (faltaba, causaba error en upsert)
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
