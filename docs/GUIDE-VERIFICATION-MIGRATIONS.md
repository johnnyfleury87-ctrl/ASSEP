# Guide de Vérification et Application des Migrations

Date : 2026-01-27

## 📋 État actuel des migrations

### Migrations existantes dans `/supabase/migrations/`

1. ✅ `0001_foundations.sql` - Base du système
2. ✅ `0002_events.sql` - Table événements
3. ✅ `0003_signups.sql` - Inscriptions
4. ✅ `0004_finance.sql` - Finance
5. ✅ `0005_emails_donations.sql` - Emails et dons
6. ✅ `0006_rls_policies.sql` - Policies RLS
7. ✅ `0007_auth_profiles_trigger.sql` - Trigger auth
8. ✅ `0008_admin_helpers.sql` - Fonctions helper admin
9. ✅ `0009_jetc_roles_admin.sql` - Rôles JETC
10. ✅ `0010_fix_email_campaigns_security.sql` - Fix sécurité
11. ✅ `0011_events_buvette.sql` - **Buvette et inscriptions**
12. ✅ `0012_events_photos.sql` - **Photos événements**

---

## 🔍 Vérifier l'état des migrations

### Option 1 : Via SQL Editor Supabase

Exécuter le script :
```bash
supabase/scripts/check_migrations_status.sql
```

Ce script vérifie :
- ✅ Quelles migrations sont appliquées
- ✅ Quelles tables existent
- ✅ Quels triggers sont actifs
- ✅ Quelles policies RLS sont en place
- ✅ Si le bucket Storage existe

### Option 2 : Via psql (si connexion locale)

```bash
psql "$DATABASE_URL" -f supabase/scripts/check_migrations_status.sql
```

### Option 3 : Vérification rapide manuelle

```sql
-- Voir les migrations appliquées
SELECT version, name, executed_at 
FROM supabase_migrations.schema_migrations 
ORDER BY version;

-- Vérifier migration 0011 (buvette)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
  AND column_name IN ('buvette_active', 'signups_enabled');

-- Vérifier migration 0012 (photos)
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'event_photos'
) AS photos_table_exists;

-- Vérifier bucket Storage
SELECT id, name, public 
FROM storage.buckets 
WHERE id = 'event-photos';
```

---

## ⚠️ Problèmes courants et solutions

### 1. Migration 0011 pas appliquée

**Symptômes** :
- Erreur `column "buvette_active" does not exist`
- Erreur `relation "event_products" does not exist`

**Solution** :
```bash
# Via Supabase CLI
supabase db push

# OU manuellement via SQL Editor
# Copier-coller le contenu de supabase/migrations/0011_events_buvette.sql
```

### 2. Migration 0012 pas appliquée

**Symptômes** :
- Erreur `relation "event_photos" does not exist`
- Impossible d'uploader des photos

**Solution** :
```bash
# Via Supabase CLI
supabase db push

# OU manuellement via SQL Editor
# Copier-coller le contenu de supabase/migrations/0012_events_photos.sql
```

### 3. Bucket Storage "event-photos" n'existe pas

**Symptômes** :
- Erreur `Bucket not found`
- Erreur lors de l'upload de photos

**Solution** :
Le bucket Storage **NE PEUT PAS** être créé via SQL. Il faut le créer manuellement :

1. **Dashboard Supabase** → **Storage** → **Buckets**
2. Cliquer **"New bucket"**
3. Configuration :
   - Name : `event-photos`
   - Public : ❌ NON (décoché)
   - File size limit : `5242880` (5 MB)
   - Allowed MIME types : `image/jpeg,image/png,image/webp`
4. Cliquer **"Create bucket"**

**Documentation complète** : [docs/CONFIGURATION-STORAGE-PHOTOS.md](../docs/CONFIGURATION-STORAGE-PHOTOS.md)

### 4. Policies Storage manquantes

**Symptômes** :
- Photos uploadées mais invisibles côté public
- Erreur "row-level security policy" lors de l'upload

**Solution** :
Les policies Storage doivent être créées **manuellement** via le Dashboard :

1. **Storage** → **Buckets** → **event-photos** → **Policies**
2. Créer 3 policies (voir détails dans [docs/CONFIGURATION-STORAGE-PHOTOS.md](../docs/CONFIGURATION-STORAGE-PHOTOS.md)) :
   - `event_photos_upload` (INSERT)
   - `event_photos_view` (SELECT)
   - `event_photos_delete` (DELETE)

---

## 🚀 Procédure d'application des migrations

### Environnement de production Supabase

#### Méthode 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Se connecter au projet
supabase link --project-ref VOTRE_PROJECT_REF

# 2. Appliquer toutes les migrations en attente
supabase db push

# 3. Vérifier l'état
supabase db pull  # Récupère le schema actuel
```

#### Méthode 2 : Via SQL Editor Dashboard

1. Ouvrir **SQL Editor** dans Dashboard Supabase
2. Pour chaque migration non appliquée :
   - Ouvrir le fichier `.sql`
   - Copier tout le contenu
   - Coller dans SQL Editor
   - Exécuter (Run)
3. Vérifier qu'il n'y a pas d'erreurs

---

## ✅ Checklist de validation

Après application des migrations 0011 et 0012 :

### Base de données

- [ ] Table `event_products` existe
- [ ] Colonne `events.buvette_active` existe
- [ ] Colonne `events.signups_enabled` existe
- [ ] Table `event_photos` existe
- [ ] Trigger `prevent_product_modification` existe sur `event_products`
- [ ] Trigger `check_photos_limit_before_insert` existe sur `event_photos`
- [ ] Contrainte unique sur `event_photos(event_id, is_cover)`

```sql
-- Requête de validation
SELECT 
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'event_products') AS event_products_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'buvette_active') AS buvette_active_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'signups_enabled') AS signups_enabled_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'event_photos') AS event_photos_exists,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'event_products' AND trigger_name = 'prevent_product_modification') AS trigger_products_exists,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE event_object_table = 'event_photos' AND trigger_name = 'check_photos_limit_before_insert') AS trigger_photos_exists;

-- Résultat attendu : tous les comptes = 1
```

### Storage Supabase

- [ ] Bucket `event-photos` existe
- [ ] Bucket est **privé** (public = false)
- [ ] Limite de taille : 5 MB
- [ ] Types MIME : jpeg, png, webp
- [ ] Policy `event_photos_upload` existe
- [ ] Policy `event_photos_view` existe
- [ ] Policy `event_photos_delete` existe

```sql
-- Vérifier le bucket
SELECT * FROM storage.buckets WHERE id = 'event-photos';

-- Résultat attendu :
-- id: event-photos
-- public: false
-- file_size_limit: 5242880
-- allowed_mime_types: {image/jpeg, image/png, image/webp}
```

### Code frontend

- [ ] Page `/dashboard/evenements/new` a les toggles buvette/inscriptions
- [ ] Page `/dashboard/evenements/[id]/edit` existe
- [ ] Page `/dashboard/evenements/[id]/produits` existe
- [ ] Page `/dashboard/evenements/[id]/photos` existe
- [ ] Page `/evenements/[slug]` affiche les photos
- [ ] Page `/evenements/index` affiche les photos de couverture

---

## 📊 Ordre de dépendances des migrations

```
0001_foundations.sql
  └─> 0002_events.sql
       └─> 0011_events_buvette.sql (ajoute colonnes + table event_products)
       └─> 0012_events_photos.sql (ajoute table event_photos)

0007_auth_profiles_trigger.sql
  └─> 0008_admin_helpers.sql (fonctions is_jetc_admin, etc.)
       └─> 0011_events_buvette.sql (utilise ces fonctions dans RLS)
       └─> 0012_events_photos.sql (utilise ces fonctions dans RLS)
```

**Important** : Les migrations 0011 et 0012 dépendent de migrations antérieures. Si vous avez des erreurs, vérifiez que les migrations précédentes sont bien appliquées.

---

## 🔄 Rollback d'une migration

### Pour annuler migration 0012 (photos)

```sql
-- Supprimer table et triggers
DROP TRIGGER IF EXISTS check_photos_limit_before_insert ON event_photos;
DROP TRIGGER IF EXISTS check_photo_permissions_before_modification ON event_photos;
DROP FUNCTION IF EXISTS check_event_photos_limit();
DROP FUNCTION IF EXISTS check_photo_modification_permissions();
DROP FUNCTION IF EXISTS get_event_photo_url(TEXT);
DROP TABLE IF EXISTS event_photos CASCADE;

-- Supprimer bucket manuellement via Dashboard Storage
```

### Pour annuler migration 0011 (buvette)

```sql
-- Supprimer table et triggers
DROP TRIGGER IF EXISTS prevent_product_modification ON event_products;
DROP FUNCTION IF EXISTS prevent_product_modification_if_published();
DROP TABLE IF EXISTS event_products CASCADE;

-- Supprimer colonnes sur events
ALTER TABLE events DROP COLUMN IF EXISTS buvette_active;
ALTER TABLE events DROP COLUMN IF EXISTS signups_enabled;
```

---

## 🛠️ Scripts utiles

### Voir toutes les migrations appliquées

```sql
SELECT 
  version,
  name,
  executed_at,
  CASE 
    WHEN version::text LIKE '0011%' THEN '🍺 Buvette'
    WHEN version::text LIKE '0012%' THEN '📸 Photos'
    ELSE '✅ Autre'
  END AS description
FROM supabase_migrations.schema_migrations
ORDER BY version DESC
LIMIT 15;
```

### Voir l'état complet des événements

```sql
SELECT 
  id,
  name,
  status,
  buvette_active,
  signups_enabled,
  (SELECT COUNT(*) FROM event_products WHERE event_id = events.id) AS nb_produits,
  (SELECT COUNT(*) FROM event_photos WHERE event_id = events.id) AS nb_photos,
  (SELECT storage_path FROM event_photos WHERE event_id = events.id AND is_cover = true) AS photo_couverture
FROM events
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs** : Dashboard Supabase → Logs → Database
2. **Exécuter le script de vérification** : `check_migrations_status.sql`
3. **Consulter la documentation** : [SYSTEME-EVENEMENTS-COMPLET.md](SYSTEME-EVENEMENTS-COMPLET.md)
4. **Vérifier les erreurs courantes** ci-dessus

---

**Dernière mise à jour** : 2026-01-27
