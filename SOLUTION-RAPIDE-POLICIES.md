# 🚀 SOLUTION RAPIDE - Créer les Storage Policies

**Problème** : `StorageApiError: new row violates row-level security policy`

**Solution** : Créer les 3 policies manquantes

---

## Option 1 : Via SQL Editor (RECOMMANDÉ - 2 minutes)

### 1. Ouvrir SQL Editor

```
Dashboard Supabase → SQL Editor → New Query
```

### 2. Copier-coller ce SQL

```sql
-- Supprimer les policies existantes (au cas où)
DROP POLICY IF EXISTS "event_photos_upload" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_view" ON storage.objects;
DROP POLICY IF EXISTS "event_photos_delete" ON storage.objects;

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
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'event_photos%';
```

### 3. Cliquer "Run" (ou Ctrl+Enter)

### 4. Vérifier le résultat

Devrait afficher 3 lignes :
```
event_photos_delete  | DELETE
event_photos_upload  | INSERT
event_photos_view    | SELECT
```

---

## Option 2 : Via fichier SQL (alternative)

### 1. Ouvrir le fichier

```
supabase/scripts/create_storage_policies.sql
```

### 2. Copier tout le contenu

### 3. Coller dans SQL Editor de Supabase

### 4. Exécuter (Run)

---

## ✅ Test après création

### 1. Tester l'upload

```
1. Aller sur /dashboard/evenements/[id]/photos
2. Sélectionner une image JPG < 5MB
3. Upload
```

**Avant** : `❌ StorageApiError: new row violates row-level security policy`

**Après** : `✅ 1 photo(s) uploadée(s) avec succès`

### 2. Vérifier affichage public

```
1. Mettre événement en status='published'
2. Aller sur /evenements/{slug}
3. ✅ Photos visibles
```

### 3. Vérifier affichage liste

```
1. Aller sur /evenements
2. ✅ Photo de couverture visible sur chaque événement publié
```

---

## 🔍 Dépannage

### Erreur "policy already exists"

Utiliser le fichier `reset_storage_policies.sql` qui supprime d'abord :

```sql
-- Dans SQL Editor
\i supabase/scripts/reset_storage_policies.sql
```

### Erreur "permission denied"

Vérifier que vous êtes connecté avec un compte ayant les droits admin.

### Les policies ne s'appliquent pas

1. Vérifier dans Dashboard : Storage → Buckets → event-photos → Policies
2. Devrait afficher les 3 policies
3. Si absentes → réexécuter le SQL

---

## 📊 Récapitulatif

| Étape | Statut | Action |
|-------|--------|--------|
| Bucket créé | ✅ OK | Fait automatiquement |
| Policy Upload | ⏸️ À créer | SQL ci-dessus |
| Policy View | ⏸️ À créer | SQL ci-dessus |
| Policy Delete | ⏸️ À créer | SQL ci-dessus |

**Temps estimé** : 2 minutes

---

**Fichiers SQL disponibles** :
- `supabase/scripts/create_storage_policies.sql` - Création simple
- `supabase/scripts/reset_storage_policies.sql` - Suppression + recréation

**Après exécution** : L'upload de photos fonctionnera immédiatement.
