-- Script: Réparer les profils manquants
-- À exécuter si des users auth.users n'ont pas de ligne dans profiles

-- Lister les users sans profil
SELECT 
  au.id,
  au.email,
  au.created_at,
  CASE WHEN p.id IS NULL THEN 'MANQUANT' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- Réparer tous les profils manquants
SELECT * FROM repair_missing_profiles();

-- Vérification finale
SELECT 
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as profiles_ok,
  COUNT(*) FILTER (WHERE p.id IS NULL) as profiles_manquants
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;
