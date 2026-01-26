-- CORRECTION FINALE: Supprimer et recréer la policy service_role
-- Exécutez TOUT ceci dans SQL Editor Supabase

-- 1. Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;

-- 2. Recréer proprement
CREATE POLICY "Service role can do anything"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Vérifier que ça a marché
SELECT schemaname, tablename, policyname, roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
