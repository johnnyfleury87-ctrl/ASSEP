# Système de Gestion des Événements - Documentation Complète

Date : 2026-01-27
Statut : ✅ Implémentation complète

## 📋 Vue d'ensemble

Système complet de gestion d'événements avec workflow draft → published → archived, incluant :
- ✅ Création et édition d'événements
- ✅ Workflow de publication avec contrôle des permissions
- ✅ Buvette (gestion des produits) avec verrouillage en mode publié
- ✅ Galerie photos (max 20, photo de couverture obligatoire)
- ✅ Inscriptions contrôlées par flag `signups_enabled`
- ✅ Affichage public avec photos de couverture

## 🗄️ Structure de la base de données

### Migrations appliquées

1. **0011_events_buvette.sql** - Buvette et inscriptions
   - Ajout colonnes `buvette_active`, `signups_enabled` sur `events`
   - Table `event_products` (name, price, category, stock, is_active)
   - Trigger **prevent_product_modification_if_published()** bloque INSERT/UPDATE/DELETE si status='published'
   - RLS policies pour gestionnaires uniquement

2. **0012_events_photos.sql** - Galerie photos
   - Table `event_photos` (caption, storage_path, is_cover, display_order)
   - Contrainte UNIQUE sur is_cover par event_id (1 seule photo de couverture)
   - Trigger **check_event_photos_limit()** limite à 20 photos max par événement
   - Trigger **check_photo_modification_permissions()** protège photo de couverture si publié
   - Storage bucket 'event-photos' (à créer manuellement)

### Tables principales

```sql
events {
  id, slug, name, description, location, event_date, 
  max_participants, status (draft/published/archived),
  buvette_active, signups_enabled,
  approved_by, approved_at
}

event_products {
  id, event_id, name, price, category, stock, is_active
}

event_photos {
  id, event_id, caption, storage_path, is_cover, display_order
}
```

## 🔐 Règles de sécurité

### Workflow de publication

1. **Brouillon (draft)** :
   - Modification libre des infos de base
   - Ajout/modification/suppression produits buvette ✅
   - Ajout/modification/suppression photos ✅
   - Changement photo de couverture ✅

2. **Publié (published)** :
   - Modification infos de base possible (attention, visible publiquement)
   - Produits buvette **VERROUILLÉS** (trigger bloque avec message)
   - Photos : ajout/suppression OK, changement couverture **BLOQUÉ** (trigger)
   - Pour modifier produits → Repasser en brouillon

3. **Archivé (archived)** :
   - Lecture seule
   - Visible en historique public

### Permissions

- **Gestionnaires** : CRUD complet sur tout
- **Public** : Lecture seule des événements `status='published'`

## 🎨 Pages implémentées

### Espace Admin

#### 1. Liste événements `/dashboard/evenements`
**Fichier** : [pages/dashboard/evenements/index.js](pages/dashboard/evenements/index.js)

Affichage :
- Badge statut coloré (brouillon/publié/archivé)
- Badge 🍺 si buvette active
- Badge 📝 si inscriptions actives
- Boutons : ✏️ Modifier | 🍺 Produits | 📸 Photos

#### 2. Créer événement `/dashboard/evenements/new`
**Fichier** : [pages/dashboard/evenements/new.js](pages/dashboard/evenements/new.js)

Formulaire :
- Infos de base (nom, description, lieu, date, max participants)
- Toggle 🍺 Buvette active
- Toggle 📝 Inscriptions actives
- Création avec status='draft' par défaut

#### 3. Éditer événement `/dashboard/evenements/[id]/edit`
**Fichier** : [pages/dashboard/evenements/[id]/edit.js](pages/dashboard/evenements/[id]/edit.js)

Fonctionnalités :
- Formulaire édition infos de base
- Bouton **Publier** (passe status='published', enregistre approved_by/approved_at)
- Bouton **Repasser en brouillon** (si publié, permet de modifier produits)
- Bouton **Archiver** (status='archived')
- Warning si buvette active + publié
- Liens rapides vers Produits et Photos

#### 4. Gérer produits buvette `/dashboard/evenements/[id]/produits`
**Fichier** : [pages/dashboard/evenements/[id]/produits.js](pages/dashboard/evenements/[id]/produits.js)

Fonctionnalités :
- Liste produits en table (nom, prix, catégorie, stock, statut)
- Formulaire ajout/édition
- Bouton supprimer
- **Protection** : Si événement publié → message "Impossible de modifier : l'événement est publié. Repassez-le en brouillon."

#### 5. Gérer photos `/dashboard/evenements/[id]/photos`
**Fichier** : [pages/dashboard/evenements/[id]/photos.js](pages/dashboard/evenements/[id]/photos.js)

Fonctionnalités :
- Upload fichier (jpeg/png/webp, max 5MB)
- Validation limite 20 photos
- Grid affichage avec miniatures
- Édition légende (blur sur input)
- Bouton "Définir comme couverture" (étoile ⭐)
- Suppression photo
- Ordre d'affichage (display_order)

**Protection** :
- Changement couverture bloqué si publié (trigger check_photo_modification_permissions)
- Message : "Impossible de changer la couverture pour un événement publié"

### Espace Public

#### 6. Liste événements publics `/evenements`
**Fichier** : [pages/evenements/index.js](pages/evenements/index.js)

Affichage :
- Section "À venir" (events >= aujourd'hui, published)
- Section "Événements passés" (10 derniers, published)
- **Photo de couverture** affichée dans chaque carte (si disponible)
- Layout grid avec image à gauche (250px à venir, 150px passés)
- Filtre grayscale sur photos passées

#### 7. Détail événement public `/evenements/[slug]`
**Fichier** : [pages/evenements/[slug].js](pages/evenements/[slug].js)

Affichage :
- Infos complètes événement
- Section Buvette (si buvette_active) avec liste produits
- **Galerie photos** (grid 250px, légendes, image couverture en premier)
- Formulaire inscription (si signups_enabled)

## 🔄 Workflow recommandé

### Créer et publier un événement

1. **Créer** → `/dashboard/evenements/new`
   - Remplir formulaire de base
   - Cocher "Buvette active" si besoin
   - Cocher "Inscriptions actives" si besoin
   - Sauvegarder (status='draft')

2. **Ajouter produits** → `/dashboard/evenements/[id]/produits`
   - Ajouter produits buvette un par un
   - Définir stock et prix
   - Catégorie : Boissons, Nourriture, Autre

3. **Ajouter photos** → `/dashboard/evenements/[id]/photos`
   - Upload photos (max 20, 5MB chacune)
   - Ajouter légendes
   - **Définir photo de couverture** (obligatoire avant publication recommandée)

4. **Publier** → `/dashboard/evenements/[id]/edit`
   - Vérifier toutes les infos
   - Cliquer "Publier l'événement"
   - ⚠️ **Attention** : produits verrouillés, couverture fixée

5. **Si modification nécessaire**
   - Cliquer "Repasser en brouillon"
   - Modifier produits/couverture
   - Re-publier

6. **Après événement**
   - Cliquer "Archiver"
   - Reste visible en historique public

## 🚨 Points d'attention

### Configuration manuelle requise

**Storage Supabase** (à faire une seule fois) :
```
1. Dashboard Supabase → Storage → Create bucket
   - Name: event-photos
   - Public: false
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. Policies (voir migration 0012 pour SQL) :
   - event_photos_upload : gestionnaires peuvent uploader
   - event_photos_view_public : public peut voir si event publié OU user est gestionnaire
   - event_photos_delete : gestionnaires peuvent supprimer
```

### Variables d'environnement

Ajouter dans `.env.local` :
```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

### Messages utilisateurs

**Trigger produits** :
> "Cannot modify products when event is published. Set status to 'draft' first."

→ Utilisateur doit aller sur page edit, cliquer "Repasser en brouillon"

**Trigger photo couverture** :
> "Cannot change cover photo for a published event"

→ Utilisateur doit repasser en brouillon pour changer couverture

## ✅ Tests recommandés

### Test complet workflow

```sql
-- 1. Créer événement draft
INSERT INTO events (name, slug, event_date, status, buvette_active, signups_enabled)
VALUES ('Test Event', 'test-event', '2026-06-01', 'draft', true, true);

-- 2. Ajouter produits (OK en draft)
INSERT INTO event_products (event_id, name, price, category)
VALUES (1, 'Bière', 3.50, 'Boissons');

-- 3. Publier
UPDATE events SET status='published', approved_at=NOW() WHERE id=1;

-- 4. Essayer modifier produit (DOIT ÉCHOUER)
UPDATE event_products SET price=4.00 WHERE id=1;
-- ❌ ERROR: Cannot modify products when event is published

-- 5. Repasser en draft
UPDATE events SET status='draft' WHERE id=1;

-- 6. Modifier produit (OK maintenant)
UPDATE event_products SET price=4.00 WHERE id=1;
-- ✅ SUCCESS
```

### Test photos

```
1. Upload 20 photos → OK
2. Upload 21e photo → ERREUR "Cannot exceed 20 photos"
3. Définir photo 5 comme couverture → OK
4. Publier événement
5. Essayer changer couverture (photo 10) → ERREUR "Cannot change cover for published event"
6. Upload photo 21 → ERREUR (limite toujours active)
7. Supprimer une photo → OK (passe à 19)
8. Upload nouvelle photo → OK (retour à 20)
```

## 📊 Statistiques implémentation

- **Migrations** : 2 (0011, 0012)
- **Triggers** : 3 (produits, photos limite, photos couverture)
- **Tables** : 3 (events modifié, event_products, event_photos)
- **Pages admin** : 5 (list, new, edit, produits, photos)
- **Pages publiques** : 2 (list, detail)
- **RLS Policies** : 6+ (lecture/écriture par table)
- **Lignes de code** : ~2000+

## 🎯 Prochaines étapes possibles

Hors scope MVP actuel :
- Notifications email créateur quand événement approuvé
- Export liste participants CSV
- Statistiques buvette (revenus, produits populaires)
- Gestion volontaires assignés aux créneaux
- QR codes pour check-in participants
- Multi-photos de couverture (carousel)

---

**Statut final** : ✅ Système complet fonctionnel, prêt pour utilisation.
**Date de complétion** : 2026-01-27
