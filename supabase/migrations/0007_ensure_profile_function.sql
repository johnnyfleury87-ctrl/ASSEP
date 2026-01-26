-- Migration 0007: Fonction pour assurer l'existence d'un profil
-- Crée automatiquement un profile si absent (idempotent)

-- Fonction: ensure_profile_exists
-- Usage: SELECT ensure_profile_exists('user-uuid-here', 'email@example.com');
CREATE OR REPLACE FUNCTION ensure_profile_exists(
  p_user_id UUID,
  p_email TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insérer le profil s'il n'existe pas
  INSERT INTO profiles (id, email, role, is_jetc_admin, comms_opt_in)
  VALUES (
    p_user_id,
    p_email,
    'membre',
    false,
    false
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: repair_missing_profiles
-- Répare tous les users auth.users qui n'ont pas de profile
CREATE OR REPLACE FUNCTION repair_missing_profiles() RETURNS TABLE(
  user_id UUID,
  email TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH missing_profiles AS (
    SELECT 
      au.id as user_id,
      au.email as user_email
    FROM auth.users au
    LEFT JOIN profiles p ON p.id = au.id
    WHERE p.id IS NULL
  ),
  inserted AS (
    INSERT INTO profiles (id, email, role, is_jetc_admin, comms_opt_in)
    SELECT 
      user_id,
      user_email,
      'membre',
      false,
      false
    FROM missing_profiles
    ON CONFLICT (id) DO NOTHING
    RETURNING id, email
  )
  SELECT 
    i.id as user_id,
    i.email as email,
    'created'::TEXT as status
  FROM inserted i;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON FUNCTION ensure_profile_exists IS 'Crée un profil pour un user s''il n''existe pas (idempotent)';
COMMENT ON FUNCTION repair_missing_profiles IS 'Répare tous les profils manquants pour les users existants';
