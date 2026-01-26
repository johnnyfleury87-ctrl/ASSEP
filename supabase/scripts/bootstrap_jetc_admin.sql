-- ============================================================================
-- Bootstrap JETC Admin
-- ============================================================================
-- Description: Active les droits JETC admin pour le premier utilisateur
-- Usage: Remplacer 'email@example.com' par l'email du premier admin créé
-- ============================================================================

-- IMPORTANT: Modifier l'email ci-dessous avant d'exécuter ce script
-- C'est l'email du user créé via le Dashboard Supabase (Add user)

UPDATE public.profiles
SET 
  is_jetc_admin = true,
  role = 'president',
  must_change_password = false,
  updated_at = NOW()
WHERE email = 'contact@jetc-immo.ch'; -- REMPLACER PAR L'EMAIL RÉEL

-- Vérification
SELECT 
  id,
  email,
  role,
  is_jetc_admin,
  must_change_password,
  created_at
FROM public.profiles
WHERE is_jetc_admin = true;

-- Si aucun résultat, vérifier que:
-- 1. Le user existe dans auth.users
-- 2. Le trigger a bien créé le profil
-- 3. L'email correspond exactement
