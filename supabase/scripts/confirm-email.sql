-- Script pour confirmer l'email d'un utilisateur manuellement
-- À utiliser quand un user est en "Waiting for verification" dans Supabase Auth

-- ⚠️ REMPLACER l'email ci-dessous par celui de l'utilisateur à confirmer
-- Exemple: contact@jetc-immo.ch ou votre email admin

UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE email = 'contact@jetc-immo.ch'; -- ⚠️ REMPLACER ICI

-- Vérifier que la mise à jour a fonctionné
SELECT 
  email,
  email_confirmed_at,
  confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmé'
    ELSE '❌ Non confirmé'
  END as status
FROM auth.users
WHERE email = 'contact@jetc-immo.ch'; -- ⚠️ REMPLACER ICI

-- Optionnel: Confirmer TOUS les utilisateurs en attente
-- ⚠️ Décommenter UNIQUEMENT si vous voulez confirmer tous les users
/*
UPDATE auth.users
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Afficher le résumé
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;
*/
