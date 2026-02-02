# Corrections Accès Secrétaires - 2026-02-02

## 🎯 Problème identifié

Les secrétaires et vice-secrétaires recevaient "Vous n'avez pas accès à cette page" lors de la tentative d'édition d'événements publiés.

**Cause** : Restrictions trop strictes dans le code frontend et les RLS policies Supabase.

---

## ✅ Corrections appliquées

### 1. Frontend - Guards de rôles

#### [pages/dashboard/evenements/[id]/edit.js](pages/dashboard/evenements/[id]/edit.js)

**Avant** : Seuls président/vice-président pouvaient éditer tous les événements
```javascript
if (profile.is_jetc_admin || ['president', 'vice_president'].includes(profile.role)) {
  return true
}
```

**Après** : Secrétaires ont maintenant accès complet
```javascript
if (profile.is_jetc_admin || ['president', 'vice_president', 'secretaire', 'vice_secretaire'].includes(profile.role)) {
  return true
}
```

- ✅ `canEdit()` : Autorise secrétaires à éditer tous les événements
- ✅ `canPublish()` : Autorise secrétaires à publier les événements

#### [pages/dashboard/evenements/[id]/photos.js](pages/dashboard/evenements/[id]/photos.js)

- ✅ `handleSetCover()` : Secrétaires peuvent changer la photo de couverture
- ✅ `handleDelete()` : Secrétaires peuvent supprimer les photos

---

### 2. Backend - RLS Policies Supabase

#### Migration créée : [supabase/migrations/0013_secretaires_full_edit.sql](supabase/migrations/0013_secretaires_full_edit.sql)

**Changement** :
- ❌ **Suppression** de `events_update_secretaire` (restrictive)
- ✅ **Création** de `events_update_managers` (permissive)

```sql
DROP POLICY IF EXISTS "events_update_secretaire" ON public.events;

CREATE POLICY "events_update_managers"
  ON public.events FOR UPDATE
  TO authenticated
  USING (can_manage_events())
  WITH CHECK (can_manage_events());
```

**Note** : La fonction `can_manage_events()` incluait déjà les secrétaires :
```sql
role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
```

---

### 3. Bonus - Correction erreur 404 volunteer_signups

**Problème** : Console affichait `404 /rest/v1/volunteer_signups`

**Cause** : Nom de table incorrect dans le code (devrait être `signups`)

**Corrections** :

| Fichier | Ligne | Correction |
|---------|-------|------------|
| [pages/dashboard/index.js](pages/dashboard/index.js) | 59 | `volunteer_signups` → `signups` |
| [pages/evenements/[slug].js](pages/evenements/[slug].js) | 413 | `volunteer_signups` → `signups` |
| [pages/api/signups.js](pages/api/signups.js) | 63 | `volunteer_signups` → `signups` |
| [pages/api/campaigns/send.js](pages/api/campaigns/send.js) | 100 | `volunteer_signups` → `signups` |

---

## 📋 Fichiers modifiés

### Frontend (4 fichiers)
1. [pages/dashboard/evenements/[id]/edit.js](pages/dashboard/evenements/[id]/edit.js) - Guards d'accès
2. [pages/dashboard/evenements/[id]/photos.js](pages/dashboard/evenements/[id]/photos.js) - Guards photos
3. [pages/dashboard/index.js](pages/dashboard/index.js) - Correction nom table
4. [pages/evenements/[slug].js](pages/evenements/[slug].js) - Correction nom table

### Backend (2 fichiers)
5. [pages/api/signups.js](pages/api/signups.js) - Correction nom table
6. [pages/api/campaigns/send.js](pages/api/campaigns/send.js) - Correction nom table

### Supabase (2 fichiers)
7. [supabase/migrations/0013_secretaires_full_edit.sql](supabase/migrations/0013_secretaires_full_edit.sql) - Nouvelle migration
8. [scripts/apply-migration-0013.js](scripts/apply-migration-0013.js) - Script d'application

---

## 🚀 Déploiement

### Étape 1 : Appliquer la migration Supabase

**Option A - Via SQL Editor (recommandé)** :
1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard/project/_/sql/new)
2. Copier le contenu de `supabase/migrations/0013_secretaires_full_edit.sql`
3. Exécuter le SQL
4. Vérifier : `SELECT policyname FROM pg_policies WHERE tablename = 'events'`

**Option B - Via script** :
```bash
node scripts/apply-migration-0013.js
```

### Étape 2 : Déployer le code

```bash
# Build local (optionnel)
npm run build

# Push vers GitHub (déploiement automatique Vercel)
git add .
git commit -m "fix: autoriser secrétaires à éditer tous les événements + correction volunteer_signups"
git push origin main
```

---

## 🧪 Tests à effectuer

### Test 1 : Secrétaire peut éditer un événement publié
1. Se connecter avec un compte `secretaire` ou `vice_secretaire`
2. Aller sur Dashboard → Événements
3. Cliquer sur "Modifier" un événement publié
4. ✅ Vérifier l'accès à la page d'édition (pas de "Vous n'avez pas accès")
5. ✅ Modifier un champ et enregistrer
6. ✅ Vérifier que la modification est sauvegardée

### Test 2 : Secrétaire peut gérer les photos
1. Sur un événement publié, aller dans "Photos"
2. ✅ Uploader une nouvelle photo
3. ✅ Définir une photo comme couverture
4. ✅ Supprimer une photo

### Test 3 : Plus d'erreur 404 volunteer_signups
1. Ouvrir la console navigateur (F12)
2. Aller sur le Dashboard
3. ✅ Vérifier qu'il n'y a pas de `404 /rest/v1/volunteer_signups`
4. ✅ Les statistiques de bénévoles s'affichent correctement

---

## 📊 Matrice des permissions (après correction)

| Rôle | Créer événement | Éditer draft | Éditer publié | Publier | Supprimer |
|------|----------------|--------------|---------------|---------|-----------|
| **secretaire** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **vice_secretaire** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **president** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **vice_president** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **JETC Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔍 Vérification RLS Supabase

Pour vérifier que les policies sont correctement configurées :

```sql
-- Lister toutes les policies sur la table events
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;
```

**Policies attendues** :
- `events_all_president` (FOR ALL) - Président/Vice + JETC Admin
- `events_insert_secretaire` (FOR INSERT) - Secrétaires créent en draft
- `events_update_managers` (FOR UPDATE) - **NOUVEAU** - Tous les gestionnaires
- `events_select_public` (FOR SELECT) - Public voit les événements publiés

---

## ⚠️ Notes importantes

- **Aucune régression** : Les présidents gardent tous leurs droits (suppression incluse)
- **Secrétaires ne peuvent pas supprimer** : Seuls président/vice-président/JETC Admin
- **Cohérence** : Frontend et backend alignés sur les mêmes règles
- **Table signups** : Le nom correct est `signups`, pas `volunteer_signups`

---

## ✅ Checklist finale

- [x] Guards frontend mis à jour (edit.js, photos.js)
- [x] Migration RLS créée (0013_secretaires_full_edit.sql)
- [x] Erreur volunteer_signups corrigée (4 fichiers)
- [x] Build Next.js réussi (aucune erreur)
- [x] Documentation complète créée
- [ ] Migration Supabase appliquée (manuel)
- [ ] Code déployé sur Vercel
- [ ] Tests effectués avec compte secrétaire

---

**Prêt à déployer ! 🚀**
