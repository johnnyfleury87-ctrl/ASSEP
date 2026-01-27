# PLAN D'IMPLÉMENTATION - PROCHAINES ÉTAPES

**Date:** 27 janvier 2026  
**Projet:** ASSEP - École Hubert Reeves  
**Objectif:** Reprendre l'implémentation de manière structurée et traçable

---

## 🎯 Principe directeur

**Aucune implémentation ne doit commencer sans :**
1. ✅ Validation de la documentation correspondante dans `/docs/implementation/`
2. ✅ Vérification que les tables/colonnes existent dans les migrations
3. ✅ Confirmation que les APIs nécessaires existent ou ont un plan de création

**Workflow obligatoire :**
```
Demande utilisateur
  → Consulter /docs/implementation/
  → Identifier les gaps (API/UI/migrations)
  → Corriger les gaps AVANT de coder l'UI
  → Implémenter l'UI
  → Tester manuellement
  → Mettre à jour la doc
```

---

## 🚨 ÉTAPE 1 : Sécuriser l'existant (CRITIQUE)

### 1.1 Sécuriser `/api/campaigns/send`

**Problème:** API d'envoi email sans authentification  
**Impact:** Faille de sécurité RGPD critique  
**Priorité:** 🔴 URGENT

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/api/campaigns/send.js`

**Actions:**
1. Ajouter import `createAnonClient` de `lib/supabaseAnonServer`
2. Extraire Bearer token de `req.headers.authorization`
3. Vérifier token via `anonClient.auth.getUser()`
4. Charger profil avec `supabaseAdmin.from('profiles')`
5. Vérifier rôle in `['president', 'vice_president', 'secretaire', 'vice_secretaire']`
6. Retourner 401 si pas de token, 403 si rôle invalide

**Validation:**
- Tester sans token → 401
- Tester avec membre → 403
- Tester avec président → 200 OK

**Durée:** 15-20 minutes

---

### 1.2 Corriger RLS policy `email_campaigns`

**Problème:** Secrétaires bloqués par RLS  
**Impact:** Impossibilité d'utiliser la fonctionnalité communications  
**Priorité:** 🔴 URGENT

**Fichier à créer:**
- `/workspaces/ASSEP/supabase/migrations/0010_fix_email_campaigns_rls.sql`

**Contenu:**
```sql
-- ============================================================================
-- Migration 0010: Corriger RLS email_campaigns pour secrétaires
-- ============================================================================

DROP POLICY IF EXISTS "email_campaigns_all_admin" ON public.email_campaigns;

CREATE POLICY "email_campaigns_all_comms"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (
    public.is_jetc_admin() 
    OR public.is_president_or_vice()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaire', 'vice_secretaire')
    )
  )
  WITH CHECK (
    public.is_jetc_admin() 
    OR public.is_president_or_vice()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaire', 'vice_secretaire')
    )
  );

COMMENT ON POLICY "email_campaigns_all_comms" ON public.email_campaigns IS 
'Président, vice, secrétaires et JETC peuvent gérer les campagnes email';
```

**Validation:**
- Exécuter dans SQL Editor Supabase
- Tester connexion avec compte secrétaire
- Vérifier lecture de `email_campaigns` possible

**Durée:** 10 minutes

---

## 🟡 ÉTAPE 2 : Compléter gestion du bureau

**Référence:** `/docs/implementation/admin-bureau.md`

### 2.1 Créer composant `BureauMemberForm`

**Fichier à créer:**
- `/workspaces/ASSEP/components/BureauMemberForm.js`

**Props attendues:**
- `member` (null = création, objet = édition)
- `onSubmit(data)` - callback avec données validées
- `onCancel()` - callback fermeture formulaire

**Champs du formulaire:**
- `title` (TEXT, requis) - Président, Trésorière, etc.
- `name` (TEXT, optionnel) - Nom complet
- `photo_url` (TEXT, optionnel) - URL de la photo
- `display_order` (NUMBER, défaut 100) - Ordre d'affichage
- `is_active` (BOOLEAN, défaut true) - Visible sur le site

**Validation côté client:**
- `title` requis
- `display_order` doit être un nombre >= 0

**Durée:** 45-60 minutes

---

### 2.2 Intégrer formulaire dans `/dashboard/bureau`

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/dashboard/bureau.js`

**Actions:**
1. Importer `BureauMemberForm`
2. Ajouter états:
   - `showForm` (boolean)
   - `editingMember` (null ou objet)
   - `loading` (boolean)
   - `error` (string ou null)
3. Implémenter handlers:
   - `handleCreate()` → POST `/api/admin/bureau`
   - `handleUpdate()` → PUT `/api/admin/bureau`
   - `handleDelete()` → DELETE `/api/admin/bureau`
4. Remplacer bandeau "à implémenter" par:
   - Bouton "Ajouter un membre"
   - Liste avec boutons Éditer/Supprimer par ligne
5. Gérer loading/error states

**Validation:**
- Créer un membre → voir dans DB
- Éditer → modifications enregistrées
- Supprimer → confirmé puis supprimé

**Durée:** 1-2 heures

---

## 🟡 ÉTAPE 3 : Implémenter création de campagne email

**Référence:** `/docs/implementation/admin-communications.md`

### 3.1 Créer API `/api/campaigns/create`

**Fichier à créer:**
- `/workspaces/ASSEP/pages/api/campaigns/create.js`

**Endpoints:**
- POST - Créer une campagne (status = 'draft')

**Body attendu:**
```json
{
  "name": "Infolettre Janvier 2026",
  "subject": "Prochains événements ASSEP",
  "content": "<html>...</html>",
  "recipient_type": "all"
}
```

**Validation:**
- `name`, `subject`, `content` requis
- `recipient_type` in ['all', 'members', 'custom']
- Si custom: `recipient_emails` requis (array)

**Sécurité:**
- Vérifier Bearer token
- Vérifier rôle in ['president', 'vice_president', 'secretaire', 'vice_secretaire']
- Renseigner `created_by`

**Durée:** 30-45 minutes

---

### 3.2 Créer composant `CampaignForm`

**Fichier à créer:**
- `/workspaces/ASSEP/components/CampaignForm.js`

**Props:**
- `campaign` (null = création, objet = édition)
- `onSubmit(data)`
- `onCancel()`

**Champs:**
- `name` (TEXT, requis)
- `subject` (TEXT, requis)
- `content` (TEXTAREA, requis) - Accepte HTML
- `recipient_type` (SELECT, défaut 'all')

**Bonus:**
- Preview HTML en temps réel
- Compteur de caractères pour subject

**Durée:** 1 heure

---

### 3.3 Intégrer dans `/dashboard/communications`

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/dashboard/communications.js`

**Actions:**
1. Importer `CampaignForm`
2. Ajouter états `showForm`, `editingCampaign`
3. Implémenter `handleCreate()` → POST `/api/campaigns/create`
4. Ajouter bouton "Nouvelle campagne"
5. Modal d'envoi avec confirmation (affiche nombre destinataires)
6. Remplacer lecture Supabase client par appel API

**Durée:** 1-2 heures

---

## 🟡 ÉTAPE 4 : Implémenter trésorerie (écriture)

**Référence:** `/docs/implementation/admin-tresorerie.md`

### 4.1 Créer API `/api/finance/transactions`

**Fichier à créer:**
- `/workspaces/ASSEP/pages/api/finance/transactions.js`

**Endpoints:**
- GET - Liste transactions (avec filtres optionnels)
- POST - Créer transaction
- PUT - Modifier transaction
- DELETE - Supprimer transaction

**Body POST:**
```json
{
  "type": "income",
  "category": "Subvention",
  "amount": 500.00,
  "description": "Subvention mairie 2026",
  "transaction_date": "2026-01-15",
  "event_id": null
}
```

**Validation:**
- `type` in ['income', 'expense']
- `amount` > 0
- `description` requis
- `transaction_date` format ISO date
- Renseigner `recorded_by`

**Sécurité:**
- Vérifier rôle in ['tresorier', 'vice_tresorier', 'president', 'vice_president', 'is_jetc_admin']

**Durée:** 1-2 heures

---

### 4.2 Créer composant `TransactionForm`

**Fichier à créer:**
- `/workspaces/ASSEP/components/TransactionForm.js`

**Props:**
- `transaction` (null ou objet)
- `events` (array) - liste des événements pour le dropdown
- `onSubmit(data)`
- `onCancel()`

**Champs:**
- Radio: Type (Recette / Dépense)
- Dropdown: Catégorie (prédéfini + "Autre")
- Input number: Montant (€, min 0.01)
- Textarea: Description
- Input date: Date transaction (défaut aujourd'hui)
- Select: Événement lié (optionnel)

**Catégories prédéfinies:**
```javascript
INCOME: ['Subvention', 'Don', 'Cotisation', 'Recette événement', 'Autre']
EXPENSE: ['Achat matériel', 'Location', 'Assurance', 'Frais admin', 'Autre']
```

**Durée:** 1 heure

---

### 4.3 Intégrer dans `/dashboard/tresorerie`

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/dashboard/tresorerie.js`

**Actions:**
1. Importer `TransactionForm`
2. Ajouter bouton "Nouvelle transaction"
3. Implémenter CRUD via API (remplacer lecture directe Supabase)
4. Ajouter actions Éditer/Supprimer par ligne
5. Calculer solde côté API (optionnel: créer `/api/finance/balance`)

**Durée:** 1-2 heures

---

## 🔵 ÉTAPE 5 : Améliorer traçabilité (recommandé)

### 5.1 Remplir champs audit dans `/api/admin/roles`

**Problème:** `role_approved_by` et `role_approved_at` jamais renseignés

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/api/admin/roles.js`

**Ligne à modifier:**
```javascript
const { data: updatedProfile, error: updateError } = await supabaseServer
  .from('profiles')
  .update({ 
    role,
    role_approved_by: user.id,           // ← AJOUTER
    role_approved_at: new Date().toISOString()  // ← AJOUTER
  })
  .eq('id', user_id)
  .select()
  .single()
```

**Durée:** 5 minutes

---

### 5.2 Afficher historique dans `/dashboard/admin/roles`

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/dashboard/admin/roles.js`

**Actions:**
1. Charger `role_approved_by` et `role_approved_at` dans GET
2. Faire jointure pour récupérer email de l'approbateur
3. Afficher colonne "Modifié par" avec format relatif ("il y a 2 jours")

**Durée:** 30 minutes

---

## 📋 Récapitulatif des priorités

| Étape | Priorité | Durée | Impact |
|-------|----------|-------|--------|
| 1.1 Sécuriser `/api/campaigns/send` | 🔴 URGENT | 15 min | Sécurité RGPD |
| 1.2 Corriger RLS email_campaigns | 🔴 URGENT | 10 min | Débloquer secrétaires |
| 2. Compléter gestion bureau | 🟡 Haute | 2-3h | UX bureau |
| 3. Implémenter campagnes email | 🟡 Haute | 3-4h | Fonctionnalité manquante |
| 4. Implémenter trésorerie | 🟡 Haute | 3-5h | Fonctionnalité critique |
| 5. Améliorer traçabilité | 🔵 Moyenne | 35 min | Audit + debug |

**Estimation totale:** 10-14 heures de développement

---

## ✅ Critères de validation

Avant de considérer une étape comme terminée:

1. **Code:**
   - ✅ Pas d'erreurs ESLint
   - ✅ Build Next.js réussit (`npm run build`)
   - ✅ Pas de console.error non gérés

2. **Fonctionnel:**
   - ✅ Test manuel avec rôles appropriés
   - ✅ Loading states fonctionnent
   - ✅ Messages d'erreur clairs
   - ✅ Redirection auth si non connecté

3. **Sécurité:**
   - ✅ API protégée par Bearer token
   - ✅ Vérification de rôle côté serveur
   - ✅ RLS policies respectées

4. **Documentation:**
   - ✅ Fichier `/docs/implementation/*.md` mis à jour
   - ✅ Commentaires dans le code pour logique complexe

---

## 🚫 Anti-patterns à éviter absolument

❌ **Ne jamais:**
1. Inventer des tables ou colonnes non présentes dans les migrations
2. Créer une UI sans vérifier que l'API existe
3. Contourner Supabase Auth ou RLS
4. Lire/écrire directement en DB depuis le client (sauf lecture publique)
5. Coder sans consulter `/docs/implementation/` d'abord
6. Oublier la validation côté serveur (jamais faire confiance au client)
7. Déployer sans tester manuellement

✅ **Toujours:**
1. Consulter la doc dans `/docs/implementation/`
2. Vérifier le schéma DB dans `/supabase/migrations/`
3. Implémenter API → tester → UI → tester
4. Gérer loading/error states dans l'UI
5. Valider inputs côté serveur ET client
6. Renseigner les champs audit (`created_by`, `recorded_by`, etc.)
7. Tester avec différents rôles (président, secrétaire, membre)

---

## 🎯 Prochaine action immédiate

**COMMENCER PAR:** Étape 1.1 (Sécuriser `/api/campaigns/send`)

**Ensuite demander validation utilisateur avant de poursuivre.**

---

**Dernière mise à jour:** 27 janvier 2026  
**Maintenu par:** Documentation générée par analyse exhaustive du projet
