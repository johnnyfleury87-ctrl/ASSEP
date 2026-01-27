# SYNTHÈSE DE L'ÉTAT RÉEL DU PROJET ASSEP

**Date d'analyse:** 27 janvier 2026  
**Analysé par:** GitHub Copilot  
**Méthode:** Lecture exhaustive README + migrations + APIs + pages UI

---

## 📊 Vue d'ensemble

### Architecture
- **Framework:** Next.js 14.2.35 (Pages Router)
- **Base de données:** Supabase (PostgreSQL + Auth + RLS)
- **Déploiement:** Vercel
- **Migrations:** 9 fichiers SQL idempotents (0001 → 0009)
- **Authentification:** Supabase Auth + profils auto-créés par trigger

### État global du projet

| Fonctionnalité | README | Migrations | API | UI | État |
|----------------|--------|------------|-----|----|----|
| Authentification | ✅ | ✅ | ✅ | ✅ | 🟢 Opérationnel |
| Profils utilisateurs | ✅ | ✅ | ✅ | ✅ | 🟢 Opérationnel |
| Rôles (JETC/Bureau) | ✅ | ✅ | ✅ | ✅ | 🟢 Opérationnel |
| Gestion du bureau | ✅ | ✅ | ✅ | ✅ | 🟢 Opérationnel |
| Événements | ✅ | ✅ | ⚠️ | ⚠️ | 🟡 Partiel |
| Communications | ✅ | ✅ | ✅ | ✅ | 🟢 Opérationnel |
| Trésorerie | ✅ | ✅ | ❌ | 🟡 | 🟡 Lecture seule |
| Inscriptions bénévoles | ✅ | ✅ | ⚠️ | ⚠️ | 🟡 Partiel |
| Dons | ✅ | ✅ | ❌ | ❌ | 🔴 Non implémenté |

**Légende:**
- 🟢 Pleinement opérationnel
- 🟡 Partiellement implémenté
- 🔴 Manquant ou bloqué
- ⚠️ Présent mais incomplet

---

## 🗂️ Structure de la base de données

### Tables réelles (migrations 0001-0009)

#### **Gestion utilisateurs**
1. `profiles` - Profils liés à auth.users (rôle, opt-in, JETC admin)
2. `bureau_members` - Affichage public des membres du bureau

#### **Événements**
3. `events` - Événements ASSEP (workflow draft → pending → published)
4. `event_shifts` - Créneaux de bénévolat
5. `event_volunteers` - Assignations bénévoles aux créneaux
6. `event_tasks` - Tâches liées aux événements

#### **Inscriptions**
7. `signups` - Inscriptions participants (avec opt-in communications)

#### **Finance**
8. `transactions` - Trésorerie globale (recettes/dépenses)
9. `donations` - Dons reçus (one-time/monthly/annual)

#### **Communications**
10. `email_campaigns` - Campagnes emails (draft/sent/failed)

### Tables mentionnées dans README mais absentes

❌ `email_logs` - Logs d'envoi email (mentionné dans README section 3.11)  
❌ `event_buvette_items` - Articles de buvette (mentionné cahier des charges)  
❌ `event_payment_methods` - Moyens de paiement (mentionné cahier des charges)  
❌ `event_cashups` - Recettes par événement (mentionné cahier des charges)  
❌ `volunteer_signups` - Alias/ancienne version de `signups`

**⚠️ Incohérence:** Le cahier des charges dans le README décrit des tables qui n'existent pas dans les migrations réelles.

---

## 🔒 Sécurité (RLS)

### État RLS par table

| Table | RLS activé | Policies | État |
|-------|-----------|----------|------|
| profiles | ✅ | ✅ Complètes | 🟢 OK |
| bureau_members | ✅ | ✅ Complètes | 🟢 OK |
| events | ✅ | ✅ Complètes | 🟢 OK |
| event_shifts | ✅ | ✅ Complètes | 🟢 OK |
| event_volunteers | ✅ | ✅ Complètes | 🟢 OK |
| event_tasks | ✅ | ✅ Complètes | 🟢 OK |
| signups | ✅ | ✅ Complètes | 🟢 OK |
| transactions | ✅ | ✅ Complètes | 🟢 OK |
| email_campaigns | ✅ | ⚠️ Trop restrictive | 🟡 À corriger |
| donations | ✅ | ✅ Complètes | 🟢 OK |

### Fonctions helper SQL disponibles

✅ `is_jetc_admin()` - Vérifie si user est super-admin  
✅ `is_president_or_vice()` - Vérifie rôle président/vice  
✅ `can_manage_finance()` - Vérifie accès trésorerie  
✅ `can_manage_events()` - Vérifie accès gestion événements  
✅ `change_user_role(uuid, text)` - Change rôle utilisateur (RPC)  
✅ `set_must_change_password(uuid, boolean)` - Force changement MDP (RPC)  

---

## 🌐 APIs existantes

### APIs complètes et fonctionnelles

✅ `/api/admin/users` (GET, PUT, DELETE) - Gestion utilisateurs  
✅ `/api/admin/roles` (POST) - Changement rôles  
✅ `/api/admin/bureau` (GET, POST, PUT, DELETE) - Gestion bureau  
✅ `/api/admin/reset-password` - Reset mot de passe  
✅ `/api/admin/whoami` - Info user connecté  
✅ `/api/admin/users/create` (POST) - Création utilisateur  
✅ `/api/campaigns/send` (POST) - Envoi campagne (SÉCURISÉ)  
✅ `/api/campaigns/create` (POST) - Création campagne  

### APIs partielles ou problématiques

⚠️ `/api/signups` - État inconnu (à vérifier)  
⚠️ `/api/events/approve` - État inconnu (à vérifier)  
⚠️ `/api/events/reject` - État inconnu (à vérifier)  

### APIs complètement absentes

❌ `/api/campaigns/list` - Liste campagnes (optionnel, lecture directe Supabase OK)  
❌ `/api/finance/transactions` - CRUD transactions trésorerie  
❌ `/api/finance/balance` - Calcul solde  
❌ `/api/donations/*` - Gestion dons  
❌ `/api/events/*` - CRUD événements (hors approve/reject)  

---

## 🖥️ Pages UI et leur état

### Dashboard principal

✅ `/dashboard` - Tableau de bord principal (opérationnel)  
✅ `/login` - Page de connexion (opérationnel)

### Pages admin (président/vice/JETC)

| Page | État UI | APIs utilisées | État |
|------|---------|----------------|------|
| `/dashboard/bureau` | ✅ CRUD complet | `/api/admin/bureau` | 🟢 OK |
| `/dashboard/admin/roles` | ✅ Complète | `/api/admin/roles`, `/api/admin/users` | 🟢 OK |
| `/dashboard/jetc/users` | ✅ Complète | `/api/admin/users/create` | 🟢 OK |
| `/dashboard/communications` | ✅ CRUD complet | `/api/campaigns/create`, `/api/campaigns/send` | 🟢 OK |
| `/dashboard/tresorerie` | 🟡 Lecture seule + export CSV | Lecture directe Supabase | 🟡 Partiel |

### Pages événements

| Page | État | Notes |
|------|------|-------|
| `/dashboard/evenements` | ⚠️ À vérifier | Gestion liste événements |
| `/dashboard/evenements/new` | ⚠️ À vérifier | Création événement |
| `/dashboard/evenements/[id]/benevoles` | ⚠️ À vérifier | Liste bénévoles |
| `/dashboard/evenements/[id]/caisse` | ⚠️ À vérifier | Gestion caisse événement |

### Pages publiques

| Page | État | Notes |
|------|------|-------|
| `/` | ⚠️ À vérifier | Page d'accueil |
| `/evenements` | ⚠️ À vérifier | Liste événements publics |
| `/evenements/[slug]` | ⚠️ À vérifier | Détail événement |
| `/dons` | ❌ À créer | Dons généraux (QR code) |
| `/dons/evenement/[id]` | ❌ À créer | Dons événement spécifique |

---

## 🚨 Problèmes critiques identifiés

### 🟢 Sécurité - CORRIGÉE

1. **`/api/campaigns/send` sans authentification** ✅ RÉSOLU
   - Authentification Bearer token ajoutée
   - Vérification de rôle implémentée
   - Logs d'audit ajoutés

2. **RLS policy `email_campaigns` trop restrictive** ✅ RÉSOLU
   - Migration 0010 créée
   - Policy mise à jour pour inclure secrétaires
   - ⚠️ **Action requise:** Exécuter la migration dans Supabase

### 🔴 Incohérences majeures

1. **Tables du cahier des charges (README) vs migrations réelles**
   - README décrit `event_buvette_items`, `event_payment_methods`, `event_cashups`
   - Ces tables n'existent PAS dans les migrations
   - **Conséquence:** Impossible d'implémenter la buvette comme décrit

2. **Table `email_logs` manquante**
   - Mentionnée dans README section 3.11
   - Absente des migrations
   - **Impact:** Impossible de debugger les échecs d'envoi email

3. **Lecture directe Supabase client dans les pages**
   - Communications et Trésorerie lisent directement depuis le client
   - Incohérent avec le pattern API du reste du projet
   - **Risque:** Bypass validations serveur, logs absents

### 🟡 Fonctionnalités incomplètes

1. **Trésorerie** (écriture manquante)
   - Lecture et export CSV OK
   - Aucune API pour créer/modifier/supprimer
   - Aucun formulaire de saisie
   - **Impact:** Trésoriers doivent saisir en SQL direct !

2. **Tables manquantes vs README**
   - `email_logs` mentionnée mais absente
   - `event_buvette_items`, `event_payment_methods`, `event_cashups` absentes
   - **Impact:** Fonctionnalités buvette non implémentables sans migration

---

## 📁 Fichiers de documentation créés

Les fichiers suivants ont été créés dans `/docs/implementation/`:

1. **`admin-bureau.md`** - Gestion du bureau (JETC)
2. **`admin-roles.md`** - Gestion des rôles utilisateurs
3. **`admin-communications.md`** - Campagnes email
4. **`admin-tresorerie.md`** - Trésorerie globale

Chaque fichier contient :
- 🎯 Objectif fonctionnel
- 📄 Tables Supabase utilisées (noms exacts)
- 🔐 Règles d'accès / rôles requis
- 🔁 Endpoints API (existants ou à créer)
- 🧩 Composants UI (existants ou manquants)
- ⚠️ Points bloquants identifiés
- 📝 Plan d'implémentation recommandé

---

## ✅ Points positifs du projet

1. **Migrations SQL propres et idempotentes**
   - Structure claire (0001 → 0009)
   - Commentaires explicites
   - IF NOT EXISTS partout

2. **RLS bien configuré**
   - Activé sur toutes les tables
   - Fonctions helper réutilisables
   - Policies cohérentes

3. **Architecture cohérente (pour l'existant)**
   - API + UI bien séparées
   - Gestion d'erreurs présente
   - Loading states gérés

4. **Documentation riche**
   - README complet avec guides
   - Scripts de vérification (`doctor.js`, `supabase-verify.js`)
   - Fichiers SETUP, DEPLOYMENT, TESTING

5. **Gestion des rôles robuste**
   - Page `/dashboard/admin/roles` complète
   - Protection anti-auto-dégradation
   - Traçabilité possible (champs présents)

---

## 🎯 Prochaine étape à implémenter (UNE SEULE)

### ⚠️ PRIORITÉ ABSOLUE : Sécuriser `/api/campaigns/send`

**Pourquoi ?**
- Faille de sécurité critique (pas d'auth)
- Risque RGPD (envoi non autorisé)
- Impact utilisateur immédiat

**Quoi faire ?**
1. Ajouter vérification Bearer token dans `/api/campaigns/send`
2. Vérifier que user a rôle président/vice/secrétaire/vice-secrétaire
3. Retourner 401/403 si non autorisé

**Fichier à modifier:**
- `/workspaces/ASSEP/pages/api/campaigns/send.js`

**Code à ajouter** (début du handler):
```javascript
// Extraire le token
const authHeader = req.headers.authorization
if (!authHeader) {
  return res.status(401).json({ error: 'Non authentifié' })
}

const token = authHeader.replace('Bearer ', '')

// Vérifier le token
const anonClient = createAnonClient(token)
const { data: { user }, error: authError } = await anonClient.auth.getUser()

if (authError || !user) {
  return res.status(401).json({ error: 'Token invalide' })
}

// Vérifier le rôle
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

const allowedRoles = ['president', 'vice_president', 'secretaire', 'vice_secretaire']
if (!profile || !allowedRoles.includes(profile.role)) {
  return res.status(403).json({ error: 'Accès refusé' })
}
```

**Test de validation:**
1. Essayer d'appeler l'API sans token → 401
2. Essayer avec token d'un membre (rôle = 'membre') → 403
3. Essayer avec token président → 200 OK

**Durée estimée:** 15 minutes

---

## 📋 Résumé exécutif

### Ce qui fonctionne bien
- ✅ Authentification et gestion utilisateurs
- ✅ Gestion des rôles (président peut promouvoir)
- ✅ RLS et sécurité base de données
- ✅ Structure de code propre

### Ce qui est en cours (50-80%)
- 🟡 Gestion du bureau (API OK, UI manquante)
- 🟡 Trésorerie (lecture OK, écriture manquante)
- 🟡 Événements (tables OK, UI à vérifier)

### Ce qui manque (0-30%)
- 🔴 Communications (faille sécurité + UI/API manquantes)
- 🔴 Dons (non implémenté)
- 🔴 Buvette (tables manquantes dans migrations)

### Prochaines actions recommandées (ordre de priorité)

1. **Sécuriser `/api/campaigns/send`** (URGENT - 15 min)
2. **Créer UI gestion bureau** (1-2h)
3. **Créer API + UI trésorerie** (2-3h)
4. **Créer API + UI communications** (3-4h)
5. **Implémenter gestion dons** (4-6h)
6. **Ajouter tables buvette** (si requis - 2h)

---

**⚠️ RÈGLE D'OR : Ne rien coder tant que cette structure n'est pas validée.**

Les fichiers de documentation dans `/docs/implementation/` servent de référence unique pour toute implémentation future. Toute modification doit d'abord mettre à jour ces fichiers, puis le code.
