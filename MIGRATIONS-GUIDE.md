# 🔧 Guide d'Application des Migrations Supabase

## ⚠️ IMPORTANT - Ordre et Méthode

### Migrations à exécuter via Dashboard Supabase (SQL Editor)

**TOUTES les migrations doivent être exécutées via le Dashboard Supabase pour éviter les problèmes de permissions.**

## 📋 Procédure Complète (RECOMMANDÉE)

### Étape 1: Ouvrir le Dashboard Supabase

1. Aller sur [supabase.com](https://supabase.com)
2. Ouvrir votre projet ASSEP
3. Dans le menu latéral, cliquer sur **SQL Editor**

### Étape 2: Exécuter les migrations dans l'ordre

Pour chaque migration ci-dessous:
1. Ouvrir le fichier dans votre éditeur local
2. Copier TOUT le contenu du fichier
3. Coller dans le SQL Editor du Dashboard
4. Cliquer sur **Run** (ou `Ctrl+Enter`)
5. Vérifier que le message est vert (succès) ✅
6. Passer à la migration suivante

#### Ordre d'exécution:

```
1️⃣  supabase/migrations/0001_foundations.sql
    ✅ Crée: profiles, bureau_members
    
2️⃣  supabase/migrations/0002_events.sql
    ✅ Crée: events, event_shifts, event_volunteers, event_tasks
    
3️⃣  supabase/migrations/0003_signups.sql
    ✅ Crée: signups
    
4️⃣  supabase/migrations/0004_finance.sql
    ✅ Crée: transactions
    
5️⃣  supabase/migrations/0005_emails_donations.sql
    ✅ Crée: email_campaigns, donations
    
6️⃣  supabase/migrations/0006_rls_policies.sql
    ✅ Crée: Policies RLS + fonctions helper
    
7️⃣  supabase/migrations/0007_auth_profiles_trigger.sql
    ✅ Crée: Fonctions helper pour création de profils
    ℹ️  Plus de trigger sur auth.users (problème de permissions résolu)
    ℹ️  Les profils sont créés explicitement dans l'API
    
8️⃣  supabase/migrations/0008_admin_helpers.sql
    ✅ Crée: Fonctions SQL admin (approve_event, etc.)
```

## ⚠️ Migration 0007 - Ancienne Erreur Résolue

**Ancien problème**: Erreur `must be owner of relation users` lors de la création d'un trigger sur `auth.users`.

**Nouvelle solution**: La migration 0007 n'utilise **plus de trigger**. À la place:
- Les profils sont créés explicitement dans l'API (`create_profile_for_user`)
- Une fonction de synchronisation `sync_auth_users_to_profiles()` répare automatiquement
- Plus de problème de permissions!

## ✅ Vérification après chaque migration

Après chaque migration, vous pouvez vérifier dans le Dashboard:

1. Aller dans **Database** → **Tables**
2. Vérifier que les nouvelles tables apparaissent
3. Aller dans **Database** → **Functions**
4. Vérifier que les fonctions sont créées

## 🛠️ Méthode Alternative (CLI)

```bash
# Maintenant possible d'exécuter toutes les migrations via CLI
supabase db push

# ✅ Aucun problème, la migration 0007 ne crée plus de trigger
```

## 🔍 Vérification Finale

Une fois les 8 migrations exécutées, vérifier:

```sql
-- Vérifier les fonctions créées
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Devrait inclure: create_profile_for_user, sync_auth_users_to_profiles,
-- is_jetc_admin, approve_event, change_user_role, etc.
```

## ❓ En cas de problème

1. Vérifier que vous êtes bien sur le **bon projet Supabase**
2. Vérifier l'**ordre d'exécution** (1→8)
3. Si profil manquant après création user Dashboard: Exécuter `repair_profiles.sql`
4. Si erreur RLS: Continuer, sera résolu après création du 1er user

## 🎯 Checklist Complète

- [ ] Migrations 1-8 exécutées (dans l'ordre)
- [ ] Fonction `create_profile_for_user` existe
- [ ] Fonction `sync_auth_users_to_profiles` existe
- [ ] 10 tables créées dans `public` schema
- [ ] Prêt pour créer le 1er user JETC

---

**Une fois les migrations OK, passer à l'étape suivante: Création du premier utilisateur JETC** (voir SETUP.md)
