# Guide de déploiement - Migration 0009 JETC

## 🎯 Objectif

Appliquer la migration `0009_jetc_roles_admin.sql` sur votre instance Supabase en production pour activer la gestion des rôles JETC.

---

## ⚠️ Pré-requis

- [x] Build local réussi (`npm run build`)
- [x] Code commité sur Git
- [x] Accès au Dashboard Supabase (ou CLI Supabase)
- [x] Compte avec privilèges admin sur Supabase

---

## 📋 Option 1: Via Dashboard Supabase (Recommandé)

### Étape 1: Connexion au Dashboard

1. Ouvrir https://app.supabase.com
2. Sélectionner le projet ASSEP
3. Aller dans **SQL Editor**

### Étape 2: Copier le contenu de la migration

```bash
# Depuis votre terminal local
cat supabase/migrations/0009_jetc_roles_admin.sql
```

OU ouvrir le fichier dans VS Code et copier tout le contenu.

### Étape 3: Exécuter la migration

1. Dans SQL Editor, cliquer sur **New query**
2. Coller le contenu de `0009_jetc_roles_admin.sql`
3. Cliquer sur **Run** (▶️)

### Étape 4: Vérifier l'exécution

Exécuter ces requêtes pour vérifier:

```sql
-- Vérifier les fonctions créées
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_jetc_admin', 'change_user_role', 'set_must_change_password');

-- Vérifier les policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'profiles';
```

**Résultats attendus:**
- 3 fonctions retournées (is_jetc_admin, change_user_role, set_must_change_password)
- 4 policies pour `profiles`:
  - `Users can view their own profile`
  - `JETC admins can view all profiles`
  - `Users can update their own profile`
  - `JETC admins can update all profiles`

---

## 📋 Option 2: Via CLI Supabase

### Étape 1: Installation CLI

```bash
npm install -g supabase
```

### Étape 2: Login

```bash
supabase login
```

### Étape 3: Link au projet

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Pour trouver `YOUR_PROJECT_REF`:
- Dashboard Supabase > Settings > General > Reference ID

### Étape 4: Appliquer la migration

```bash
supabase db push
```

Cette commande:
- Détecte les nouvelles migrations (0009)
- Applique uniquement celles non encore exécutées
- Affiche le statut de chaque migration

---

## ✅ Vérifications post-déploiement

### 1. Tester avec un compte JETC admin

```bash
# Se connecter au Dashboard avec un compte ayant is_jetc_admin = true
# Accéder à: https://votre-app.vercel.app/dashboard/jetc/users
```

**Attendu:**
- Page chargée sans erreur
- Liste des utilisateurs visible
- Formulaire de création d'utilisateur présent

### 2. Tester le changement de rôle

1. Sélectionner un utilisateur dans la liste
2. Changer son rôle via le dropdown
3. Cliquer ailleurs pour sauvegarder

**Attendu:**
- Alert "✅ Rôle mis à jour"
- Rôle modifié dans la liste

### 3. Tester "Forcer changement MDP"

1. Cliquer sur "Forcer chg. MDP" pour un utilisateur
2. Vérifier l'alert de confirmation

**Attendu:**
- Alert "✅ L'utilisateur devra changer son mot de passe..."
- Badge "Changer MDP" visible dans la colonne Statut

### 4. Créer un utilisateur de test

1. Remplir le formulaire:
   - Email: `test-jetc@example.com`
   - Prénom: `Test`
   - Nom: `JETC`
   - Rôle: `membre`
2. Cliquer sur "Créer l'utilisateur"

**Attendu:**
- Message "✅ Utilisateur créé: test-jetc@example.com - Mot de passe temporaire: ASSEP1234!"
- Utilisateur visible dans la liste
- Badge "Changer MDP" présent

### 5. Vérifier les logs console

Ouvrir la console du navigateur (F12) et vérifier:
- ❌ Aucun `console.log` de password
- ✅ Aucune erreur 404/400 pour tables inexistantes
- ✅ Toutes les requêtes Supabase en 200

---

## 🐛 Troubleshooting

### Erreur: "Permission denied for function"

**Cause:** Les grants ne sont pas appliqués correctement.

**Solution:**
```sql
GRANT EXECUTE ON FUNCTION public.is_jetc_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_must_change_password(UUID, BOOLEAN) TO authenticated;
```

### Erreur: "Function does not exist"

**Cause:** La migration n'a pas été appliquée ou a échoué.

**Solution:**
1. Vérifier les logs de la migration dans Dashboard > Logs
2. Réexécuter la migration manuellement
3. Vérifier avec:
```sql
SELECT * FROM supabase_migrations.schema_migrations;
```

### Erreur 403 sur /dashboard/jetc/users

**Cause:** L'utilisateur n'est pas JETC admin.

**Solution:**
```sql
-- Via Dashboard Supabase > SQL Editor
UPDATE profiles 
SET is_jetc_admin = true 
WHERE email = 'votre-email@example.com';
```

### RPC change_user_role échoue

**Cause:** Policy RLS bloque l'accès.

**Solution:**
Vérifier que les policies sont bien créées:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Si manquantes, réexécuter la partie policies de la migration.

---

## 🔄 Rollback (en cas de problème)

Si la migration pose problème, voici comment revenir en arrière:

```sql
-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.is_jetc_admin();
DROP FUNCTION IF EXISTS public.change_user_role(UUID, TEXT);
DROP FUNCTION IF EXISTS public.set_must_change_password(UUID, BOOLEAN);

-- Supprimer les policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "JETC admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "JETC admins can update all profiles" ON public.profiles;

-- Recréer les anciennes policies (si nécessaire)
-- Voir migration 0006_rls_policies.sql
```

---

## 📊 Checklist finale

Avant de marquer le déploiement comme terminé:

- [ ] Migration 0009 appliquée sans erreur
- [ ] Fonctions `is_jetc_admin`, `change_user_role`, `set_must_change_password` créées
- [ ] RLS policies mises à jour (4 policies sur `profiles`)
- [ ] Page `/dashboard/jetc/users` accessible en tant que JETC admin
- [ ] Changement de rôle fonctionne
- [ ] Bouton "Forcer chg. MDP" fonctionne
- [ ] Création d'utilisateur fonctionne
- [ ] Aucun password dans les logs console
- [ ] Aucune erreur 404/400 pour tables
- [ ] Build production OK (`npm run build`)
- [ ] Code déployé sur Vercel/serveur

---

## 📞 Support

En cas de problème:
1. Vérifier les logs Supabase: Dashboard > Logs
2. Vérifier les logs Vercel (si applicable)
3. Exécuter le script de vérification:
   ```bash
   node scripts/verify-jetc-fix.js
   ```
4. Consulter la documentation: `FIX-JETC-2026-01-26.md`

---

**Date de création:** 26 janvier 2026  
**Version:** 1.0  
**Migration:** 0009_jetc_roles_admin.sql
