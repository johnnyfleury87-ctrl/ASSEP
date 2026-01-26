# 🚀 Guide de Setup ASSEP - Base Supabase Propre

Ce guide décrit la procédure complète pour mettre en place l'application ASSEP avec une **nouvelle base Supabase vide**, de manière à ce que tout fonctionne du premier coup.

## 📋 Pré-requis

- Node.js 18+ installé
- Compte Supabase (gratuit)
- Git

## 🎯 Étape 1: Créer un nouveau projet Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Cliquer sur **New Project**
3. Remplir:
   - **Name**: `ASSEP` (ou autre nom de votre choix)
   - **Database Password**: Choisir un mot de passe fort (le noter quelque part)
   - **Region**: Choisir la région la plus proche (ex: `Europe (Paris)`)
4. Cliquer sur **Create new project**
5. Attendre 2-3 minutes que le projet soit provisionné

## 🔑 Étape 2: Récupérer les clés API

Une fois le projet créé:

1. Dans le menu latéral, aller dans **Settings** → **API**
2. Noter les informations suivantes:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbG...` (clé publique)
   - **service_role**: `eyJhbG...` (clé secrète - NE JAMAIS COMMIT)

## 🔧 Étape 3: Configuration du projet local

1. Cloner le repo (si pas déjà fait):
```bash
git clone <repo-url>
cd ASSEP
```

2. Installer les dépendances:
```bash
npm install
```

3. Créer le fichier `.env.local` à la racine:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

⚠️ **IMPORTANT**: Ne JAMAIS commit ce fichier (déjà dans `.gitignore`)

## 🗄️ Étape 4: Appliquer les migrations SQL

Les migrations créent toutes les tables, triggers, policies RLS, et fonctions helper.

### Via l'interface Supabase (recommandé pour démarrage)

1. Aller dans **SQL Editor** (menu latéral)
2. Créer une nouvelle query
3. Copier-coller le contenu de **chaque migration dans l'ordre**:

```
supabase/migrations/0001_foundations.sql
supabase/migrations/0002_events.sql
supabase/migrations/0003_signups.sql
supabase/migrations/0004_finance.sql
supabase/migrations/0005_emails_donations.sql
supabase/migrations/0006_rls_policies.sql
supabase/migrations/0007_auth_profiles_trigger.sql  ⚠️  IMPORTANTE
supabase/migrations/0008_admin_helpers.sql
```

4. Exécuter chaque migration (cliquer sur **Run** ou `Ctrl+Enter`)
5. Vérifier qu'il n'y a pas d'erreur (messages en vert = OK)

⚠️ **ATTENTION Migration 0007**: Cette migration créé un trigger sur `auth.users`. Si vous obtenez une erreur de permissions (`must be owner of relation users`), c'est normal avec certains clients SQL. **Solution**: Exécutez cette migration directement via le **SQL Editor du Dashboard Supabase** (interface web), qui a les permissions nécessaires.

### Via Supabase CLI (NE PAS utiliser pour la migration 0007)

Si vous utilisez la CLI Supabase, **ATTENTION**: La migration 0007 doit être exécutée manuellement via le Dashboard:

```bash
# Exécuter les migrations 0001 à 0006
supabase db push

# ⚠️  PUIS exécuter 0007 manuellement via Dashboard SQL Editor

# PUIS exécuter 0008
```

## 👤 Étape 5: Créer le premier utilisateur JETC Admin

### 5.1 Créer le user dans le Dashboard Supabase

1. Aller dans **Authentication** → **Users** (menu latéral)
2. Cliquer sur **Add user** → **Create new user**
3. Remplir:
   - **Email**: `votre-email@example.com` (votre vrai email)
   - **Password**: `VotreMotDePasse123!` (choisir un mot de passe)
   - **Auto Confirm User**: ✅ **COCHER CETTE CASE** (important!)
4. Cliquer sur **Create user**

### 5.2 Créer le profil pour ce user

1. Aller dans **SQL Editor**
2. Ouvrir le script `supabase/scripts/create_profile_for_dashboard_user.sql`
3. **MODIFIER** la ligne avec votre email (3 fois dans le script):

```sql
WHERE email = 'votre-email@example.com'
```

4. Exécuter le script complet
5. Vérifier le résultat: vous devriez voir votre profil créé

### 5.3 Activer les droits JETC Admin

1. Toujours dans **SQL Editor**
2. Ouvrir le script `supabase/scripts/bootstrap_jetc_admin.sql`
3. **MODIFIER** la ligne avec votre email:

```sql
WHERE email = 'votre-email@example.com'; -- REMPLACER PAR VOTRE EMAIL
```

4. Exécuter le script complet
5. Vérifier le résultat: vous devriez voir votre profil avec `is_jetc_admin = true`

## ✅ Étape 6: Vérifier l'installation

### 6.1 Exécuter le script Doctor

```bash
node scripts/doctor.js
```

Résultat attendu:
```
✅ Environnement OK - Aucun problème détecté
```

Si des erreurs apparaissent, les corriger avant de continuer.

### 6.2 Tester le workflow d'authentification

```bash
node scripts/check-auth-flow.js
```

Ce script teste:
- Création d'un user via Admin API
- Auto-confirmation
- Trigger de profil
- Connexion

Résultat attendu:
```
✅ Tous les tests sont passés
```

## 🌱 Étape 7: Seed data (optionnel)

Pour avoir des données de test (événements, tâches, membres bureau):

1. Aller dans **SQL Editor**
2. Ouvrir `supabase/scripts/seed.sql`
3. Exécuter le script
4. Vérifier: vous devriez avoir 3 événements, 4 tâches, etc.

## 🚀 Étape 8: Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur: `http://localhost:3000`

## 🔐 Étape 9: Premier login

1. Aller sur `http://localhost:3000/login`
2. Se connecter avec l'email et le mot de passe créés à l'étape 5.1
3. Vous devriez être redirigé vers `/dashboard`
4. Aller sur `/dashboard/jetc/users` pour créer d'autres utilisateurs

## 📝 Workflow de création d'utilisateurs

### En tant que JETC Admin:

1. Aller sur `/dashboard/jetc/users`
2. Remplir le formulaire:
   - Email
   - Prénom/Nom
   - Rôle (président, trésorier, etc.)
3. Cliquer sur **Créer l'utilisateur**
4. **Noter le mot de passe temporaire affiché**: `ASSEP1234!`
5. Communiquer l'email et le mot de passe à la personne

### Le nouvel utilisateur:

1. Se connecte sur `/login` avec son email et `ASSEP1234!`
2. L'application lui demande de changer son mot de passe
3. Il choisit un nouveau mot de passe personnel

## 🎯 Workflow de publication d'événements

### Secrétaire/Vice-secrétaire:

1. Va sur `/dashboard/evenements/new`
2. Crée un événement
3. Le statut passe à **"En attente d'approbation"**

### Président/Vice-président:

1. Va sur `/dashboard/evenements`
2. Voit les événements en attente
3. Clique sur **Approuver** → l'événement devient **Publié** sur le site public
4. Ou clique sur **Rejeter** → retour à "Brouillon"

## 🔧 Utilitaires disponibles

### Scripts de vérification

```bash
# Vérifier l'environnement et la DB
node scripts/doctor.js

# Tester le workflow d'auth
node scripts/check-auth-flow.js
```

### Scripts SQL utiles

```sql
-- Réparer les profils manquants
-- supabase/scripts/repair_profiles.sql

-- Confirmer un user manuellement (dépannage)
-- supabase/scripts/confirm_user.sql
```

## 📊 Structure des rôles

| Rôle | Permissions |
|------|-------------|
| **JETC Admin** | Accès total, création d'utilisateurs |
| **Président** | Approuve événements, gère finances, voit tout |
| **Vice-Président** | Idem président |
| **Trésorier** | Gère finances uniquement |
| **Vice-Trésorier** | Idem trésorier |
| **Secrétaire** | Crée/édite événements (validation requise) |
| **Vice-Secrétaire** | Idem secrétaire |
| **Membre** | Accès basique |

## ❓ Troubleshooting

### ⚠️ Erreur Migration 0007: "must be owner of relation users"

➡️ **Cette erreur n'existe plus!** La migration 0007 a été redessinée pour ne plus utiliser de trigger sur `auth.users`.

**Ce qui se passe maintenant**:
- Les profils sont créés **explicitement** dans l'API lors de `createUser()`
- Pour les users créés via Dashboard, il faut exécuter `create_profile_for_dashboard_user.sql`
- La fonction `sync_auth_users_to_profiles()` synchronise automatiquement tous les profils manquants

**Plus besoin de trigger = Plus de problème de permissions!**

### Erreur: "email_confirmed_at is null"

➡️ Vous avez oublié de cocher "Auto Confirm User" lors de la création du user.

**Solution**: Exécuter le script `confirm_user.sql` avec le bon email.

### Erreur: "Profil non trouvé"

➡️ Le profil n'a pas été créé pour un user créé via Dashboard.

**Solution**: 
1. Exécuter `supabase/scripts/repair_profiles.sql` (synchronise automatiquement)
2. Ou exécuter `create_profile_for_dashboard_user.sql` pour un user spécifique

### Erreur RLS: "new row violates policy"

➡️ Les policies RLS bloquent l'opération.

**Solution**: Vérifier que votre user a bien le bon rôle et les bonnes permissions.

### Un user ne peut pas se connecter

➡️ Son compte n'est pas confirmé.

**Solution**: Aller dans **Authentication** → **Users**, cliquer sur le user, et confirmer manuellement.

## 🔒 Sécurité

- ✅ Auto-confirm activé pour tous les users créés par JETC
- ✅ Password temporaire: `ASSEP1234!` (changement obligatoire)
- ✅ RLS activé sur toutes les tables
- ✅ Service role key jamais exposée côté client
- ✅ Logs propres (pas de password en clair)

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Fichier COMMANDS.md pour les commandes utiles

---

**🎉 Félicitations! Votre instance ASSEP est opérationnelle.**

Si vous rencontrez un problème non documenté ici, contactez l'équipe de développement.
