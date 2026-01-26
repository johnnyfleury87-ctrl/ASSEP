-- Migration 0008: Corriger le schéma profiles et le trigger
-- Problème: trigger handle_new_user() échoue car colonnes manquantes

-- 1. Ajouter les colonnes manquantes dans profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS is_jetc_admin BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Créer un index sur is_jetc_admin pour les requêtes d'autorisation
CREATE INDEX IF NOT EXISTS idx_profiles_is_jetc_admin ON profiles(is_jetc_admin) WHERE is_jetc_admin = TRUE;

-- 3. Migrer les données existantes: full_name → first_name/last_name
UPDATE profiles
SET 
  first_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' IN full_name) > 0 
    THEN split_part(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE 
    WHEN full_name IS NOT NULL AND position(' ' IN full_name) > 0 
    THEN substring(full_name FROM position(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL 
  AND (first_name IS NULL OR last_name IS NULL);

-- 4. Corriger le trigger handle_new_user pour utiliser le nouveau schéma
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insérer le profil avec les bonnes colonnes
  INSERT INTO profiles (
    id, 
    email, 
    first_name,
    last_name,
    full_name, 
    role, 
    comms_opt_in,
    is_jetc_admin,
    must_change_password
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'membre', 
    FALSE,
    FALSE,
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::BOOLEAN, FALSE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. S'assurer que le trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Commentaires
COMMENT ON COLUMN profiles.first_name IS 'Prénom de l''utilisateur';
COMMENT ON COLUMN profiles.last_name IS 'Nom de famille de l''utilisateur';
COMMENT ON COLUMN profiles.is_jetc_admin IS 'Super-administrateur JETC (accès complet)';
COMMENT ON COLUMN profiles.must_change_password IS 'L''utilisateur doit changer son mot de passe à la prochaine connexion';
