# Configuration du Storage pour les Photos d'Événements

## 🚨 Problème actuel

**Erreur** : `Bucket not found`

**Cause** : Le bucket Storage "event-photos" n'existe pas dans votre projet Supabase.

**Solution** : Suivre les étapes ci-dessous pour créer le bucket.

---

## 📋 Étapes de configuration

### Étape 1 : Créer le bucket Storage

#### Option A : Via le Dashboard Supabase (Recommandé)

1. **Ouvrir le Dashboard Supabase**
   ```
   https://supabase.com/dashboard/project/VOTRE_PROJECT_ID/storage/buckets
   ```

2. **Cliquer sur "New bucket"** (bouton en haut à droite)

3. **Configurer le bucket** :
   - **Name** : `event-photos`
   - **Public bucket** : ❌ **NON coché** (important - sécurité gérée par RLS)
   - **File size limit** : `5242880` (5 MB en bytes)
   - **Allowed MIME types** : `image/jpeg,image/png,image/webp`

4. **Cliquer "Create bucket"**

#### Option B : Via l'API (Avancé)

Si vous avez la clé `service_role`, vous pouvez utiliser curl :

```bash
curl -X POST 'https://VOTRE_PROJECT.supabase.co/storage/v1/bucket' \
  -H "Authorization: Bearer VOTRE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "event-photos",
    "name": "event-photos",
    "public": false,
    "file_size_limit": 5242880,
    "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]
  }'
```

---

### Étape 2 : Configurer les Storage Policies

#### Via le Dashboard Supabase

1. **Aller dans** : Storage → Buckets → `event-photos` → Policies

2. **Créer 3 policies** :

#### Policy 1 : Upload (INSERT)
```sql
-- Nom: event_photos_upload
-- Operation: INSERT
-- Policy definition:

auth.uid() IN (
  SELECT id FROM public.profiles 
  WHERE is_jetc_admin = true 
     OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
)
```

#### Policy 2 : Voir (SELECT)
```sql
-- Nom: event_photos_view
-- Operation: SELECT
-- Policy definition:

-- Le public peut voir les photos des événements publiés
EXISTS (
  SELECT 1 FROM public.events
  WHERE id::text = split_part(storage.objects.name, '/', 1)
  AND status = 'published'
)
OR
-- Les gestionnaires peuvent tout voir
auth.uid() IN (
  SELECT id FROM public.profiles 
  WHERE is_jetc_admin = true 
     OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
)
```

#### Policy 3 : Supprimer (DELETE)
```sql
-- Nom: event_photos_delete
-- Operation: DELETE
-- Policy definition:

auth.uid() IN (
  SELECT id FROM public.profiles 
  WHERE is_jetc_admin = true 
     OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
)
```

#### Via SQL (Alternative)

Exécutez le fichier : [supabase/scripts/setup_storage_bucket.sql](../supabase/scripts/setup_storage_bucket.sql)

---

### Étape 3 : Vérifier la configuration

#### Via le SQL Editor

```sql
-- Vérifier que le bucket existe
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'event-photos';

-- Résultat attendu :
-- id: event-photos
-- name: event-photos
-- public: false
-- file_size_limit: 5242880
-- allowed_mime_types: {image/jpeg,image/png,image/webp}
```

```sql
-- Vérifier les policies
SELECT 
  name,
  bucket_id,
  operation
FROM storage.policies
WHERE bucket_id = 'event-photos'
ORDER BY operation;

-- Résultat attendu :
-- event_photos_delete  | event-photos | DELETE
-- event_photos_upload  | event-photos | INSERT
-- event_photos_view    | event-photos | SELECT
```

---

## ✅ Test de fonctionnement

### 1. Upload d'une photo

1. Aller sur `/dashboard/evenements/[id]/photos`
2. Sélectionner une image JPG, PNG ou WEBP < 5MB
3. Cliquer "Choisir des fichiers" et uploader
4. ✅ Devrait afficher "1 photo(s) uploadée(s) avec succès"
5. ❌ Plus d'erreur "Bucket not found"

### 2. Vérifier dans le Storage Dashboard

1. Aller dans Storage → Buckets → `event-photos`
2. Voir la structure :
   ```
   event-photos/
     └── {event-uuid}/
         └── {timestamp}-{filename}.jpg
   ```

### 3. Vérifier l'affichage public

1. Publier l'événement (status='published')
2. Aller sur `/evenements/{slug}` (page publique)
3. ✅ La photo de couverture devrait s'afficher
4. ✅ La galerie devrait s'afficher

---

## 🔧 Dépannage

### Erreur : "Bucket not found"

**Cause** : Le bucket n'existe pas encore.

**Solution** : Suivre l'Étape 1 ci-dessus.

---

### Erreur : "new row violates row-level security policy"

**Cause** : Les Storage Policies ne sont pas configurées.

**Solution** : Suivre l'Étape 2 ci-dessus.

---

### Erreur : "File too large"

**Cause** : Fichier > 5MB.

**Solution** : Compresser l'image avant upload ou augmenter la limite dans le bucket.

---

### Erreur : "Invalid file type"

**Cause** : Type de fichier non autorisé (ni JPG, PNG, ni WEBP).

**Solution** : Convertir l'image en JPG, PNG ou WEBP.

---

### Les photos ne s'affichent pas côté public

**Vérifications** :

1. L'événement est-il `status='published'` ?
   ```sql
   SELECT id, name, status FROM events WHERE slug = 'votre-slug';
   ```

2. La photo a-t-elle `is_cover=true` ?
   ```sql
   SELECT * FROM event_photos WHERE event_id = 'votre-event-id';
   ```

3. La policy SELECT est-elle bien configurée ?
   ```sql
   SELECT * FROM storage.policies 
   WHERE bucket_id = 'event-photos' AND operation = 'SELECT';
   ```

---

## 📊 Structure finale attendue

### Base de données

```
event_photos
├── id (UUID)
├── event_id (UUID → events.id)
├── storage_path (TEXT) → chemin dans bucket
├── caption (TEXT)
├── is_cover (BOOLEAN)
├── display_order (INTEGER)
├── uploaded_by (UUID → profiles.id)
└── created_at (TIMESTAMPTZ)
```

### Storage Supabase

```
Bucket: event-photos (private)
├── Policy: event_photos_upload (INSERT)
├── Policy: event_photos_view (SELECT)
└── Policy: event_photos_delete (DELETE)

Files:
event-photos/
  ├── {event-id-1}/
  │   ├── 1737982345678-photo1.jpg
  │   └── 1737982456789-photo2.png
  └── {event-id-2}/
      └── 1737982567890-photo3.webp
```

---

## ⚡ Configuration rapide (Copier-coller)

### Variables d'environnement requises

Dans votre fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
```

### Bucket settings

```
Name: event-photos
Public: false
Size limit: 5242880
MIME types: image/jpeg,image/png,image/webp
```

---

## 📞 Aide supplémentaire

Si vous avez toujours des erreurs après avoir suivi ces étapes :

1. Vérifier les logs dans : Dashboard Supabase → Logs → Storage
2. Vérifier les policies actives : SQL Editor → `SELECT * FROM storage.policies;`
3. Tester l'upload directement depuis le Storage Dashboard

---

**Date** : 2026-01-27
**Statut** : Configuration requise avant utilisation
