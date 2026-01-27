-- ============================================================================
-- Configuration du bucket Storage pour les photos d'événements
-- ============================================================================
-- À exécuter via le Dashboard Supabase ou l'API Management
-- Date: 2026-01-27
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer le bucket (via Dashboard uniquement)
-- ============================================================================

/*
⚠️ CETTE PARTIE DOIT ÊTRE FAITE MANUELLEMENT DANS LE DASHBOARD SUPABASE :

1. Aller dans : https://supabase.com/dashboard/project/VOTRE_PROJECT/storage/buckets

2. Cliquer sur "New bucket"

3. Configuration :
   - Name: event-photos
   - Public bucket: ❌ NON (décoché - géré par RLS)
   - File size limit: 5242880 (5 MB)
   - Allowed MIME types: image/jpeg,image/png,image/webp

4. Cliquer "Create bucket"

OU via l'API REST (si vous avez la clé service_role) :

POST https://VOTRE_PROJECT.supabase.co/storage/v1/bucket
Headers:
  Authorization: Bearer VOTRE_SERVICE_ROLE_KEY
  Content-Type: application/json

Body:
{
  "id": "event-photos",
  "name": "event-photos",
  "public": false,
  "file_size_limit": 5242880,
  "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]
}
*/

-- ============================================================================
-- ÉTAPE 2: Configurer les Storage Policies
-- ============================================================================
-- ⚠️ LES POLICIES STORAGE NE PEUVENT PAS ÊTRE CRÉÉES VIA SQL STANDARD
-- ELLES DOIVENT ÊTRE CRÉÉES VIA LE DASHBOARD SUPABASE

/*
DANS LE DASHBOARD SUPABASE :

1. Aller dans : Storage → Buckets → event-photos → Policies

2. Cliquer "New Policy" pour chaque policy ci-dessous :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POLICY 1 : Upload (INSERT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: event_photos_upload
Allowed operation: INSERT
Policy definition:

(bucket_id = 'event-photos'::text)

WITH CHECK:

(auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.is_jetc_admin = true) OR (profiles.role = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretaire'::text, 'vice_secretaire'::text])))))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POLICY 2 : View (SELECT)  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: event_photos_view
Allowed operation: SELECT
Policy definition:

((bucket_id = 'event-photos'::text) AND (( EXISTS ( SELECT 1
   FROM events
  WHERE ((((events.id)::text = split_part((storage.objects.name)::text, '/'::text, 1)) AND (events.status = 'published'::text)))) OR (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.is_jetc_admin = true) OR (profiles.role = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretaire'::text, 'vice_secretaire'::text]))))))))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POLICY 3 : Delete (DELETE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: event_photos_delete
Allowed operation: DELETE
Policy definition:

((bucket_id = 'event-photos'::text) AND (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.is_jetc_admin = true) OR (profiles.role = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretaire'::text, 'vice_secretaire'::text]))))))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que le bucket existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'event-photos';

-- REMARQUE : Les policies Storage ne sont pas dans une table SQL accessible
-- Elles doivent être vérifiées via le Dashboard Supabase :
-- Storage → Buckets → event-photos → Policies

-- ============================================================================
-- TEST
-- ============================================================================

/*
Pour tester l'upload depuis l'interface :

1. Aller sur : /dashboard/evenements/[id]/photos
2. Sélectionner une image JPG/PNG/WEBP < 5MB
3. Upload devrait fonctionner
4. Vérifier dans Storage Dashboard que le fichier apparaît

Structure attendue dans le bucket :
event-photos/
  └── {event-id}/
      ├── {timestamp}-{filename}.jpg
      ├── {timestamp}-{filename}.png
      └── ...
*/
