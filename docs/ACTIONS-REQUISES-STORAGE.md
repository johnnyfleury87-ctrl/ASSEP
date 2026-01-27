# Actions Requises - Configuration Photos Événements

## 🚨 Problème actuel

**Erreur rencontrée** : `Bucket not found` lors de l'upload de photos

**Cause** : Tentative d'exécution de SQL qui n'est pas supporté :
- ❌ `INSERT INTO storage.policies` n'existe pas
- ❌ Les policies Storage ne sont PAS dans une table SQL
- ✅ Elles doivent être créées via le Dashboard Supabase

## ✅ Ce qui est déjà fait

### Migrations SQL (appliquées)

- ✅ Migration `0011_events_buvette.sql` - Buvette et inscriptions
  - Table `event_products`
  - Colonnes `buvette_active`, `signups_enabled`
  - Trigger protection produits

- ✅ Migration `0012_events_photos.sql` - Photos
  - Table `event_photos`
  - Trigger limite 20 photos
  - Trigger protection couverture
  - Fonctions RLS

### Code frontend (créé)

- ✅ Pages admin : list, new, edit, produits, photos
- ✅ Pages publiques : liste avec couverture, détail avec galerie
- ✅ Formulaires et validations

## ❌ Ce qui MANQUE (à faire manuellement)

### 1. Créer le bucket Storage "event-photos"

**Via Dashboard Supabase** :

1. Aller sur : https://supabase.com/dashboard/project/VOTRE_PROJECT/storage/buckets
2. Cliquer **"New bucket"**
3. Remplir :
   ```
   Name: event-photos
   Public: ❌ NON (décoché)
   File size limit: 5242880
   Allowed MIME types: image/jpeg,image/png,image/webp
   ```
4. Cliquer **"Create bucket"**

### 2. Créer les 3 Storage Policies

**Via Dashboard Supabase** : Storage → Buckets → event-photos → Policies

#### Policy 1 : Upload (INSERT)

```
Name: event_photos_upload
Allowed operation: INSERT
Target roles: authenticated

Policy definition (USING):
(bucket_id = 'event-photos'::text)

WITH CHECK:
(auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.is_jetc_admin = true) OR (profiles.role = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretaire'::text, 'vice_secretaire'::text])))))
```

#### Policy 2 : View (SELECT)

```
Name: event_photos_view
Allowed operation: SELECT
Target roles: public, authenticated

Policy definition (USING):
((bucket_id = 'event-photos'::text) AND (( EXISTS ( SELECT 1
   FROM events
  WHERE ((((events.id)::text = split_part((storage.objects.name)::text, '/'::text, 1)) AND (events.status = 'published'::text)))) OR (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.is_jetc_admin = true) OR (profiles.role = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretaire'::text, 'vice_secretaire'::text]))))))))
```

#### Policy 3 : Delete (DELETE)

```
Name: event_photos_delete
Allowed operation: DELETE
Target roles: authenticated

Policy definition (USING):
((bucket_id = 'event-photos'::text) AND (auth.uid() IN ( SELECT profiles.id
   FROM profiles
  WHERE ((profiles.is_jetc_admin = true) OR (profiles.role = ANY (ARRAY['president'::text, 'vice_president'::text, 'secretaire'::text, 'vice_secretaire'::text]))))))
```

## 🧪 Test après configuration

### 1. Test upload

```
1. Aller sur /dashboard/evenements/[id]/photos
2. Sélectionner image JPG/PNG/WEBP < 5MB
3. Cliquer "Choisir des fichiers"
4. ✅ Devrait afficher "1 photo(s) uploadée(s) avec succès"
5. ❌ Plus d'erreur "Bucket not found"
```

### 2. Vérifier dans Storage

```
Dashboard → Storage → Buckets → event-photos
Voir structure :
  event-photos/
    └── {event-uuid}/
        └── {timestamp}-{filename}.jpg
```

### 3. Vérifier affichage public

```
1. Mettre événement en status='published'
2. Aller sur /evenements/{slug}
3. ✅ Photo de couverture visible
4. ✅ Galerie photos visible
```

## 📋 Checklist finale

Avant de déclarer le système fonctionnel :

- [ ] Bucket `event-photos` créé
- [ ] Bucket configuré en privé (public=false)
- [ ] 3 policies créées (upload, view, delete)
- [ ] Test upload réussi (pas d'erreur "Bucket not found")
- [ ] Photo visible dans Storage Dashboard
- [ ] Photo de couverture affichée dans liste événements publique
- [ ] Galerie photos affichée dans détail événement public
- [ ] Trigger 20 photos fonctionne (teste en uploadant 21 photos)
- [ ] Trigger protection couverture fonctionne (publie puis essaie de changer)

## 📚 Documentation de référence

1. **[GUIDE-VERIFICATION-MIGRATIONS.md](GUIDE-VERIFICATION-MIGRATIONS.md)** - Vérifier état des migrations
2. **[CONFIGURATION-STORAGE-PHOTOS.md](CONFIGURATION-STORAGE-PHOTOS.md)** - Guide détaillé Storage
3. **[SYSTEME-EVENEMENTS-COMPLET.md](SYSTEME-EVENEMENTS-COMPLET.md)** - Documentation système complet

## ⏱️ Temps estimé

- Création bucket : 2 minutes
- Création policies : 5 minutes (copier-coller depuis ce fichier)
- Tests : 5 minutes
- **Total : ~15 minutes**

## 🔧 Fichiers corrigés

- ✅ `supabase/scripts/setup_storage_bucket.sql` - Supprimé les INSERT impossibles, gardé uniquement les instructions Dashboard
- ✅ Créé `supabase/scripts/check_migrations_status.sql` - Script de vérification complet

---

**Date** : 2026-01-27  
**Statut** : ⏸️ En attente de configuration manuelle Storage  
**Bloquant** : Oui, l'upload de photos ne fonctionnera pas sans le bucket
