-- ============================================================================
-- Création des Storage Policies pour le bucket event-photos
-- ============================================================================
-- À exécuter dans le SQL Editor de Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- POLICY 1: Upload (INSERT) - Les gestionnaires peuvent uploader des photos
-- ============================================================================

CREATE POLICY "event_photos_upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE is_jetc_admin = true 
       OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
  )
);

-- ============================================================================
-- POLICY 2: View (SELECT) - Public peut voir si publié, gestionnaires tout
-- ============================================================================

CREATE POLICY "event_photos_view"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'event-photos'
  AND (
    -- Le public peut voir les photos des événements publiés
    -- On extrait l'event_id du path (format: event-id/filename.jpg)
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id::text = split_part(name, '/', 1)
        AND status = 'published'
    )
    OR
    -- Les gestionnaires peuvent tout voir
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE is_jetc_admin = true 
         OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
    )
  )
);

-- ============================================================================
-- POLICY 3: Delete (DELETE) - Les gestionnaires peuvent supprimer
-- ============================================================================

CREATE POLICY "event_photos_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE is_jetc_admin = true 
       OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
  )
);

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que les policies sont créées
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'event_photos%'
ORDER BY policyname;

-- Résultat attendu : 3 lignes
-- event_photos_delete  | DELETE | {authenticated}
-- event_photos_upload  | INSERT | {authenticated}
-- event_photos_view    | SELECT | {public}

-- ============================================================================
-- TEST
-- ============================================================================

/*
Après exécution de ce script :

1. Tester l'upload depuis /dashboard/evenements/[id]/photos
   → Devrait fonctionner sans erreur "row-level security policy"

2. Vérifier l'affichage public
   → Photos visibles seulement si événement status='published'

3. Tester la suppression
   → Gestionnaires peuvent supprimer, autres non
*/
