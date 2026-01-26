-- Script: Promouvoir un user en JETC admin
-- À exécuter UNE SEULE FOIS dans Supabase SQL Editor après création du premier user

-- ⚠️ REMPLACER 'votre-email@jetc-solution.fr' PAR VOTRE EMAIL RÉEL

-- Promotion du user JETC en admin
UPDATE profiles
SET 
  is_jetc_admin = true,
  role = 'president',
  updated_at = NOW()
WHERE email = 'votre-email@jetc-solution.fr';

-- Vérification (doit retourner 1 ligne avec is_jetc_admin=true)
SELECT 
  id,
  email,
  role,
  is_jetc_admin,
  created_at
FROM profiles
WHERE email = 'votre-email@jetc-solution.fr';

-- Si aucune ligne retournée, le profile n'existe pas.
-- Créer le profile manuellement d'abord:
-- 
-- INSERT INTO profiles (id, email, role, is_jetc_admin)
-- VALUES (
--   'UUID-DU-USER-AUTH',  -- Récupérer depuis auth.users
--   'votre-email@jetc-solution.fr',
--   'president',
--   true
-- );
