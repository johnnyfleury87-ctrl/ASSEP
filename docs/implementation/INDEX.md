# INDEX - Documentation d'implémentation ASSEP

**Projet:** ASSEP - École Hubert Reeves  
**Date de création:** 27 janvier 2026  
**Objectif:** Reprendre l'implémentation de manière structurée et traçable

---

## 📚 Structure de la documentation

Cette documentation a été générée par une **analyse exhaustive** du projet réel :
- ✅ README.md (source de vérité fonctionnelle)
- ✅ 9 migrations Supabase (/supabase/migrations/0001-0009)
- ✅ APIs existantes (/pages/api/*)
- ✅ Pages UI (/pages/dashboard/*)
- ✅ Composants (/components/*)

**⚠️ Rien n'a été inventé. Tout est basé sur le code existant.**

---

## 📁 Fichiers de documentation

### 🎯 Fichiers principaux (LIRE EN PREMIER)

1. **[SYNTHESE-ETAT-PROJET.md](./SYNTHESE-ETAT-PROJET.md)**
   - Vue d'ensemble complète du projet
   - État de chaque fonctionnalité (opérationnel/partiel/manquant)
   - Liste des tables réelles vs attendues
   - Incohérences identifiées
   - Problèmes de sécurité critiques
   - **📌 LIRE EN PREMIER pour comprendre l'état global**

2. **[PLAN-IMPLEMENTATION.md](./PLAN-IMPLEMENTATION.md)**
   - Plan d'action étape par étape
   - Priorisation (URGENT → Recommandé)
   - Estimation de durée par étape
   - Critères de validation
   - Anti-patterns à éviter
   - **📌 CONSULTER avant chaque implémentation**

---

### 🏗️ Fichiers par vue/fonctionnalité

3. **[admin-bureau.md](./admin-bureau.md)**
   - Gestion des membres du bureau (affichage public)
   - Table: `bureau_members`
   - API: `/api/admin/bureau` (GET, POST, PUT, DELETE)
   - État: 🟡 API OK, UI manquante
   - Rôles: président, vice-président, JETC admin

4. **[admin-roles.md](./admin-roles.md)**
   - Gestion des rôles utilisateurs
   - Table: `profiles`
   - API: `/api/admin/roles`, `/api/admin/users`
   - État: 🟢 Pleinement opérationnel
   - Rôles: président, vice-président, JETC admin
   - **Amélioration recommandée:** traçabilité (`role_approved_by`)

5. **[admin-communications.md](./admin-communications.md)**
   - Campagnes d'emails aux opt-in (RGPD)
   - Table: `email_campaigns`
   - API: `/api/campaigns/send` (⚠️ SANS AUTH !)
   - État: 🔴 Incomplet avec faille de sécurité
   - Rôles: président, vice, secrétaire, vice-secrétaire
   - **🚨 ACTION URGENTE:** Sécuriser l'API existante

6. **[admin-tresorerie.md](./admin-tresorerie.md)**
   - Trésorerie globale (recettes/dépenses)
   - Table: `transactions`
   - API: ❌ Aucune API (lecture directe Supabase client)
   - État: 🟡 Lecture seule + export CSV
   - Rôles: trésorier, vice-trésorier, président, vice
   - **ACTION:** Créer APIs CRUD + formulaire de saisie

---

## 🚦 État par fonctionnalité

### 🟢 Opérationnel (prêt à utiliser)

- ✅ Authentification Supabase
- ✅ Gestion utilisateurs (liste, création, suppression)
- ✅ Gestion des rôles (changement, validation)
- ✅ RLS et sécurité base de données

### 🟡 Partiellement implémenté (nécessite complétion)

- ⚠️ Gestion du bureau (API OK, UI formulaire manquant)
- ⚠️ Trésorerie (lecture OK, écriture manquante)
- ⚠️ Événements (tables OK, UI à vérifier)

### 🔴 Critique ou incomplet

- 🚨 Communications (faille sécurité + UI/API manquantes)
- 🚨 Dons (non implémenté)
- 🚨 Buvette événements (tables manquantes dans migrations)

---

## 🎯 Comment utiliser cette documentation ?

### Avant de commencer une tâche :

1. **Lire [SYNTHESE-ETAT-PROJET.md](./SYNTHESE-ETAT-PROJET.md)**
   - Comprendre l'état global
   - Identifier les incohérences potentielles

2. **Consulter le fichier spécifique** (ex: `admin-bureau.md`)
   - Vérifier tables/colonnes disponibles
   - Lister APIs existantes ou à créer
   - Identifier composants UI requis
   - Lire les points bloquants

3. **Consulter [PLAN-IMPLEMENTATION.md](./PLAN-IMPLEMENTATION.md)**
   - Vérifier la priorité de la tâche
   - Suivre le plan d'action recommandé
   - Respecter les critères de validation

4. **Implémenter**
   - Suivre le workflow : Migrations → API → UI
   - Tester à chaque étape
   - Ne jamais inventer de colonnes/tables

5. **Mettre à jour la documentation**
   - Corriger les fichiers si incohérence trouvée
   - Ajouter notes d'implémentation si nécessaire

---

## 📊 Matrice de cohérence

### Sources de vérité (ordre de priorité)

1. **Migrations Supabase** (`/supabase/migrations/000*.sql`)
   - Tables réelles
   - Colonnes réelles
   - Contraintes et RLS

2. **APIs existantes** (`/pages/api/*`)
   - Endpoints disponibles
   - Validation serveur
   - Logique métier

3. **README.md**
   - Cahier des charges fonctionnel
   - ⚠️ Peut contenir des incohérences avec le code réel

4. **Pages UI** (`/pages/dashboard/*`)
   - État d'implémentation réel
   - Composants disponibles

### En cas de conflit :

**Migrations > API > UI > README**

Si le README décrit une table qui n'existe pas dans les migrations, **la migration fait foi**.  
→ Signaler l'incohérence et proposer soit de créer la migration, soit de corriger le README.

---

## 🔍 Incohérences majeures identifiées

### Tables mentionnées dans README mais absentes

❌ `email_logs` - Logs d'envoi email  
❌ `event_buvette_items` - Articles de buvette  
❌ `event_payment_methods` - Moyens de paiement  
❌ `event_cashups` - Recettes par événement  

**Impact:** Impossible d'implémenter ces fonctionnalités sans créer les migrations.

### APIs attendues mais absentes

❌ `/api/campaigns/create` - Création campagne email  
❌ `/api/finance/transactions` - CRUD trésorerie  
❌ `/api/donations/*` - Gestion dons  

**Impact:** Les pages UI correspondantes ne peuvent pas fonctionner.

### Sécurité

🚨 `/api/campaigns/send` **n'a AUCUNE authentification**  
→ Faille critique à corriger immédiatement (voir PLAN-IMPLEMENTATION.md Étape 1.1)

---

## 🎓 Glossaire des termes

- **RLS** : Row Level Security (sécurité au niveau ligne PostgreSQL)
- **JETC Admin** : Super-admin avec accès total (colonne `is_jetc_admin`)
- **Service Role** : Clé Supabase avec bypass RLS (utilisée dans APIs)
- **Anon Key** : Clé Supabase publique (utilisée côté client)
- **Opt-in** : Consentement RGPD pour recevoir les communications
- **Migration idempotente** : SQL exécutable plusieurs fois sans erreur

---

## 📞 Support et questions

### Avant de demander de l'aide :

1. ✅ J'ai lu [SYNTHESE-ETAT-PROJET.md](./SYNTHESE-ETAT-PROJET.md)
2. ✅ J'ai consulté le fichier spécifique de la fonctionnalité
3. ✅ J'ai vérifié les migrations Supabase correspondantes
4. ✅ J'ai vérifié si l'API existe dans `/pages/api/`

### Questions fréquentes (FAQ)

**Q: Puis-je créer une nouvelle table ?**  
R: Oui, MAIS créer d'abord une migration SQL dans `/supabase/migrations/0010_*.sql`, l'exécuter dans Supabase, puis coder l'API/UI.

**Q: Pourquoi telle table est mentionnée dans le README mais n'existe pas ?**  
R: Le README contient le cahier des charges initial. Certaines fonctionnalités n'ont pas été implémentées. Consulter [SYNTHESE-ETAT-PROJET.md](./SYNTHESE-ETAT-PROJET.md) section "Incohérences".

**Q: Puis-je lire directement Supabase client dans mes pages ?**  
R: Seulement pour les données publiques. Pour les opérations sensibles, créer une API protégée.

**Q: Comment tester mes changements ?**  
R: Voir [PLAN-IMPLEMENTATION.md](./PLAN-IMPLEMENTATION.md) section "Critères de validation".

---

## 🔄 Maintenance de cette documentation

Cette documentation doit être mise à jour :

- ✅ Après chaque nouvelle migration Supabase
- ✅ Après création d'une nouvelle API
- ✅ Après découverte d'une incohérence
- ✅ Après correction d'un bug de sécurité
- ✅ Lorsqu'une fonctionnalité passe de 🔴 → 🟡 → 🟢

**Fichier à mettre à jour en priorité:** [SYNTHESE-ETAT-PROJET.md](./SYNTHESE-ETAT-PROJET.md)

---

## 📅 Changelog

| Date | Action | Fichiers |
|------|--------|----------|
| 2026-01-27 | Création initiale documentation | Tous |
| 2026-01-27 | Analyse exhaustive projet | SYNTHESE-ETAT-PROJET.md |
| 2026-01-27 | Plan d'implémentation structuré | PLAN-IMPLEMENTATION.md |

---

**🎯 Objectif final :** Avoir une documentation vivante, à jour, et source unique de vérité pour l'implémentation du projet ASSEP.

**⚠️ Règle d'or :** Ne rien coder sans consulter cette documentation d'abord.
