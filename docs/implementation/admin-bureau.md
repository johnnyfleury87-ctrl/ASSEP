# Admin - Gestion du Bureau

## 🎯 Objectif fonctionnel

Permet aux **Président** et **Vice-Président** de gérer l'affichage des membres du bureau sur la page d'accueil publique. Cette page permet de créer, modifier, supprimer et réordonner les cartes de présentation du bureau (avec titre, nom, photo, ordre d'affichage).

## 📄 Tables Supabase utilisées

### `public.bureau_members`
- **Colonnes utilisées:**
  - `id` (UUID, PK)
  - `profile_id` (UUID, FK vers profiles - optionnel)
  - `role` (TEXT) - président, vice_president, tresorier, etc.
  - `name` (TEXT) - nom à afficher
  - `bio` (TEXT) - description/biographie
  - `photo_url` (TEXT) - URL de la photo
  - `email` (TEXT) - email public
  - `phone` (TEXT) - téléphone public
  - `display_order` (INTEGER) - ordre d'affichage
  - `is_active` (BOOLEAN) - visible ou non
  - `created_at`, `updated_at`

### `public.profiles` (indirectement)
- Utilisée pour vérifier le rôle de l'utilisateur connecté (`president` ou `vice_president`)

## 🔐 Règles d'accès / rôles requis

### Lecture (GET)
- **Public (anon)**: peut lire uniquement les membres avec `is_active = true`
- **Authentifié**: peut lire tous les membres

### Écriture (POST, PUT, DELETE)
- **Président** (`president`)
- **Vice-Président** (`vice_president`)
- **JETC Admin** (`is_jetc_admin = true`)

### RLS (Row Level Security)
- ✅ **RLS activé** sur `bureau_members`
- Policy `bureau_members_select_public`: lecture publique si `is_active = true`
- Policy `bureau_members_all_admin`: écriture réservée admin (président/vice/JETC)

## 🔁 Endpoints API utilisés ou à créer

### ✅ Existant : `/api/admin/bureau`

#### GET `/api/admin/bureau`
- **Auth**: Aucune auth requise pour GET
- **Retourne**: Liste de tous les membres du bureau triés par `sort_order`
- **Réponse**:
```json
{
  "members": [
    {
      "id": "uuid",
      "role": "president",
      "name": "Jean Dupont",
      "photo_url": "...",
      "display_order": 1,
      "is_active": true
    }
  ]
}
```

#### POST `/api/admin/bureau`
- **Auth**: Token JWT (président/vice/JETC)
- **Body**:
```json
{
  "title": "Président",
  "name": "Jean Dupont",
  "photoUrl": "https://...",
  "sortOrder": 1,
  "isVisible": true
}
```
- **Retourne**: `{ member: {...} }`

#### PUT `/api/admin/bureau`
- **Auth**: Token JWT (président/vice/JETC)
- **Body**:
```json
{
  "id": "uuid",
  "title": "Président",
  "name": "Jean Dupont",
  "photoUrl": "https://...",
  "sortOrder": 1,
  "isVisible": true
}
```
- **Retourne**: `{ member: {...} }`

#### DELETE `/api/admin/bureau`
- **Auth**: Token JWT (président/vice/JETC)
- **Body**:
```json
{
  "id": "uuid"
}
```
- **Retourne**: `{ success: true }`

## 🧩 Composants UI nécessaires

### ✅ Existants

**Page:** `/pages/dashboard/bureau.js`
- Affiche la liste des membres
- Affiche un bandeau d'avertissement "Fonctionnalité à implémenter"
- Utilise `supabase.from('bureau_members')` côté client (READ-ONLY)

### ❌ À créer

1. **Formulaire de création/édition de membre du bureau**
   - Champs: titre, nom, photo (upload ou URL), ordre d'affichage, visible (checkbox)
   - Validation: titre obligatoire
   - Appel POST ou PUT selon le mode

2. **Liste interactive des membres avec actions**
   - Bouton "Ajouter un membre"
   - Pour chaque membre:
     - Bouton "Éditer" (ouvre formulaire en mode édition)
     - Bouton "Supprimer" (avec confirmation)
     - Drag & drop pour réordonner (modifier `display_order`)
   - Preview de la carte (comme sur le site public)

3. **Upload de photo**
   - Soit upload vers Supabase Storage (`/bureau-photos`)
   - Soit input URL direct

4. **Composant de confirmation de suppression**
   - Modal "Êtes-vous sûr de supprimer [nom]?"

## ⚠️ Points bloquants ou manquants identifiés

### 🟡 Incohérences schema

**Migration 0001** définit:
- Colonne `title` (TEXT NOT NULL)
- Colonne `sort_order` (INTEGER DEFAULT 100)
- Colonne `is_visible` (BOOLEAN DEFAULT true)

**API `/api/admin/bureau`** utilise:
- `sort_order` (OK, cohérent)
- Mais UI actuelle lit directement depuis Supabase client (bypass API)

### 🔴 Bloquants

1. **Page UI non fonctionnelle**
   - `/pages/dashboard/bureau.js` affiche un bandeau "à implémenter"
   - Aucun formulaire CRUD implémenté
   - Lecture directe DB (pas via API) → incohérent avec pattern du projet

2. **Gestion des photos non définie**
   - Pas de bucket Supabase Storage configuré pour photos bureau
   - Alternative: permettre URL externe (plus simple pour MVP)

3. **Aucune gestion d'erreur côté UI**
   - Pas de `loading` state lors des appels API
   - Pas de `error` state si API échoue
   - Pas de notification de succès après action

### ✅ Points positifs

- API complète et fonctionnelle (GET, POST, PUT, DELETE)
- RLS correctement configuré
- Migration schema cohérente
- Permissions vérifiées côté API

## 📝 Plan d'implémentation recommandé

### Phase 1 : Composant formulaire
1. Créer `components/BureauMemberForm.js`
   - Props: `member` (null ou objet), `onSubmit`, `onCancel`
   - Mode création si `member = null`
   - Mode édition si `member` existe
   - Validation côté client

### Phase 2 : Intégration dans la page
1. Modifier `/pages/dashboard/bureau.js`:
   - Ajouter état `editingMember`, `showForm`, `loading`, `error`
   - Implémenter `handleCreate()`, `handleUpdate()`, `handleDelete()`
   - Appeler les endpoints API avec token JWT
   - Gérer loading/error states

### Phase 3 : Réordonnancement
1. Ajouter bibliothèque drag & drop (ex: `react-beautiful-dnd` ou `@dnd-kit/core`)
2. Permettre réordonnancement visuel
3. Appel API PUT pour chaque membre avec nouveau `display_order`

### Phase 4 : Upload photo (optionnel)
1. Créer bucket Supabase Storage `bureau-photos`
2. Policy : président/vice/JETC peuvent upload
3. Intégrer input file dans formulaire
4. Upload puis récupérer URL publique

---

**État actuel:** 🟡 Partiellement implémenté (API OK, UI manquante)

**Prochaine étape:** Créer le formulaire CRUD + intégrer dans la page
