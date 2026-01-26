-- ============================================================================
-- Créer Profil pour User Existant
-- ============================================================================
-- Description: Crée un profil pour un user créé manuellement via Dashboard
-- Usage: Remplacer l'email et exécuter après avoir créé un user via Dashboard
-- ============================================================================

-- IMPORTANT: Remplacer 'email@example.com' par l'email réel du user créé

SELECT public.create_profile_for_user(
  p_user_id := (SELECT id FROM auth.users WHERE email = 'contact@jetc-immo.ch'),
  p_email := 'contact@jetc-immo.ch',
  p_first_name := johnny,  -- Remplacer par le prénom si connu
  p_last_name := Fleury,   -- Remplacer par le nom si connu
  p_role := 'president',    -- Ou: president, vice_president, tresorier, etc.
  p_must_change_password := true,
  p_created_by := NULL
);

-- Vérification
SELECT 
  id,
  email,
  first_name,
  last_name,
  role,
  must_change_password,
  created_at
FROM public.profiles
WHERE email = 'contact@jetc-immo.ch';
