# Admin - Trésorerie

## 🎯 Objectif fonctionnel

Permet aux **Trésorier**, **Vice-Trésorier**, **Président** et **Vice-Président** de gérer la comptabilité globale de l'association.

**Fonctionnalités:**
1. **Saisir des recettes et dépenses** (globales ou liées à un événement)
2. **Consulter le solde** de l'association
3. **Filtrer les entrées** par type, période, événement
4. **Exporter en CSV** pour comptabilité externe

**Note:** Cette page gère la **trésorerie globale** (table `transactions`). Les recettes événements spécifiques (buvette) sont gérées dans `/dashboard/evenements/[id]/caisse`.

## 📄 Tables Supabase utilisées

### `public.transactions`
- **Colonnes utilisées:**
  - `id` (UUID, PK)
  - `type` (TEXT) - 'income' ou 'expense'
  - `category` (TEXT) - ex: "Subvention", "Achat matériel", "Don"
  - `amount` (DECIMAL(10,2)) - montant en euros
  - `description` (TEXT NOT NULL)
  - `transaction_date` (DATE NOT NULL)
  - `event_id` (UUID FK vers events) - optionnel, si lié à un événement
  - `recorded_by` (UUID FK vers profiles)
  - `created_at`, `updated_at`

### `public.events`
- **Utilisée pour:**
  - Jointure pour afficher le nom de l'événement lié (si `event_id` renseigné)
  - Ex: "Recette buvette - Course de Noël"

### `public.profiles`
- **Utilisée pour:**
  - Vérifier le rôle de l'utilisateur connecté
  - Renseigner `recorded_by` lors de la création

## 🔐 Règles d'accès / rôles requis

### Lecture (GET)
- **Trésorier** (`tresorier`)
- **Vice-Trésorier** (`vice_tresorier`)
- **Président** (`president`)
- **Vice-Président** (`vice_president`)
- **JETC Admin** (`is_jetc_admin = true`)

### Écriture (POST, PUT, DELETE)
- Mêmes rôles que lecture

### RLS (Row Level Security)
- ✅ **RLS activé** sur `transactions`
- Policy `transactions_select_finance`: seuls gestionnaires financiers peuvent lire
- Policy `transactions_all_finance`: seuls gestionnaires financiers peuvent écrire

### Fonction helper SQL
```sql
can_manage_finance() → BOOLEAN
```
- Vérifie si user a un rôle financier ou est président/vice/JETC

## 🔁 Endpoints API utilisés ou à créer

### ❌ Aucune API existante pour la trésorerie

**État actuel:**
- La page `/dashboard/tresorerie.js` lit directement depuis Supabase client
- Aucun endpoint API pour créer/modifier/supprimer des transactions
- Export CSV se fait côté client

### 🔴 APIs à créer

#### POST `/api/finance/transactions`
- **Auth**: Token JWT (trésorier/vice/président/vice/JETC)
- **Body**:
```json
{
  "type": "income",
  "category": "Subvention municipale",
  "amount": 500.00,
  "description": "Subvention mairie 2026",
  "transaction_date": "2026-01-15",
  "event_id": null
}
```
- **Validation:**
  - `type` requis (income/expense)
  - `amount` > 0
  - `description` requis
  - `transaction_date` requis (format ISO)
- **Retourne**:
```json
{
  "transaction": {
    "id": "uuid",
    "type": "income",
    "amount": 500.00,
    "recorded_by": "uuid-user",
    "created_at": "..."
  }
}
```

#### PUT `/api/finance/transactions`
- **Auth**: Token JWT (trésorier/vice/président/vice/JETC)
- **Body**:
```json
{
  "id": "uuid",
  "amount": 550.00,
  "description": "Subvention mairie 2026 (corrigé)"
}
```
- **Validation:** Seuls les champs modifiables peuvent être changés
- **Retourne**: transaction mise à jour

#### DELETE `/api/finance/transactions`
- **Auth**: Token JWT (trésorier/vice/président/vice/JETC)
- **Body**:
```json
{
  "id": "uuid"
}
```
- **Validation:** 
  - Vérifier que la transaction n'est pas liée à un événement clôturé (optionnel)
- **Retourne**:
```json
{
  "success": true
}
```

#### GET `/api/finance/transactions`
- **Auth**: Token JWT (trésorier/vice/président/vice/JETC)
- **Query params:**
  - `?type=income` (filtrer par type)
  - `?event_id=uuid` (filtrer par événement)
  - `?from=2026-01-01&to=2026-12-31` (filtrer par période)
- **Retourne**:
```json
{
  "transactions": [...],
  "balance": 1234.56
}
```

#### GET `/api/finance/balance`
- **Auth**: Token JWT (trésorier/vice/président/vice/JETC)
- **Calcul:** SUM(income) - SUM(expense)
- **Retourne**:
```json
{
  "balance": 1234.56,
  "total_income": 5000.00,
  "total_expense": 3765.44
}
```

## 🧩 Composants UI nécessaires

### ✅ Existants

**Page:** `/pages/dashboard/tresorerie.js`
- ✅ Affiche la liste des transactions (lecture Supabase client)
- ✅ Calcule le solde (somme côté client)
- ✅ Vérifie le rôle utilisateur
- ✅ Export CSV fonctionnel (côté client)
- ✅ Jointure avec `events` pour afficher le titre

**Affichage:**
- Badge du solde (vert si positif, rouge si négatif)
- Tableau des entrées avec: date, type, libellé, montant, événement
- Bouton "Exporter CSV"

### ❌ À créer

1. **Formulaire de saisie d'une transaction**
   - Radio: Type (Recette / Dépense)
   - Input: Catégorie (dropdown prédéfini + "Autre")
   - Input: Montant (€, validation > 0)
   - Input: Description
   - Input: Date (date picker, par défaut aujourd'hui)
   - Select: Événement lié (optionnel, liste déroulante)
   - Boutons: "Annuler" | "Enregistrer"

2. **Modal d'édition d'une transaction**
   - Pré-rempli avec données existantes
   - Même formulaire que création

3. **Bouton d'action par ligne**
   - "Éditer" (ouvre modal)
   - "Supprimer" (avec confirmation)

4. **Filtres**
   - Dropdown: Type (Tous / Recettes / Dépenses)
   - Select: Événement (Tous / [liste des événements])
   - Date range: Du ... au ...
   - Bouton "Appliquer" + "Réinitialiser"

5. **Statistiques visuelles (bonus)**
   - Graphique recettes vs dépenses par mois
   - Top 5 catégories de dépenses
   - Évolution du solde (courbe)

## ⚠️ Points bloquants ou manquants identifiés

### 🔴 Bloquants critiques

1. **Aucune API de création/modification/suppression**
   - Actuellement, impossible de créer une transaction depuis l'UI
   - La page affiche uniquement les données en lecture seule

2. **Pas de formulaire de saisie**
   - L'UI actuelle ne permet que de visualiser et exporter
   - Bandeau "Fonctionnalité à implémenter" absent (mais formulaire manquant)

3. **Lecture directe Supabase client**
   - La page lit `supabase.from('transactions')` directement
   - Pas de validation serveur
   - Risque de contournement RLS si mal configuré

### 🟡 Incohérences

1. **Nomenclature: `transactions` vs `ledger_entries`**
   - Migration 0004 crée table `public.transactions`
   - README mentionne `ledger_entries` (ancienne version du cahier des charges)
   - Code actuel utilise bien `transactions` ✅

2. **Calcul du solde côté client**
   - Le solde est recalculé à chaque chargement de page (côté client)
   - Inefficace si > 1000 transactions
   - **Recommandation:** API `/api/finance/balance` avec calcul serveur

3. **Format amount: DECIMAL vs cents**
   - Table `transactions` utilise `DECIMAL(10,2)` (ex: 123.45)
   - Autres tables du projet utilisent `amount_cents` (ex: 12345)
   - **Incohérence de design** mais pas bloquante

4. **Catégories non typées**
   - Colonne `category` est TEXT libre
   - Pas de liste prédéfinie (enum ou table de référence)
   - Risque: typos, catégories incohérentes

### 🟢 Points positifs

- ✅ Table `transactions` bien structurée
- ✅ RLS correctement configuré
- ✅ Fonction helper `can_manage_finance()` existe
- ✅ Page UI liste les données proprement
- ✅ Export CSV fonctionnel
- ✅ Jointure avec événements OK

## 📝 Plan d'implémentation recommandé

### Phase 1 : Créer les APIs (PRIORITÉ)

1. **Créer `/api/finance/transactions.js`**
   - Gérer GET, POST, PUT, DELETE
   - Vérifier auth + rôle
   - Validation inputs
   - Renseigner `recorded_by`

2. **Créer `/api/finance/balance.js`** (optionnel)
   - Calcul serveur plus performant

### Phase 2 : Créer le formulaire UI

1. **Composant `TransactionForm.js`**
   - Mode création ou édition
   - Validation côté client (montant > 0, champs requis)
   - Liste déroulante événements (charger depuis Supabase)

2. **Catégories prédéfinies** (constante JS)
```javascript
const CATEGORIES_INCOME = [
  'Subvention',
  'Don',
  'Cotisation',
  'Recette événement',
  'Autre'
]

const CATEGORIES_EXPENSE = [
  'Achat matériel',
  'Location',
  'Assurance',
  'Frais administratifs',
  'Autre'
]
```

3. **Intégrer dans `/pages/dashboard/tresorerie.js`**
   - Bouton "Nouvelle transaction"
   - Modal ou section dépliable avec formulaire
   - Actions éditer/supprimer par ligne

### Phase 3 : Améliorer l'affichage

1. **Filtres fonctionnels**
   - Appel API avec query params
   - État React pour filtres

2. **Pagination** (si > 50 transactions)
   - Infinite scroll ou pagination classique

### Phase 4 : Statistiques (bonus)

1. **Dashboard avec graphiques**
   - Bibliothèque: Chart.js ou Recharts
   - API `/api/finance/stats` avec agrégations par mois/catégorie

---

**État actuel:** 🟡 Lecture seule fonctionnelle, écriture manquante

**Prochaine étape:** Phase 1 (créer APIs) + Phase 2 (formulaire)

**Impact utilisateur:** Actuellement, les trésoriers doivent saisir les transactions directement en SQL ! ❌
