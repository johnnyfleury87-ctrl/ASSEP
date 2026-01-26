-- ============================================================================
-- Repair Profiles
-- ============================================================================
-- Description: Répare les profils manquants ou corrompus
-- Usage: Exécuter en cas de désynchronisation auth.users <> profiles
-- ============================================================================

-- Utiliser la fonction de synchronisation automatique
SELECT * FROM public.sync_auth_users_to_profiles();

-- Le résultat affiche:
-- - synced_count: nombre de profils créés
-- - missing_profiles: liste des emails synchronisés

-- Vérification finale
SELECT 
  'auth.users' as source,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'profiles' as source,
  COUNT(*) as total
FROM public.profiles;

-- Les deux counts doivent être identiques
