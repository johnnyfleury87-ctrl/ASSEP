# ASSEP - Site Associatif École Hubert Reeves

**Projet Next.js + Supabase pour l'ASSEP (Association de Soutien et d'Entraide Parents)**
École Hubert Reeves - Champagnole

---

## � Prérequis

**Versions Node.js et npm :**
- Node.js >= 18.17.0
- npm >= 9.0.0

Vérifier vos versions :
```bash
node --version  # doit afficher v18.17.0 ou supérieur
npm --version   # doit afficher 9.0.0 ou supérieur
```

**Stack technique :**
- **Next.js 14.2.35** (Pages Router, pas App Router)
- **ESLint 8.57.1** + **eslint-config-next 14.2.35** (versions alignées)
- Supabase 2.39.0
- React 18.2.0

> **Note :** Les versions de `next` et `eslint-config-next` sont verrouillées à `14.2.35` (sans `^`) pour éviter les conflits de peer dependencies avec ESLint. Voir [#deps-rationale](#rationale-des-versions) pour détails.

---

## �🚀 Démarrage rapide

```bash
# Installation
npm install

# Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local et remplir les valeurs

# Lancer en développement
npm run dev
```

> **⚠️ IMPORTANT - Configuration environnement**
> 
> **Créez `.env.local` à la racine du projet** et copiez le contenu de `.env.local.example`, puis **remplissez les valeurs** depuis le dashboard **Supabase** / **Resend** / **HelloAsso**.
> 
> - `.env.example` → documentation générale des variables
> - `.env.local.example` → **modèle exact à copier** (sans valeurs)
> - `.env.local` → **fichier réel** avec vos clés (jamais committé)

📖 **Guide complet:** voir [SETUP.md](./SETUP.md)

## 🛠️ Commandes disponibles

```bash
npm run dev       # Lancer le serveur de développement
npm run build     # Build de production
npm start         # Lancer après build
npm run doctor    # Diagnostic santé du projet
```

## 🖼️ Images et assets

**Les images statiques doivent être placées dans `/public`** et référencées par `/<nom-fichier>` :

- ✅ Fichier : `/public/hero.png`
- ✅ Référence dans le code : `backgroundImage: "url(/hero.png)"`
- ❌ Ne jamais utiliser : `"url(public/hero.png)"` ou `"url(./public/hero.png)"`

**Images actuelles :**
- `/hero.png` : Image de bannière (Hero section)
- `/jetc-logo.png` : Logo JETC Solution (Footer)

Pour remplacer les images, copiez simplement vos nouvelles images PNG/JPG dans `/public` en respectant les noms ci-dessus.

## 🔧 Bootstrap d'une base Supabase vide

**Workflow complet pour initialiser une nouvelle base de données :**

### Étape 0 : Appliquer les migrations

**IMPORTANT :** Avant de créer des utilisateurs, assurez-vous que toutes les migrations sont appliquées dans Supabase :

1. Allez dans le dashboard **Supabase** → **SQL Editor**
2. Exécutez **dans l'ordre** tous les fichiers de `/supabase/migrations/` :
   - `0001_foundations.sql` (tables + trigger initial)
   - `0002_events.sql`
   - `0003_signups.sql`
   - `0004_finance.sql`
   - `0005_emails_donations.sql`
   - `0006_rls_policies.sql`
   - `0007_ensure_profile_function.sql`
   - **`0008_fix_profiles_schema.sql`** ⚠️ **CRITIQUE** : corrige le trigger et ajoute les colonnes manquantes

> **⚠️ Sans la migration 0008**, la création d'utilisateurs dans Supabase Auth UI échouera avec "Database error creating new user".

3. Vérifiez que tout est OK :
```bash
node scripts/supabase-verify.js
```

### Étape 1 : Créer le premier utilisateur JETC admin

1. Allez dans le dashboard **Supabase** → **Authentication** → **Users**
2. Cliquez sur **Add user** → **Create new user**
3. Entrez l'email de l'administrateur JETC (ex: `admin@jetc-solution.fr`)
4. Définissez un mot de passe temporaire
5. **Cochez** "Auto Confirm User" pour éviter l'email de confirmation
6. ✅ Le profil est créé automatiquement par le trigger `on_auth_user_created`

### Étape 2 : Promouvoir en JETC admin

1. Ouvrez [supabase/scripts/promote-jetc-admin.sql](supabase/scripts/promote-jetc-admin.sql)
2. **Remplacez** `'votre-email@jetc-solution.fr'` par l'email créé à l'étape 1
3. Exécutez le script dans **SQL Editor** du dashboard Supabase
4. Vérifiez que le résultat affiche `is_jetc_admin = true`

### Étape 3 : Connexion et création des autres utilisateurs

1. Connectez-vous sur le site avec le compte JETC admin : `/login`
2. Accédez à la page de gestion : `/dashboard/jetc/users`
3. Utilisez le formulaire pour créer tous les autres utilisateurs (bureau, parents, etc.)
4. Le mot de passe temporaire **ASSEP1234!** est automatiquement attribué
5. Les utilisateurs devront le changer lors de leur première connexion

### Étape 4 : Vérification de l'installation

Exécutez le script de vérification pour valider que tout est configuré correctement :

```bash
node scripts/supabase-verify.js
```

Le script vérifie :
- ✅ Existence des 11 tables attendues
- ✅ Colonnes critiques (is_jetc_admin, has_buvette, etc.)
- ✅ RLS activé sur toutes les tables
- ✅ Fonctions SQL (ensure_profile_exists, repair_missing_profiles)

**En cas d'erreur**, le script génère automatiquement le SQL correctif à exécuter.

### Étape 5 (optionnelle) : Données de test

Pour peupler rapidement la base avec des données de démonstration :

```bash
# Dans le dashboard Supabase → SQL Editor
# Exécutez le fichier supabase/seed.sql
```

Cela crée des membres du bureau fictifs, un événement de test, et un compteur de dons.

### 🔧 Dépannage

#### Erreur "Database error creating new user"

**Cause :** Le trigger `on_auth_user_created` échoue car les colonnes `first_name`, `last_name`, `is_jetc_admin`, ou `must_change_password` n'existent pas dans `profiles`.

**Solution :** Exécutez la migration corrective dans SQL Editor :
```sql
-- Exécutez supabase/migrations/0008_fix_profiles_schema.sql
```

Puis vérifiez avec le script de diagnostic :
```bash
node scripts/check-trigger.js
```

Cette migration :
- Ajoute les colonnes manquantes à `profiles` (`first_name`, `last_name`, `is_jetc_admin`, `must_change_password`)
- Corrige le trigger `handle_new_user()` pour utiliser le nouveau schéma
- Migre les données `full_name` existantes vers `first_name`/`last_name`
- Rend le trigger idempotent avec `ON CONFLICT DO UPDATE`

#### Profils manquants pour utilisateurs existants

Si des utilisateurs ont été créés avant la migration 0008 et n'ont pas de profil :

```sql
-- Dans SQL Editor, exécutez :
-- supabase/scripts/repair-profiles.sql
```

Ce script :
1. Liste tous les utilisateurs sans profil
2. Crée automatiquement les profils manquants
3. Affiche un résumé avant/après

### 📁 Fichiers de bootstrap

- **Migrations critiques** :
  - [supabase/migrations/0001_foundations.sql](supabase/migrations/0001_foundations.sql) : Tables + trigger initial
  - [supabase/migrations/0007_ensure_profile_function.sql](supabase/migrations/0007_ensure_profile_function.sql) : Fonctions helper
  - **[supabase/migrations/0008_fix_profiles_schema.sql](supabase/migrations/0008_fix_profiles_schema.sql)** : **⚠️ OBLIGATOIRE** - Corrige schéma profiles
  - Fonction `ensure_profile_exists()` : création automatique de profil
  - Fonction `repair_missing_profiles()` : réparation des profils manquants

- **Scripts SQL** :
  - [supabase/scripts/promote-jetc-admin.sql](supabase/scripts/promote-jetc-admin.sql) : Promotion en admin
  - [supabase/scripts/repair-profiles.sql](supabase/scripts/repair-profiles.sql) : Réparation des profils

- **API** : [pages/api/admin/users/create.js](pages/api/admin/users/create.js)
  - Endpoint POST protégé par Bearer token
  - Requiert `is_jetc_admin = true`
  - Crée l'utilisateur avec `auth.admin.createUser()`
  - Génère automatiquement le profil associé

- **Interface** : [pages/dashboard/jetc/users.js](pages/dashboard/jetc/users.js)
  - Formulaire de création d'utilisateurs
  - Liste de tous les utilisateurs avec leur rôle
  - Accès réservé aux JETC admin

- **Vérification** : [scripts/supabase-verify.js](scripts/supabase-verify.js)
  - Diagnostic complet de la base de données
  - Génération de SQL correctif si besoin

## ✅ Statut du projet

Toutes les fonctionnalités du cahier des charges ci-dessous ont été implémentées.

---

# 📋 Cahier des charges (source de vérité)

0) Contexte & règles non négociables

Projet: site ASSEP (École Hubert Reeves, Champagnole) avec authentification + rôles + gestion événements/bénévoles/buvette/trésorerie/communications/dons.

Tech imposée

Next.js (JS uniquement, pas TypeScript) + Supabase (Postgres/Auth/Storage) + Vercel

Migrations SQL idempotentes dans supabase/migrations/

RLS activé partout (multi-rôles)

UI simple et robuste: loading / empty / error sur chaque page

Rôles

president

vice_president

tresorier

vice_tresorier

secretaire

vice_secretaire

(optionnel) membre (utilisateur inscrit / bénévole)

Accès (résumé)

Secrétaire & Vice: créer/éditer événements, buvette (articles/prix/paiements), besoins bénévoles (tâches + plages horaires)

Public: voir événements à venir, s’inscrire bénévole, recevoir email confirmation, dons via QR

Trésorier & Vice: saisir recettes/dépenses par événement + budget global, clôturer événement, solde visible (selon règles)

Président & Vice-président: accès tableau de bord complet + gestion “bureau” + accès “JETC Solution” (admin des rôles/bureau)

Consentement communications: opt-in obligatoire (RGPD): checkbox “j’accepte de recevoir les communications ASSEP”

1) Pages & parcours (MVP)
Public

/ Accueil (présentation + prochains événements + CTA s’inscrire + CTA dons)

/evenements liste événements (à venir, passés)

/evenements/[slug] détail événement:

infos: date/lieu/thème

buvette (si active): liste articles + moyens de paiement acceptés

besoins bénévoles: tâches + créneaux + places restantes

formulaire inscription bénévole: nom, prénom, email, téléphone, choix créneau/tâche, consentement communications (oui/non)

après inscription: page “merci” + email envoyé

/dons dons généraux (QR code)

/dons/evenement/[id] dons liés à un événement (QR code spécifique + compteur)

Espace connecté

/login (Supabase Auth)

/dashboard (selon rôle)

/dashboard/evenements (gestion)

/dashboard/evenements/new (création)

/dashboard/evenements/[id]/benevoles (liste inscrits + export CSV)

/dashboard/evenements/[id]/caisse (recettes CB/cash/chèque + clôture)

/dashboard/tresorerie (recettes/dépenses globales + solde)

/dashboard/communications (rédiger message + envoyer mail aux opt-in)

/dashboard/bureau (président/vice + JETC Solution: gérer les rôles + carte “Le Bureau” = titre/nom/photo)

2) Idées à ajouter (pour éviter les oublis classiques)

Anti-doublon d’inscription: un email ne peut pas s’inscrire 2x au même créneau.

Capacité par créneau: “places restantes” calculées.

Export: CSV bénévoles par événement + CSV trésorerie.

Journal d’audit (qui a modifié quoi): au minimum created_by, updated_by, updated_at.

Clôture événement: une fois clos, recettes modifiables uniquement par trésorier/vice.

Emails: logs d’envoi (status, error_message) + retry manuel.

RGPD: page “mentions légales / confidentialité” + gestion consentement (opt-in stocké, modifiable).

Buvette: stock optionnel (si tu veux) sinon juste liste prix.

Dons: distinguer “promesse” vs “paiement réel” (si on passe par un provider).

3) Schéma DB (SQL) – tables

Créer les tables suivantes:

3.1 profiles

id uuid primary key references auth.users(id) on delete cascade

email text unique

full_name text

phone text null

role text not null check (role in (...))

comms_opt_in boolean not null default false

created_at timestamptz default now()

updated_at timestamptz default now()

3.2 bureau_members (affichage “Le Bureau”)

id uuid pk default gen_random_uuid()

title text not null (Président, Vice-président, Trésorière, etc.)

name text null

photo_url text null (ou storage)

sort_order int not null default 100

is_visible boolean not null default true

audit fields

Règle UI: si name et photo_url vides, afficher seulement title.

3.3 events

id uuid pk default gen_random_uuid()

slug text unique not null

title text not null

theme text null

location text not null

starts_at timestamptz not null

ends_at timestamptz null

has_buvette boolean not null default false

status text not null check (status in ('draft','published','closed','archived')) default 'draft'

audit fields

3.4 event_buvette_items

id uuid pk default gen_random_uuid()

event_id uuid references events(id) on delete cascade

name text not null

price_cents int not null check (price_cents >= 0)

currency text not null default 'EUR'

is_active boolean not null default true

3.5 event_payment_methods

id uuid pk default gen_random_uuid()

event_id uuid references events(id) on delete cascade

method text not null check (method in ('cash','card','cheque','twint','other'))

details text null

unique (event_id, method)

3.6 event_tasks (besoins: mise en place, buvette, sécurité…)

id uuid pk default gen_random_uuid()

event_id uuid references events(id) on delete cascade

label text not null (ex: “Mise en place”, “Service buvette”, “Sécurité”)

description text null

3.7 event_shifts (plages horaires + nb personnes)

id uuid pk default gen_random_uuid()

event_task_id uuid references event_tasks(id) on delete cascade

starts_at timestamptz not null

ends_at timestamptz not null

required_count int not null check (required_count >= 1)

3.8 volunteer_signups

id uuid pk default gen_random_uuid()

event_id uuid references events(id) on delete cascade

shift_id uuid references event_shifts(id) on delete cascade

first_name text not null

last_name text not null

email text not null

phone text null

comms_opt_in boolean not null default false

status text not null check (status in ('pending','confirmed','cancelled')) default 'confirmed'

created_at timestamptz default now()

Contraintes:

unique (shift_id, email) pour éviter doublons.

trigger/constraint pour refuser inscription si shift complet (via fonction).

3.9 event_cashups (recettes par événement)

id uuid pk default gen_random_uuid()

event_id uuid unique references events(id) on delete cascade

cash_cents int not null default 0

card_cents int not null default 0

cheque_cents int not null default 0

other_cents int not null default 0

notes text null

closed_at timestamptz null

audit fields

3.10 ledger_entries (trésorerie globale)

id uuid pk default gen_random_uuid()

type text not null check (type in ('income','expense'))

label text not null

amount_cents int not null check (amount_cents >= 0)

currency text not null default 'EUR'

event_id uuid null references events(id) on delete set null

entry_date date not null default current_date

audit fields

3.11 email_campaigns + email_logs

campaigns: subject, body_html, created_by, status(draft/sent)

logs: to_email, status, error_message, provider_message_id, sent_at

3.12 Dons (option 1 simple, option 2 provider)

Option 1 (si tu as déjà un lien HelloAsso/Stripe): stocker seulement les compteurs manuels:

donation_counters: event_id null, amount_cents_total, updated_by
Option 2 (si paiement intégré Stripe): donations avec provider, checkout_session_id, amount_cents, status

MVP recommandé: QR vers HelloAsso/Stripe + compteur “montant reçu” alimenté via saisie trésorier (réaliste, fiable, pas d’intégration fragile).

4) Sécurité (RLS) – principes
4.1 Fonctions helper

Créer fonctions:

get_my_role() retourne le role du profile courant

is_bureau() true si role in (president, vice_president, tresorier, vice_tresorier, secretaire, vice_secretaire)

can_manage_events() true si role in (secretaire, vice_secretaire, president, vice_president)

can_manage_finance() true si role in (tresorier, vice_tresorier, president, vice_president)

4.2 Policies (résumé)

events: SELECT public uniquement status='published' + connecté bureau voit tout; INSERT/UPDATE seulement can_manage_events()

buvette_items, payment_methods, tasks, shifts: SELECT public si event publié; write seulement can_manage_events()

volunteer_signups: INSERT public (formulaire). SELECT seulement bureau; UPDATE seulement bureau (ex: annulation)

event_cashups + ledger_entries: SELECT bureau; INSERT/UPDATE seulement can_manage_finance(); verrou si event closed_at not null (sauf président/vice)

profiles: chaque user peut lire/éditer son profil (opt-in); président/vice peuvent gérer roles

bureau_members: SELECT public; write président/vice uniquement

email_campaigns/logs: write président/vice + secrétaire/vice (si on leur donne le droit), SELECT bureau

5) Migrations Supabase (ordre strict)

Créer migrations:

0001_foundations.sql
extensions, tables de base (profiles, bureau_members), triggers updated_at

0002_events.sql
events + buvette + tasks + shifts

0003_signups.sql
volunteer_signups + contraintes + function “shift capacity check”

0004_finance.sql
event_cashups + ledger_entries

0005_emails_donations.sql
email_campaigns/logs + donations counters

0006_rls_policies.sql
enable rls + policies + helper functions

Chaque migration doit être idempotente:

create table if not exists

alter table ... add column if not exists

create index if not exists

drop/recreate policies proprement (supprimer si existe, recréer)

6) Supabase: Auth + profil auto

Mettre un trigger on_auth_user_created:

quand un user s’inscrit, créer ligne dans profiles avec role par défaut membre et comms_opt_in=false.

Président/vice attribuent ensuite un rôle via UI admin “JETC Solution”.

7) Emails (confirmation inscription + campagnes)
7.1 Provider

Utiliser un provider simple côté server (Vercel functions):

Resend / SendGrid / Mailgun (choisir 1).
Implémenter lib/email.js qui envoie + log dans email_logs.

7.2 Triggers d’envoi

Sur inscription bénévole: appeler route API POST /api/signups qui:

insère en DB

envoie email de confirmation

retourne succès

Ne pas envoyer depuis le client direct.

8) QR Codes dons

Générer QR code côté UI (lib qrcode) vers:

URL dons généraux (config .env)

URL dons événement (pattern DONATION_EVENT_BASE_URL + event.slug ou ?event_id=...)

Affichage:

/dons QR général

/evenements/[slug] QR spécifique + “montant dons” (si compteur saisi)

9) Variables d’environnement (.env.local + Vercel)

Créer .env.example + doc claire.

9.1 Local: .env.local

Mettre EXACTEMENT:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only
SUPABASE_SERVICE_ROLE_KEY=

# Email provider
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="ASSEP <noreply@votredomaine.fr>"

# Dons
NEXT_PUBLIC_DONATION_GENERAL_URL=
NEXT_PUBLIC_DONATION_EVENT_BASE_URL=

9.2 Où mettre les clés

Local: .env.local à la racine du projet Next

Vercel: Project Settings → Environment Variables → ajouter les mêmes (prod + preview)

Interdiction: committer .env.local.

10) UI: composants indispensables

DataTable événements (filtre statut)

Form builder événement (tabs: infos / buvette / besoins / paiements)

Widget “Besoins bénévoles” (créneaux + compteur places restantes)

Dashboard cards:

prochains événements

total trésorerie (somme ledger)

recettes dernier événement

bénévoles inscrits

11) Script d’analyse erreurs (local + CI)

Créer scripts/doctor.js (Node) qui vérifie:

présence env vars obligatoires

lint/build Next

cohérence migrations: ordre, nommage, doublons

parse SQL basique: détecter ; manquants, create policy sans enable rls

check que chaque table critique a RLS activé et au moins 1 policy (via requêtes Supabase en service role)

check routes API existent: /api/signups, /api/campaigns/send, /api/admin/*

Exécution:

node scripts/doctor.js

12) Livraison attendue (sans discussion)

Repo structuré:

supabase/migrations/*

lib/supabaseClient.js, lib/supabaseServer.js

lib/email.js

scripts/doctor.js

pages Next + dashboard role-based

RLS complet + tests manuels

.env.example + README “Setup local + Vercel + Supabase”

Données seed (optionnel) pour 2 événements exemples

13) Points de contrôle (Copilot doit s’auto-auditer)

Avant de commit:

node scripts/doctor.js OK

npm run build OK

migrations appliquées sur Supabase sans erreur

RLS: public peut s’inscrire bénévole mais ne peut rien lire de sensible

trésorerie modifiable uniquement trésorier/vice/president/vice

FIN.# ASSEP
---

## 📚 Documentation complète

- [SETUP.md](./SETUP.md) - Installation locale pas-à-pas
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Déploiement sur Vercel
- [TESTING.md](./TESTING.md) - Scénarios de test
- [CHECKLIST.md](./CHECKLIST.md) - Liste des livrables
- [COMMANDS.md](./COMMANDS.md) - Aide-mémoire commandes
- [AUDIT-2026-01-26.md](./AUDIT-2026-01-26.md) - Audit sécurité complet
- [RESUME-AUDIT.md](./RESUME-AUDIT.md) - Synthèse audit & corrections

---

## 🔍 Rationale des versions {#deps-rationale}

### Pourquoi Next.js 14.2.35 (sans `^`) ?

**Problème rencontré :**
- `npm audit fix --force` avait mis à jour `eslint-config-next` vers `16.1.4`
- Cette version demande `eslint@>=9.0.0` comme peer dependency
- Le projet utilise `eslint@8.57.1` (stable)
- → Conflit de peer dependency bloquant le build local et Vercel

**Solution appliquée :**
```json
{
  "dependencies": {
    "next": "14.2.35"  // verrouillé (pas de ^)
  },
  "devDependencies": {
    "eslint": "^8.57.1",
    "eslint-config-next": "14.2.35"  // aligné avec next
  },
  "engines": {
    "node": ">=18.17.0",
    "npm": ">=9.0.0"
  }
}
```

**Avantages :**
- ✅ `eslint-config-next@14.2.35` accepte `eslint@^8.0.0`
- ✅ Versions Next.js et eslint-config-next alignées
- ✅ Build local et Vercel fonctionnent sans `--force` ou `--legacy-peer-deps`
- ✅ Sécurité : Next.js 14.2.35 inclut tous les patchs critiques (SSRF, Auth bypass corrigés)

**Vulnérabilités résiduelles :**
- `glob@10.2.0-10.4.5` (high) : utilisé uniquement par eslint-config-next (dev-time)
- Impact : aucun en production (dev dependency uniquement, pas d'exécution CLI)
- Note : corrigé dans eslint-config-next 16.x, mais nécessiterait eslint 9.x

### Migration future vers ESLint 9

Pour upgrader vers ESLint 9 (quand prêt) :
```bash
npm install eslint@^9.0.0 eslint-config-next@^16.0.0
npm run build  # vérifier que tout compile
```

---

## � Déploiement Vercel

### Configuration automatique

Le projet inclut `vercel.json` pour la détection automatique du framework :

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### ⚠️ Erreur "No Output Directory named public"

Si vous voyez cette erreur lors du déploiement :

**Cause :** Vercel n'a pas détecté Next.js et cherche un dossier `public` (site statique).

**Solution :** Vérifier dans Vercel Dashboard → Project Settings :
- **Framework Preset :** Doit être "Next.js" (pas "Other")
- **Output Directory :** Doit être **vide** ou `.next` (jamais "public")
- **Build Command :** `npm run build`

Le fichier `vercel.json` à la racine force la détection Next.js. Ne jamais définir manuellement l'output directory.

### Guide complet

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet avec :
- Configuration Supabase
- Variables d'environnement Vercel
- Création du premier admin
- Tests de validation

---

## �📄 Licence

Projet interne ASSEP - École Hubert Reeves
