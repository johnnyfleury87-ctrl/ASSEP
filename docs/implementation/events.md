# 📋 Documentation : Système de Gestion des Événements

**Date :** 27 janvier 2026  
**Auteur :** Analyse des migrations existantes  
**Statut :** ✅ VALIDÉ - Implémentation autorisée (migrations uniquement)

---

## 🎯 Vue d'ensemble

Ce document décrit l'architecture complète du système de gestion des événements ASSEP, basé sur l'analyse des migrations Supabase existantes.

**Workflow en base de données :** `draft` → `pending_approval` → `published` → `closed` → `archived`

**Workflow UI MVP (simplifié) :** `draft` → `published` → `archived`

> ⚠️ **Note MVP :** Le statut `pending_approval` existe en base mais n'est PAS utilisé dans l'interface MVP. Le workflow de validation sera implémenté dans une version ultérieure.

---

## 📊 Schéma de Base de Données

### Table : `public.events`

**Migration source :** `0002_events.sql`

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `name` | TEXT | NOT NULL | Nom de l'événement |
| `slug` | TEXT | UNIQUE NOT NULL | URL-friendly identifier |
| `description` | TEXT | NULL | Description détaillée |
| `event_date` | TIMESTAMPTZ | NOT NULL | Date/heure de l'événement |
| `location` | TEXT | NOT NULL | Lieu de l'événement |
| `max_participants` | INTEGER | NULL | Capacité maximale |
| `registration_deadline` | TIMESTAMPTZ | NULL | Date limite d'inscription |
| `status` | TEXT | NOT NULL, DEFAULT 'draft' | Statut workflow |
| `approved_by` | UUID | FK → profiles(id) | Qui a validé |
| `approved_at` | TIMESTAMPTZ | NULL | Quand validé |
| `created_by` | UUID | FK → profiles(id), NOT NULL | Créateur |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Dernière MAJ |

**Contrainte CHECK sur `status` :**
```sql
CHECK (status IN ('draft', 'pending_approval', 'published', 'closed', 'archived'))
```

**Index existants :**
- `idx_events_status` sur `status`
- `idx_events_slug` sur `slug`
- `idx_events_date` sur `event_date`
- `idx_events_created_by` sur `created_by`
- `idx_events_approved_by` sur `approved_by`

---

### Table : `public.event_shifts`

**Migration source :** `0002_events.sql`

Créneaux de bénévolat pour un événement.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant |
| `event_id` | UUID | FK → events(id) CASCADE | Événement parent |
| `name` | TEXT | NOT NULL | Nom du créneau |
| `description` | TEXT | NULL | Description |
| `start_time` | TIMESTAMPTZ | NOT NULL | Début |
| `end_time` | TIMESTAMPTZ | NOT NULL | Fin |
| `max_volunteers` | INTEGER | NOT NULL, DEFAULT 1 | Places disponibles |
| `current_volunteers` | INTEGER | NOT NULL, DEFAULT 0 | Places occupées |
| `created_at` | TIMESTAMPTZ | NOT NULL | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Dernière MAJ |

**Contraintes :**
- `CHECK (end_time > start_time)`
- `CHECK (current_volunteers <= max_volunteers)`

---

### Table : `public.event_volunteers`

**Migration source :** `0002_events.sql`

Assignations des bénévoles aux créneaux.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant |
| `event_id` | UUID | FK → events(id) CASCADE | Événement |
| `shift_id` | UUID | FK → event_shifts(id) CASCADE | Créneau (optionnel) |
| `profile_id` | UUID | FK → profiles(id) CASCADE | Bénévole |
| `status` | TEXT | NOT NULL, DEFAULT 'confirmed' | Statut |
| `notes` | TEXT | NULL | Notes |
| `created_at` | TIMESTAMPTZ | NOT NULL | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Dernière MAJ |

**Contraintes :**
- `UNIQUE(shift_id, profile_id)` - Un bénévole par créneau maximum
- `CHECK (status IN ('confirmed', 'cancelled', 'completed'))`

---

### Table : `public.event_tasks`

**Migration source :** `0002_events.sql`

Tâches à réaliser pour un événement (préparation, logistique).

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant |
| `event_id` | UUID | FK → events(id) CASCADE | Événement |
| `name` | TEXT | NOT NULL | Nom de la tâche |
| `description` | TEXT | NULL | Description |
| `assigned_to` | UUID | FK → profiles(id) | Assigné à |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | Statut |
| `due_date` | TIMESTAMPTZ | NULL | Date limite |
| `completed_at` | TIMESTAMPTZ | NULL | Date complétion |
| `created_at` | TIMESTAMPTZ | NOT NULL | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Dernière MAJ |

**Contrainte CHECK sur `status` :**
```sql
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
```

---

### Table : `public.signups`

**Migration source :** `0003_signups.sql`

Inscriptions des participants externes aux événements.

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant |
| `event_id` | UUID | FK → events(id) CASCADE | Événement |
| `first_name` | TEXT | NOT NULL | Prénom |
| `last_name` | TEXT | NOT NULL | Nom |
| `email` | TEXT | NOT NULL | Email |
| `phone` | TEXT | NULL | Téléphone |
| `date_of_birth` | DATE | NULL | Date de naissance |
| `emergency_contact` | TEXT | NULL | Contact d'urgence |
| `emergency_phone` | TEXT | NULL | Tel urgence |
| `medical_info` | TEXT | NULL | Infos médicales |
| `status` | TEXT | NOT NULL, DEFAULT 'pending' | Statut |
| `payment_status` | TEXT | NOT NULL, DEFAULT 'pending' | Paiement |
| `payment_amount` | DECIMAL(10,2) | NULL | Montant |
| `payment_method` | TEXT | NULL | Méthode paiement |
| `comms_opt_in` | BOOLEAN | NOT NULL, DEFAULT false | Opt-in comm |
| `created_at` | TIMESTAMPTZ | NOT NULL | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Dernière MAJ |

---

## 🔒 Politiques RLS (Row Level Security)

**Migration source :** `0006_rls_policies.sql`

### Événements (`public.events`)

#### 1. `events_select_public`
```sql
-- Public peut voir UNIQUEMENT les événements publiés
FOR SELECT TO anon, authenticated
USING (status = 'published')
```

#### 2. `events_select_authenticated_all`
```sql
-- Gestionnaires d'événements peuvent voir TOUS les événements
FOR SELECT TO authenticated
USING (
  is_jetc_admin() 
  OR is_president_or_vice()
  OR can_manage_events()
)
```

#### 3. `events_insert_secretaire`
```sql
-- Secrétaires/Vice peuvent créer des événements en draft/pending_approval
FOR INSERT TO authenticated
WITH CHECK (
  can_manage_events()
  AND (status = 'draft' OR status = 'pending_approval')
)
```

#### 4. `events_update_secretaire`
```sql
-- Secrétaires/Vice peuvent éditer LEURS événements en draft/pending_approval
FOR UPDATE TO authenticated
USING (
  can_manage_events()
  AND created_by = auth.uid()
  AND status IN ('draft', 'pending_approval')
)
WITH CHECK (
  can_manage_events()
  AND created_by = auth.uid()
)
```

#### 5. `events_all_president`
```sql
-- Président/Vice/JETC admin peuvent TOUT faire
FOR ALL TO authenticated
USING (is_jetc_admin() OR is_president_or_vice())
WITH CHECK (is_jetc_admin() OR is_president_or_vice())
```

### Créneaux bénévoles (`public.event_shifts`)

- **Public :** Peut voir les shifts des événements `published`
- **Gestionnaires :** Peuvent créer/modifier tous les shifts

### Bénévoles (`public.event_volunteers`)

- **Membres authentifiés :** Peuvent voir les bénévoles des événements `published`
- **Gestionnaires :** Peuvent assigner/modifier/supprimer des bénévoles

### Inscriptions (`public.signups`)

- **Public (anon/authenticated) :** Peut créer des inscriptions **SI** événement publié **ET** inscriptions activées
- **Gestionnaires :** Peuvent voir et modifier toutes les inscriptions

⚠️ **Configuration des inscriptions :**

Les inscriptions participants sont **conditionnées** par un flag sur l'événement.

**Nouveau champ requis dans `public.events` :**
- `signups_enabled` (BOOLEAN, DEFAULT false)

**Logique :**
- Si `signups_enabled = false` → Aucun formulaire d'inscription affiché
- Si `signups_enabled = true` ET `status = 'published'` → Formulaire visible et actif
- Si événement non publié → Pas d'inscription possible (RLS bloque)

---

## 🛠 Fonctions Helper

**Migration source :** `0008_admin_helpers.sql`

### `approve_event(p_event_id, p_approved_by)`

**Rôle :** Publier un événement (président/vice uniquement)

**Comportement :**
1. Vérifie que `p_approved_by` est président/vice-président
2. Met à jour :
   - `status` → `'published'`
   - `approved_by` → `p_approved_by`
   - `approved_at` → `NOW()`
3. Erreur si événement introuvable

---

### `reject_event(p_event_id, p_rejected_by)`

**Rôle :** Retourner un événement en brouillon

**Comportement :**
1. Vérifie que `p_rejected_by` est président/vice-président
2. Met à jour :
   - `status` → `'draft'`
   - `approved_by` → `NULL`
   - `approved_at` → `NULL`
3. Erreur si événement introuvable

---

## 📐 Logique Métier : Workflow de Publication

### Statuts disponibles

| Statut | Description | Visible public | Inscriptions | Modifiable | UI MVP |
|--------|-------------|----------------|--------------|------------|---------|
| `draft` | Brouillon | ❌ Non | ❌ Non | ✅ Oui (créateur) | ✅ Visible |
| `pending_approval` | En attente validation | ❌ Non | ❌ Non | ⚠️ Oui (créateur) | ❌ Caché (hors MVP) |
| `published` | Publié | ✅ Oui | ✅ Oui (si activé) | ⚠️ Limité* | ✅ Visible |
| `closed` | Clôturé | ✅ Oui | ❌ Non | ⚠️ Président/Vice | ❌ Caché (hors MVP) |
| `archived` | Archivé | ❌ Non | ❌ Non | ⚠️ Président/Vice | ✅ Visible |

*Limité : Retour en `draft` obligatoire pour modifier buvette/produits

---

### Règles de transition (UI MVP)

```
┌─────────┐
│  draft  │ ← État initial
└────┬────┘
     │
     │ Bouton "Publier l'événement" (Président/Vice)
     ▼
┌───────────┐
│ published │
└────┬──────┘
     │
     ├─► Événement passé + archivage manuel ──► archived
     │
     └─► Retour en draft (exceptionnel) ──────► draft
```

**Transitions MVP autorisées :**

1. **Draft → Published :** Président/Vice publie directement (bouton unique)
2. **Published → Draft :** Président/Vice dépublie (pour correction majeure)
3. **Published → Archived :** Après événement terminé
4. **Archived → Published :** Réactivation (exceptionnel)

> ⚠️ **Note :** Le workflow complet avec `pending_approval` et `closed` sera activé post-MVP

---

### Workflow attendu (UX MVP)

#### Création d'un événement (Secrétaire/Vice/Président)

1. Bouton "Créer un événement"
2. Formulaire avec :
   - Nom, Description, Lieu, Date
   - Buvette active (oui/non)
   - Inscriptions publiques activées (oui/non) ⚠️ **NOUVEAU**
   - ⚠️ **Statut par défaut : `draft`**
3. Enregistrement → Événement en brouillon
4. **Pas d'affichage public**

#### Édition en brouillon

- Créateur peut modifier tous les champs
- Gérer produits buvette (si activée)
- Uploader photos
- Configurer créneaux bénévoles
- Possibilité de supprimer

#### Publication directe (Président/Vice - MVP)

- Bouton unique "Publier l'événement"
- Passe directement de `draft` → `published`
- Événement devient visible publiquement
- ⚠️ **Buvette figée** (produits non modifiables sans retour draft)

#### Événement publié

- Visible sur `/evenements`
- Inscriptions activées (si configuré)
- Buvette visible (si activée)
- Photos visibles publiquement
- **Modification limitée** :
  - Informations générales : OK
  - Buvette/produits : ❌ Nécessite retour en `draft`
  - Photos : OK (ajout uniquement)

#### Post-événement

- Président/Vice peut archiver manuellement
- `published` → `archived`
- Événement disparaît du public

---

## 🚨 Règles d'Affichage Public

### Page `/evenements/index.js`

**Requête actuelle (CORRECTE) :**
```javascript
const { data: upcomingEvents } = await supabase
  .from('events')
  .select('id, slug, name, description, location, event_date')
  .eq('status', 'published')  // ✅ Filtre correct
  .gte('event_date', now)
  .order('event_date', { ascending: true })
```

**Règle :** Afficher UNIQUEMENT `status = 'published'`

### Page `/evenements/[slug].js`

**Requête actuelle (CORRECTE) :**
```javascript
const { data: event } = await supabase
  .from('events')
  .select('*')
  .eq('slug', slug)
  .eq('status', 'published')  // ✅ Filtre correct
  .single()
```

### Dashboard `/dashboard/evenements`

**Requête actuelle :**
```javascript
const { data } = await supabase
  .from('events')
  .select('*')
  .order('event_date', { ascending: false })
```

**✅ Correct :** RLS applique automatiquement les filtres selon le rôle

---

## 👥 Règles Bénévoles

### Principe fondamental

**❌ Les bénévoles NE PEUVENT PAS s'inscrire librement**

**✅ Workflow :**
1. Admin/Secrétaire définit les créneaux (`event_shifts`)
2. Admin/Secrétaire assigne manuellement les bénévoles (`event_volunteers`)
3. Les bénévoles voient leurs assignations dans leur dashboard

### Tables impliquées

#### `event_shifts` (Créneaux)
- Créés par gestionnaires d'événements
- Exemple : "Buvette samedi 14h-17h", "Montage vendredi 18h-20h"

#### `event_volunteers` (Assignations)
- Créés par gestionnaires d'événements
- Lien : `profile_id` → bénévole assigné
- Statut : `confirmed`, `cancelled`, `completed`

### Affichage public

**Tant que `status ≠ 'published'` :**
- Aucun affichage des créneaux
- Aucune assignation possible

**Une fois `status = 'published'` :**
- Affichage public des créneaux (optionnel)
- Assignation manuelle par admin uniquement

---

## 🍺 Fonctionnalité : Buvette

### ⚠️ État actuel : NON IMPLÉMENTÉ

**Champs à ajouter dans `public.events` :**

| Colonne | Type | Description |
|---------|------|-------------|
| `buvette_active` | BOOLEAN | DEFAULT false - Active la buvette |

**Nouvelle table à créer : `public.event_products`**

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant |
| `event_id` | UUID | FK → events(id) CASCADE | Événement |
| `name` | TEXT | NOT NULL | Nom produit |
| `price` | DECIMAL(10,2) | NOT NULL | Prix CHF |
| `category` | TEXT | NULL | Catégorie (boisson, nourriture, etc.) |
| `stock` | INTEGER | NULL | Stock disponible |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Produit actif |
| `created_at` | TIMESTAMPTZ | NOT NULL | Date création |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Dernière MAJ |

**Logique :**
- Si `buvette_active = false` → Aucun affichage
- Si `buvette_active = true` → Affichage liste produits
- ✅ Éditable tant que `status = 'draft'`
- ❌ **Figé après publication** (`status = 'published'`)
- ⚠️ **Modification après publication** : OBLIGATOIRE de repasser en `draft`

**Règles de modification :**

| Statut événement | Ajouter produit | Modifier produit | Supprimer produit |
|------------------|----------------|------------------|-------------------|
| `draft` | ✅ Oui | ✅ Oui | ✅ Oui |
| `published` | ❌ Non | ❌ Non | ❌ Non |
| `archived` | ❌ Non | ❌ Non | ❌ Non |

**Pour modifier buvette d'un événement publié :**
1. Président/Vice repasse événement en `draft`
2. Modifications apportées
3. Republication

---

## 📸 Fonctionnalité : Photos

### ⚠️ État actuel : NON IMPLÉMENTÉ

**Nouvelle table à créer : `public.event_photos`**

| Colonne | Type | Contraintes | Description |
|---------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Identifiant |
| `event_id` | UUID | FK → events(id) CASCADE | Événement |
| `storage_path` | TEXT | NOT NULL | Chemin dans Supabase Storage |
| `caption` | TEXT | NULL | Légende |
| `is_cover` | BOOLEAN | NOT NULL, DEFAULT false | Photo de couverture |
| `display_order` | INTEGER | NOT NULL, DEFAULT 0 | Ordre d'affichage |
| `uploaded_by` | UUID | FK → profiles(id) | Qui a uploadé |
| `created_at` | TIMESTAMPTZ | NOT NULL | Date upload |

**Contrainte UNIQUE :** Un seul `is_cover = true` par `event_id`

**Supabase Storage Bucket :** `event-photos`

**Règles RLS Storage :**
- **Upload :** Gestionnaires d'événements uniquement
- **View :** Public si événement `published`

**Limites techniques :**

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| **Nombre max par événement** | 20 photos | Performance + UX galerie |
| **Taille max par fichier** | 5 MB | Performance upload |
| **Formats acceptés** | JPG, PNG, WEBP | Compatibilité web |
| **Photo de couverture** | 1 obligatoire | Affichage liste événements |

**Logique :**
- Photos uploadées dans Storage
- Référence dans table
- Visibles publiquement UNIQUEMENT si `event.status = 'published'`
- **Photo de couverture** : Affichée en miniature sur liste `/evenements`
- **Galerie complète** : Visible sur page détail événement

**Règles d'édition :**

| Statut événement | Uploader photo | Supprimer photo | Changer cover |
|------------------|---------------|-----------------|---------------|
| `draft` | ✅ Oui | ✅ Oui | ✅ Oui |
| `published` | ✅ Oui | ⚠️ Président/Vice | ⚠️ Président/Vice |
| `archived` | ❌ Non | ❌ Non | ❌ Non |

**Note :** Ajout de photos autorisé même après publication (ex: photos prises pendant événement)

---

## 📋 Checklist Implémentation

### ✅ Déjà en place (migrations existantes)

- [x] Table `events` avec workflow statuts
- [x] Table `event_shifts` (créneaux bénévoles)
- [x] Table `event_volunteers` (assignations)
- [x] Table `event_tasks` (tâches)
- [x] Table `signups` (inscriptions participants)
- [x] RLS policies correctes
- [x] Fonctions `approve_event()` et `reject_event()`
- [x] Affichage public filtré sur `published` ✅

### ❌ À implémenter

#### 1. Migration 0011 : Buvette + Inscriptions
- [ ] Ajout colonne `buvette_active` dans `events`
- [ ] Ajout colonne `signups_enabled` dans `events`
- [ ] Création table `event_products`
- [ ] RLS policies pour `event_products`
- [ ] Trigger pour empêcher modification produits si `status = 'published'`

#### 2. Migration 0012 : Photos
- [ ] Création table `event_photos`
- [ ] Contrainte UNIQUE pour `is_cover = true` par événement
- [ ] Création Storage bucket `event-photos`
- [ ] RLS policies Storage
- [ ] Politique suppression photos (président/vice seulement si published)

#### 3. UX Dashboard (APRÈS validation migrations)
- [ ] Page édition événement (`/dashboard/evenements/[id]/edit`)
- [ ] Toggle "Activer buvette"
- [ ] Toggle "Activer inscriptions"
- [ ] Interface gestion produits buvette
- [ ] Upload photos avec sélection cover
- [ ] Bouton "Publier" (président/vice uniquement)
- [ ] Bouton "Retour en brouillon" (pour modifier buvette)
- [ ] Indication claire du statut dans l'interface
- [ ] Gestion manuelle bénévoles améliorée

#### 4. Workflow complet
- [ ] Empêcher modification buvette/produits si `status = 'published'` (validation côté API)
- [ ] Message d'avertissement "Retour en brouillon requis pour modifier buvette"
- [ ] ~~Notifications~~ (HORS SCOPE MVP)

---

## 🔐 Permissions par Rôle

| Rôle | Créer événement | Éditer ses événements | Éditer tous événements | Publier | Assigner bénévoles |
|------|----------------|---------------------|----------------------|---------|-------------------|
| **JETC Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Président** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Vice-Président** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Secrétaire** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Vice-Secrétaire** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Trésorier** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Membre** | ❌ | ❌ | ❌ | ❌ | ❌ |

**Fonction helper associée :** `can_manage_events()`

```sql
CREATE OR REPLACE FUNCTION public.can_manage_events()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (
      is_jetc_admin = true
      OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 Objectifs Finaux

### Simplicité

- Interface intuitive pour créer un événement
- Workflow clair (draft → validation → publication)
- Pas de confusion sur qui peut faire quoi

### Clarté

- Statut toujours visible
- Indication claire si événement publié ou non
- Boutons contextuels selon le rôle

### Propreté

- Seuls les événements `published` apparaissent publiquement
- Pas de fuite d'information sur les brouillons
- RLS bien configuré

### Cohérence

- Toutes les migrations existantes respectées
- Pas de code dupliqué
- Logique centralisée dans les policies RLS

---

## 📌 Prochaines Étapes AUTORISÉES

### Phase 1 : Migrations (EN COURS - AUTORISÉ ✅)

1. **Créer `0011_events_buvette.sql`**
   - Ajout colonnes `buvette_active` et `signups_enabled` dans `events`
   - Création table `event_products`
   - RLS policies
   - Triggers validation statut

2. **Créer `0012_events_photos.sql`**
   - Création table `event_photos`
   - Contraintes `is_cover` unique
   - RLS policies
   - Storage bucket configuration

### Phase 2 : UI Dashboard (APRÈS validation migrations ⏸️)

3. **Page édition événement**
4. **Gestion buvette/photos**
5. **Workflow publication simplifié MVP**

### Phase 3 : Hors Scope MVP

- ❌ Notifications (validé hors scope)
- ❌ Workflow `pending_approval` dans l'UI
- ❌ Statut `closed`

---

## 📝 Notes de Validation

### ✅ Validations appliquées (27 janvier 2026)

1. **UI MVP simplifiée** : Workflow base complet conservé, UI montre uniquement draft → published → archived
2. **Signups conditionnés** : Flag `signups_enabled` requis (ajouté à migration 0011)
3. **Buvette figée** : Modification impossible si `status = 'published'` sans retour `draft`
4. **Photos limitées** : Max 20, 5MB, formats JPG/PNG/WEBP, 1 cover obligatoire
5. **Notifications** : Hors scope MVP - À documenter plus tard

### ⚠️ Ordre d'implémentation STRICT

1. ✅ Migrations 0011 et 0012 **AUTORISÉES**
2. ⏸️ UI Dashboard **BLOQUÉE** jusqu'à validation des migrations
3. ❌ Notifications **HORS SCOPE**

---

## 📝 Notes Importantes

### ✅ Document VALIDÉ - Implémentation autorisée (migrations uniquement)

Les migrations `0011_events_buvette.sql` et `0012_events_photos.sql` peuvent être créées.

**Aucune UI ne doit être codée avant validation explicite des migrations.**

### ⚠️ Respecter les migrations existantes

Ne jamais modifier directement une migration déjà appliquée. Toujours créer une nouvelle migration pour ajouter/modifier des éléments.

### ⚠️ Tester les RLS

Toujours tester les policies RLS avec différents rôles :
```sql
-- Tester en tant que secrétaire
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claim.sub = '<uuid-secretaire>';

-- Tester visibilité publique
SET LOCAL role = anon;
```

### 🚫 Hors Scope MVP

- Workflow `pending_approval` dans l'UI
- Statut `closed`
- Notifications automatiques
- Page validation président dédiée

Ces fonctionnalités existent en base mais ne seront pas implémentées dans l'interface MVP.

---

**Fin du document - ✅ VALIDÉ AVEC AJUSTEMENTS - Migrations autorisées**
