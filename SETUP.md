# GUIDE DE DÉMARRAGE - ASSEP

## 📋 Prérequis

- Node.js 18+ installé
- Compte Supabase (https://supabase.com)
- Compte Resend pour les emails (https://resend.com)
- Compte Vercel pour le déploiement (https://vercel.com)

## 🚀 Installation locale

### 1. Cloner le projet et installer les dépendances

```bash
git clone <url-du-repo>
cd ASSEP
npm install
```

### 2. Configurer Supabase

1. Créer un nouveau projet sur https://app.supabase.com
2. Aller dans **Project Settings → API**
3. Copier:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ gardez-la secrète!)

### 3. Appliquer les migrations

Dans Supabase Dashboard → **SQL Editor**, exécuter dans l'ordre:

```sql
-- Copier/coller le contenu de chaque fichier dans l'ordre:
supabase/migrations/0001_foundations.sql
supabase/migrations/0002_events.sql
supabase/migrations/0003_signups.sql
supabase/migrations/0004_finance.sql
supabase/migrations/0005_emails_donations.sql
supabase/migrations/0006_rls_policies.sql
```

### 4. Configurer les variables d'environnement

```bash
cp .env.example .env.local
```

Éditer `.env.local` et remplir toutes les valeurs.

### 5. Lancer en local

```bash
npm run dev
```

Ouvrir http://localhost:3000

## 📧 Configuration Resend (Emails)

1. Créer un compte sur https://resend.com
2. Vérifier votre domaine (ou utiliser leur domaine de test)
3. Créer une API Key dans **API Keys**
4. Copier la clé dans `RESEND_API_KEY`

## 🔐 Créer le premier utilisateur admin

1. S'inscrire via Supabase Auth UI ou directement depuis l'interface
2. Dans Supabase → **Table Editor → profiles**
3. Trouver votre profil et changer `role` de `membre` à `president`

## 📦 Déploiement Vercel

### 1. Connecter le repo GitHub

1. Aller sur https://vercel.com/new
2. Importer le repository GitHub
3. Vercel détectera automatiquement Next.js

### 2. Configurer les variables d'environnement

Dans **Project Settings → Environment Variables**, ajouter TOUTES les variables de `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_DONATION_GENERAL_URL`
- `NEXT_PUBLIC_DONATION_EVENT_BASE_URL`

⚠️ Pour les variables `NEXT_PUBLIC_*`, cocher **Production, Preview, Development**
⚠️ Pour les autres (secrètes), cocher uniquement **Production**

### 3. Déployer

```bash
git push origin main
```

Vercel déploie automatiquement à chaque push.

## 🛠️ Commandes utiles

```bash
# Lancer en développement
npm run dev

# Build de production (test)
npm run build

# Lancer après build
npm start

# Vérifier la santé du projet
npm run doctor
```

## 🔍 Script de diagnostic

```bash
npm run doctor
```

Vérifie:
- Variables d'environnement présentes
- Migrations SQL valides
- Routes API créées
- RLS activé sur les tables

## 📚 Structure du projet

```
ASSEP/
├── pages/
│   ├── index.js                    # Accueil public
│   ├── login.js                    # Connexion
│   ├── evenements/
│   │   ├── index.js               # Liste événements
│   │   └── [slug].js              # Détail + inscription bénévole
│   ├── dons/
│   │   ├── index.js               # Dons généraux
│   │   └── evenement/[id].js      # Dons spécifiques
│   ├── dashboard/
│   │   ├── index.js               # Dashboard principal
│   │   ├── evenements/            # Gestion événements
│   │   ├── tresorerie.js          # Trésorerie
│   │   ├── communications.js      # Emails
│   │   └── bureau.js              # Admin
│   └── api/
│       ├── signups.js             # Inscription bénévole
│       ├── campaigns/send.js      # Envoi emails
│       └── admin/                 # Routes admin
├── lib/
│   ├── supabaseClient.js          # Client Supabase (browser)
│   ├── supabaseServer.js          # Server Supabase (SSR/API)
│   └── email.js                   # Service d'envoi emails
├── supabase/migrations/           # Migrations SQL
├── scripts/
│   └── doctor.js                  # Script diagnostic
├── .env.example                   # Template variables
└── README.md                      # Ce fichier
```

## 🎯 Fonctionnalités implémentées

✅ Authentification Supabase
✅ Gestion multi-rôles (président, trésorier, secrétaire, etc.)
✅ Événements publics avec inscription bénévole
✅ Email de confirmation automatique
✅ Gestion de la buvette par événement
✅ Caisse (recettes CB/cash/chèque)
✅ Trésorerie globale (recettes/dépenses)
✅ QR codes dons (généraux + par événement)
✅ Export CSV (bénévoles, trésorerie)
✅ RLS complet sur toutes les tables
✅ Anti-doublon inscriptions
✅ Vérification capacité créneaux

## 🔐 Sécurité (RLS)

Toutes les tables sont protégées par Row Level Security:

- **Public** peut uniquement:
  - Lire les événements publiés
  - S'inscrire comme bénévole
  - Voir les compteurs de dons
  
- **Bureau** (tous rôles) peut:
  - Lire toutes les données internes
  
- **Secrétaire/Vice** peuvent:
  - Créer/modifier des événements
  - Gérer les bénévoles
  
- **Trésorier/Vice** peuvent:
  - Gérer la caisse
  - Gérer la trésorerie
  
- **Président/Vice** peuvent:
  - Tout faire
  - Modifier les rôles
  - Gérer le bureau

## 🐛 Troubleshooting

### Erreur "Missing Supabase environment variables"
→ Vérifier que `.env.local` existe et contient les bonnes variables

### Erreur de connexion Supabase
→ Vérifier les clés API dans Supabase Dashboard → Settings → API

### Emails non envoyés
→ Vérifier `RESEND_API_KEY` et que le domaine est vérifié sur Resend

### RLS bloque mes requêtes
→ Vérifier que l'utilisateur a le bon rôle dans la table `profiles`

### Build échoue sur Vercel
→ Vérifier toutes les variables d'environnement dans Project Settings

## 📞 Support

Pour toute question technique, consulter:
- Documentation Supabase: https://supabase.com/docs
- Documentation Next.js: https://nextjs.org/docs
- Documentation Resend: https://resend.com/docs

---

**Projet réalisé pour l'École Hubert Reeves - Champagnole**
Association ASSEP © 2026
