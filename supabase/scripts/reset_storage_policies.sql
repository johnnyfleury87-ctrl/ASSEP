-- ============================================================================
-- Suppression et recréation des Storage Policies (idempotent)
-- ============================================================================
-- À exécuter si les policies existent déjà et doivent être mises à jour
-- ============================================================================

-- Supprimer les policies existantes (ne plante pas si elles n'existent pas)
DROP POLICY IF EXISTS "event_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_view" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_delete" ON storage.objects;

-- ============================================================================
-- RECRÉATION DES POLICIES
-- ============================================================================

-- POLICY 1: Upload
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

-- POLICY 2: View
CREATE POLICY "event_photos_view"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'event-photos'
  AND (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id::text = split_part(name, '/', 1)
        AND status = 'published'
    )
    OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE is_jetc_admin = true 
         OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
    )
  )
);

-- POLICY 3: Delete
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

-- Vérifier
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'event_photos%'
ORDER BY policyname;

-- ✅ Storage Policies créées pour le bucket event-photos
