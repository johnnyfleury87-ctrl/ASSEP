# Admin - Gestion des Rôles

## 🎯 Objectif fonctionnel

Permet aux **Président**, **Vice-Président** et **JETC Admin** de gérer les rôles des utilisateurs de l'association. Cette page affiche la liste de tous les utilisateurs avec leur rôle actuel et permet de modifier ces rôles via un dropdown.

Les rôles disponibles sont :
- **président**
- **vice_president**
- **tresorier**
- **vice_tresorier**
- **secretaire**
- **vice_secretaire**
- **membre** (par défaut)

## 📄 Tables Supabase utilisées

### `public.profiles`
- **Colonnes utilisées:**
  - `id` (UUID, PK, FK vers auth.users)
  - `email` (TEXT UNIQUE NOT NULL)
  - `first_name` (TEXT)
  - `last_name` (TEXT)
  - `phone` (TEXT)
  - `role` (TEXT NOT NULL) - CHECK constraint avec les 7 rôles
  - `is_jetc_admin` (BOOLEAN DEFAULT false)
  - `must_change_password` (BOOLEAN DEFAULT true)
  - `created_by` (UUID FK)
  - `role_requested` (TEXT)
  - `role_approved_by` (UUID FK)
  - `role_approved_at` (TIMESTAMPTZ)
  - `comms_opt_in` (BOOLEAN DEFAULT false)
  - `created_at`, `updated_at`

### `auth.users` (indirectement)
- Table Supabase Auth liée via trigger `on_auth_user_created`

## 🔐 Règles d'accès / rôles requis

### Lecture (GET)
- **Président** (`president`)
- **Vice-Président** (`vice_president`)
- **JETC Admin** (`is_jetc_admin = true`)

### Écriture (POST - changement de rôle)
- **Président** (`president`)
- **Vice-Président** (`vice_president`)
- **JETC Admin** (`is_jetc_admin = true`)

### Règles de sécurité spécifiques
1. **Protection contre auto-dégradation président:**
   - Si l'utilisateur est président et tente de se retirer son rôle
   - API vérifie qu'il existe au moins un autre président
   - Sinon, refus avec erreur explicite

2. **Traçabilité:**
   - `role_approved_by` : ID de l'utilisateur qui a fait le changement
   - `role_approved_at` : timestamp du changement

### RLS (Row Level Security)
- ✅ **RLS activé** sur `profiles`
- Policy `profiles_select_authenticated`: tout utilisateur auth peut lire les profils
- Policy `profiles_update_own`: un user peut modifier son propre profil (mais pas son rôle)
- Policy `profiles_manage_president`: président/vice peuvent modifier les profils
- Policy `profiles_all_jetc_admin`: JETC admin peut tout faire

## 🔁 Endpoints API utilisés ou à créer

### ✅ Existant : `/api/admin/users`

#### GET `/api/admin/users`
- **Auth**: Bearer token JWT (président/vice/JETC)
- **Retourne**: Liste de tous les utilisateurs avec leurs profils
- **Réponse**:
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "jean@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "phone": "0612345678",
      "role": "president",
      "is_jetc_admin": false,
      "must_change_password": false,
      "created_at": "2026-01-20T10:00:00Z",
      "updated_at": "2026-01-26T15:30:00Z"
    }
  ]
}
```

### ✅ Existant : `/api/admin/roles`

#### POST `/api/admin/roles`
- **Auth**: Bearer token JWT (président/vice/JETC)
- **Body**:
```json
{
  "user_id": "uuid",
  "role": "tresorier"
}
```
- **Validations:**
  - `user_id` et `role` requis
  - `role` doit être parmi les 7 valeurs autorisées
  - Protection anti-auto-dégradation président
- **Retourne**:
```json
{
  "message": "Rôle mis à jour avec succès",
  "profile": {
    "id": "uuid",
    "email": "...",
    "role": "tresorier",
    ...
  }
}
```

### 🟢 Fonctions Supabase RPC disponibles

#### `change_user_role(target_user_id UUID, new_role TEXT)`
- **Fonction SQL** définie dans migration 0009
- Sécurité: vérifie que l'appelant est JETC admin
- Valide le rôle (parmi les 7 autorisés)
- Retourne JSONB avec succès/erreur
- **Note:** Actuellement, l'API `/api/admin/roles` n'utilise PAS cette fonction RPC mais fait un UPDATE direct avec service role

## 🧩 Composants UI nécessaires

### ✅ Existants

**Page:** `/pages/dashboard/admin/roles.js`
- ✅ Affiche la liste de tous les utilisateurs
- ✅ Dropdown pour changer le rôle
- ✅ Gestion des états loading/error/message
- ✅ Authentification et vérification de rôle
- ✅ Appel API `/api/admin/roles` pour changement

**États gérés:**
- `users` (array)
- `loading` (boolean)
- `updating` (user_id en cours de mise à jour)
- `message` (feedback succès)
- `error` (feedback erreur)

### ✅ Composant `Button`
- Utilisé pour soumettre les changements

### 🟢 Composant réutilisable (déjà dans le code)

**RoleSelector (inline):**
```jsx
<select 
  value={user.role}
  onChange={(e) => updateRole(user.id, e.target.value)}
  disabled={updating === user.id}
>
  {ROLES.map(r => (
    <option key={r.value} value={r.value}>{r.label}</option>
  ))}
</select>
```

## ⚠️ Points bloquants ou manquants identifiés

### 🟡 Incohérences

1. **Double mécanisme de changement de rôle:**
   - API `/api/admin/roles` fait un UPDATE direct sur `profiles` avec service role
   - Fonction RPC `change_user_role()` existe mais n'est jamais appelée
   - **Recommandation:** Unifier en utilisant soit l'API soit le RPC (pas les deux)

2. **Traçabilité incomplète dans l'API:**
   - L'API `/api/admin/roles` ne renseigne PAS `role_approved_by` ni `role_approved_at`
   - Ces champs existent dans le schema mais ne sont jamais remplis
   - **Impact:** Impossible de savoir qui a changé un rôle et quand

3. **Gestion des erreurs API:**
   - Certaines erreurs retournent du texte générique
   - Pas de codes d'erreur structurés (juste HTTP status)

### 🔴 Bloquants

**Aucun bloquant critique** - La fonctionnalité est opérationnelle

### 🟢 Points positifs

- ✅ Page UI complète et fonctionnelle
- ✅ API robuste avec validation
- ✅ RLS correctement configuré
- ✅ Protection anti-auto-dégradation président
- ✅ Loading states et feedback utilisateur
- ✅ Gestion d'erreurs côté UI

## 📝 Améliorations recommandées

### Amélioration 1 : Remplir la traçabilité
Modifier `/api/admin/roles` pour renseigner les champs audit:

```javascript
const { data: updatedProfile, error: updateError } = await supabaseServer
  .from('profiles')
  .update({ 
    role,
    role_approved_by: user.id,      // ← AJOUTER
    role_approved_at: new Date().toISOString()  // ← AJOUTER
  })
  .eq('id', user_id)
  .select()
  .single()
```

### Amélioration 2 : Afficher l'historique
Ajouter une colonne "Modifié par" dans la liste:
- Afficher qui a approuvé le rôle
- Afficher quand (format relatif: "il y a 2 jours")

### Amélioration 3 : Utiliser RPC ou API (pas les deux)
**Option A:** Garder l'API actuelle (plus simple pour Next.js)
- Supprimer la fonction RPC `change_user_role()` si non utilisée

**Option B:** Migrer vers RPC
- Modifier l'API pour appeler `supabase.rpc('change_user_role', { ... })`
- Avantage: logique métier centralisée en SQL
- Inconvénient: moins flexible (pas de validations JS custom)

### Amélioration 4 : Filtre et recherche
- Ajouter un input de recherche (email, nom)
- Filtrer par rôle (dropdown "Tous | Président | Trésorier...")
- Pagination si > 50 utilisateurs

---

**État actuel:** 🟢 Pleinement opérationnel (avec améliorations possibles)

**Prochaine étape:** Amélioration 1 (traçabilité) recommandée en priorité
