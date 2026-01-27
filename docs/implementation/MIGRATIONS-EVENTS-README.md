# 📦 Migrations Événements - Récapitulatif

**Date de création :** 27 janvier 2026  
**Statut :** ✅ Créées - En attente d'exécution Supabase

---

## 🎯 Migrations Créées

### 📄 `0011_events_buvette.sql`

**Objectif :** Ajouter la gestion de buvette et le contrôle des inscriptions

**Modifications :**

1. **Ajout colonnes dans `events` :**
   - `buvette_active` (BOOLEAN, DEFAULT false)
   - `signups_enabled` (BOOLEAN, DEFAULT false)

2. **Nouvelle table `event_products` :**
   - Produits vendus à la buvette
   - Prix, catégorie, stock
   - Flag `is_active` pour désactiver sans supprimer

3. **Protection buvette publiée :**
   - Trigger `prevent_product_modification_if_published()`
   - Bloque INSERT/UPDATE/DELETE si `event.status = 'published'`
   - Message : "Repassez l'événement en brouillon"

4. **RLS Policies :**
   - Public voit produits si événement publié + buvette active
   - Gestionnaires peuvent tout gérer (trigger bloque si publié)

5. **Mise à jour policy signups :**
   - Inscriptions autorisées UNIQUEMENT si `signups_enabled = true`

---

### 📄 `0012_events_photos.sql`

**Objectif :** Gestion photos événements avec Storage Supabase

**Modifications :**

1. **Nouvelle table `event_photos` :**
   - Référence Storage path
   - Caption (légende)
   - `is_cover` (photo de couverture)
   - `display_order` (ordre galerie)
   - `uploaded_by` (traçabilité)

2. **Contraintes :**
   - Index UNIQUE : 1 seule `is_cover = true` par événement
   - Trigger : Maximum 20 photos par événement

3. **Permissions photos publiées :**
   - Ajout photo : OK même si publié
   - Suppression cover : Président/Vice uniquement si publié
   - Modification cover : Président/Vice uniquement si publié

4. **RLS Policies :**
   - Public voit photos si événement publié
   - Gestionnaires peuvent tout voir/gérer
   - Trigger gère restrictions fines

5. **Storage Bucket :**
   - Nom : `event-photos`
   - Policies Storage à configurer manuellement (voir migration)

---

## 📋 Checklist Exécution

### Avant d'exécuter les migrations

- [ ] Backup base de données Supabase
- [ ] Vérifier que migrations précédentes sont appliquées (0001-0010)
- [ ] Lire entièrement les deux fichiers SQL

### Exécution Migration 0011

- [ ] Copier contenu `0011_events_buvette.sql`
- [ ] Ouvrir Supabase SQL Editor
- [ ] Coller et exécuter
- [ ] Vérifier résultats des SELECT de vérification
- [ ] Tester création produit en brouillon : ✅ OK
- [ ] Tester création produit événement publié : ❌ ERREUR attendue

### Exécution Migration 0012

- [ ] Copier contenu `0012_events_photos.sql`
- [ ] Ouvrir Supabase SQL Editor
- [ ] Coller et exécuter
- [ ] Vérifier résultats des SELECT de vérification

### Actions manuelles POST-migration 0012

- [ ] Créer bucket Storage `event-photos`
  - Dashboard > Storage > Create bucket
  - Nom : `event-photos`
  - Public : false
  - File size limit : 5 MB
  - Allowed MIME : image/jpeg, image/png, image/webp

- [ ] Configurer Storage Policies
  - `event_photos_upload` (gestionnaires)
  - `event_photos_view_public` (public si published)
  - `event_photos_delete` (gestionnaires)
  - ⚠️ Code SQL fourni dans migration 0012

### Tests Post-Migration

- [ ] Tester création événement avec `buvette_active = true`
- [ ] Tester ajout produit buvette (draft) : ✅ OK
- [ ] Tester publication événement
- [ ] Tester modification produit (published) : ❌ ERREUR attendue
- [ ] Tester upload photo (via UI ou API)
- [ ] Tester limite 20 photos
- [ ] Tester contrainte unique `is_cover`
- [ ] Tester visibilité publique photos (published uniquement)
- [ ] Tester inscription avec `signups_enabled = false` : ❌ BLOQUÉ
- [ ] Tester inscription avec `signups_enabled = true` + published : ✅ OK

---

## 🚀 Après Validation Migrations

Une fois les migrations exécutées et testées avec succès :

1. ✅ Confirmer que tout fonctionne en base
2. 🎨 **ALORS** commencer l'UI Dashboard :
   - Page édition événement
   - Toggle buvette/inscriptions
   - Gestion produits
   - Upload photos
   - Bouton publication MVP

---

## 📝 Notes Techniques

### Limites Implémentées

| Limite | Valeur | Où |
|--------|--------|-----|
| Photos par événement | 20 max | Trigger `check_event_photos_limit()` |
| Taille photo | 5 MB | Storage bucket config (manuel) |
| Formats acceptés | JPG, PNG, WEBP | Storage bucket config (manuel) |
| Photos cover | 1 par événement | Index unique `idx_event_photos_unique_cover` |

### Sécurité

- ✅ Buvette figée si published (trigger)
- ✅ Cover protégée si published (trigger + permissions)
- ✅ Inscriptions conditionnées (RLS policy)
- ✅ Storage protégé (policies manuelles à configurer)

### Points d'Attention

⚠️ **Storage Policies :** Doivent être configurées MANUELLEMENT dans Supabase Dashboard (pas scriptable en SQL)

⚠️ **Suppression événement :** CASCADE supprime automatiquement :
- Produits buvette
- Photos (références table, pas fichiers Storage)
- ⚠️ Fichiers Storage doivent être supprimés manuellement ou via fonction

⚠️ **Retour en draft :** Permet modification buvette, attention à la cohérence si événement déjà en cours

---

## 🔗 Fichiers Concernés

- `/supabase/migrations/0011_events_buvette.sql`
- `/supabase/migrations/0012_events_photos.sql`
- `/docs/implementation/events.md` (documentation validée)

---

**Prochaine étape :** Exécution des migrations dans Supabase ✅
