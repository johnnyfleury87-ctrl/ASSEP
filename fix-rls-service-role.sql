-- SOLUTION URGENTE: Ajouter une policy pour le service role
-- Exécutez ceci dans SQL Editor Supabase

-- Option 1: Policy pour bypass avec service role
CREATE POLICY "Service role can do anything"
ON public.profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Option 2: Si ça ne marche pas, vérifier que RLS est bien activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Option 3: Temporairement désactiver RLS (PAS RECOMMANDÉ en prod)
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
