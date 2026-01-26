-- Vérifier que les RLS policies sont bien appliquées
-- Exécutez cette requête dans SQL Editor

-- 1. Voir toutes les policies sur profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Test de lecture de votre profil (doit marcher)
SELECT id, email, role, is_jetc_admin
FROM profiles
WHERE email = 'contact@jetc-immo.ch';
