# Scripts utilitaires ASSEP

## 🚀 Scripts disponibles

### 1. `check-and-create-bucket.js` ✅ **Principal**

**Usage** :
```bash
node scripts/check-and-create-bucket.js
```

**Description** :
- Vérifie si le bucket Storage `event-photos` existe
- Crée le bucket automatiquement si manquant
- Utilise les credentials depuis `.env.local`
- Idempotent (peut être exécuté plusieurs fois)

**Prérequis** :
- Fichier `.env.local` avec :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

**Exemple de sortie** :
```
✅ Variables d environnement OK
   SUPABASE_URL: https://xxx.supabase.co

✅ Bucket "event-photos" créé avec succès !
   ID: event-photos
   Public: false
   Limite taille: 5242880 bytes (5MB)
```

---

### 2. `setup-storage.sh`

**Usage** :
```bash
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_KEY=eyJxxx \
./scripts/setup-storage.sh
```

**Description** :
- Version Bash du script Node.js
- Utilise curl pour appeler l'API Supabase
- Crée le bucket `event-photos`

**Prérequis** :
- curl installé
- Variables d'environnement passées en ligne de commande

---

### 3. `check-auth-flow.js`

**Usage** :
```bash
node scripts/check-auth-flow.js
```

**Description** :
- Vérifie le flux d'authentification
- Teste la création de profil automatique
- Valide les triggers auth

---

### 4. `check-trigger.js`

**Usage** :
```bash
node scripts/check-trigger.js
```

**Description** :
- Vérifie les triggers de base de données
- Teste les fonctions automatiques

---

### 5. `doctor.js`

**Usage** :
```bash
node scripts/doctor.js
```

**Description** :
- Diagnostic complet du système
- Vérifie toutes les dépendances
- Teste les connexions Supabase

---

### 6. `supabase-verify.js`

**Usage** :
```bash
node scripts/supabase-verify.js
```

**Description** :
- Vérifie la configuration Supabase
- Teste les credentials
- Valide les tables principales

---

### 7. `verify-jetc-fix.js`

**Usage** :
```bash
node scripts/verify-jetc-fix.js
```

**Description** :
- Vérifie les corrections JETC
- Teste les rôles admin
- Valide les permissions

---

## 📋 Scripts SQL (dossier supabase/scripts/)

### `bootstrap_jetc_admin.sql`

Initialise un utilisateur admin JETC

### `confirm_user.sql`

Confirme manuellement un utilisateur

### `create_profile_for_dashboard_user.sql`

Crée un profil pour un utilisateur existant

### `repair_profiles.sql`

Répare les profils corrompus

### `seed.sql`

Données de test

### `check_migrations_status.sql` ✅ **Important**

**Usage via psql** :
```bash
psql "$DATABASE_URL" -f supabase/scripts/check_migrations_status.sql
```

**Description** :
- Vérifie quelles migrations sont appliquées
- Liste les tables créées
- Vérifie les triggers et policies
- Vérifie l'existence du bucket Storage
- Affiche un résumé complet

**Exemple de sortie** :
```
╔════════════════════════════════════════════════════════════════════════╗
║ VÉRIFICATION DES MIGRATIONS APPLIQUÉES                                  ║
╚════════════════════════════════════════════════════════════════════════╝

📋 Migrations appliquées :
  0001_foundations
  0002_events
  ...
  0011_events_buvette
  0012_events_photos

✅ RÉSUMÉ :
  events table | ✅ OK | Migration 0002
  buvette_active column | ✅ OK | Migration 0011
  event_photos table | ✅ OK | Migration 0012
  event-photos bucket | ✅ OK | Configuration manuelle
```

### `setup_storage_bucket.sql`

Instructions SQL pour configurer le bucket Storage (info uniquement, ne peut pas être exécuté directement)

---

## 🔧 Maintenance

### Ordre recommandé lors du setup initial

1. **Vérifier migrations** :
   ```bash
   psql "$DATABASE_URL" -f supabase/scripts/check_migrations_status.sql
   ```

2. **Créer bucket Storage** :
   ```bash
   node scripts/check-and-create-bucket.js
   ```

3. **Configurer Storage Policies** (manuel via Dashboard)
   - Voir : docs/ACTIONS-REQUISES-STORAGE.md

4. **Tester connexion** :
   ```bash
   node scripts/supabase-verify.js
   ```

5. **Diagnostic complet** :
   ```bash
   node scripts/doctor.js
   ```

---

## 📝 Ajouter un nouveau script

1. Créer le fichier dans `scripts/`
2. Ajouter le shebang : `#!/usr/bin/env node` ou `#!/bin/bash`
3. Rendre exécutable : `chmod +x scripts/nom-du-script.js`
4. Documenter ici
5. Tester en local
6. Commit

---

## 🆘 Aide

Si un script ne fonctionne pas :

1. Vérifier `.env.local` existe et contient les bonnes valeurs
2. Vérifier la connexion réseau (scripts appellent API Supabase)
3. Vérifier les permissions (certains scripts nécessitent `SUPABASE_SERVICE_ROLE_KEY`)
4. Consulter les logs d'erreur
5. Voir la documentation associée dans `docs/`

---

**Dernière mise à jour** : 2026-01-27
