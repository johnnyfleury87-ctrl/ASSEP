# 🚀 DÉPLOIEMENT - Corrections 2026-02-02

## 📌 Vue d'ensemble

Ce déploiement corrige 4 fonctionnalités demandées :

1. ✅ **Bénévoles visibles** - Le bureau peut voir qui s'est inscrit
2. ✅ **Suppression événements** - Ajout bouton supprimer (bureau uniquement)
3. ✅ **Inscription membre** - Formulaire déjà complet et fonctionnel
4. ✅ **Solde trésorerie** - Déjà affiché sur page d'accueil

---

## 🔧 Étapes de déploiement

### 1️⃣ Appliquer les migrations SQL

**Option A : Via Supabase Dashboard (recommandé)**

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet ASSEP
3. Aller dans **SQL Editor**
4. Copier-coller le contenu de [`supabase/migrations/APPLY-0017-0018.sql`](supabase/migrations/APPLY-0017-0018.sql)
5. Cliquer sur **RUN**
6. Vérifier que les 3 requêtes de vérification retournent les bonnes policies

**Option B : Via script bash** (si psql disponible)

```bash
cd /workspaces/ASSEP
export DATABASE_URL="postgresql://postgres:[password]@[host]:[port]/postgres"
./scripts/apply-migrations-0017-0018.sh
```

---

### 2️⃣ Redéployer l'application

**Si hébergé sur Vercel:**

```bash
# Les changements sont déjà poussés sur GitHub
# Vercel va automatiquement redéployer
```

**Si hébergement manuel:**

```bash
cd /workspaces/ASSEP
git pull origin main
npm install  # Si nouvelles dépendances (aucune ici)
npm run build
# Redémarrer le serveur
```

---

### 3️⃣ Vérifier les migrations

**Vérifier que les policies RLS sont créées:**

```sql
-- Dans Supabase SQL Editor

-- Vérifier event_volunteers
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'event_volunteers'
ORDER BY policyname;

-- Doit afficher au moins:
-- - event_volunteers_select_bureau
-- - event_volunteers_select_own
-- - event_volunteers_count_public (ou event_volunteers_select_public)

-- Vérifier events DELETE
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'DELETE';

-- Doit afficher:
-- - events_delete_bureau
-- OU events_all_president (qui inclut déjà DELETE)
```

---

### 4️⃣ Tests de validation

Suivre la [checklist complète](TESTS-CHECKLIST-2026-02-02.md) :

#### Test rapide (5 min)

1. **Bénévoles** : Dashboard > Événements > [Événement] > Bénévoles
   - ✅ Affiche le nombre et les noms

2. **Suppression** : Dashboard > Événements
   - ✅ Bouton "🗑️ Supprimer" visible

3. **Inscription** : `/espace-membres`
   - ✅ Bouton "S'inscrire" visible et formulaire complet

4. **Solde** : Page d'accueil `/`
   - ✅ "💰 Solde trésorerie: XXX.XX €" affiché

---

## 📦 Fichiers modifiés/créés

### Code application

- ✏️ [`pages/dashboard/evenements/index.js`](pages/dashboard/evenements/index.js)
  - Ajout bouton "🗑️ Supprimer"
  - Ajout fonction `handleDeleteEvent()`

### Migrations SQL

- ⭐ [`supabase/migrations/0018_fix_events_delete_rls.sql`](supabase/migrations/0018_fix_events_delete_rls.sql) - **NOUVEAU**
  - Policy DELETE pour events (bureau uniquement)

- 📋 [`supabase/migrations/APPLY-0017-0018.sql`](supabase/migrations/APPLY-0017-0018.sql) - **NOUVEAU**
  - Script groupé pour appliquer 0017 + 0018

### Scripts

- 🔧 [`scripts/apply-migrations-0017-0018.sh`](scripts/apply-migrations-0017-0018.sh) - **NOUVEAU**
  - Script bash pour appliquer les migrations

### Documentation

- 📖 [`CORRECTIONS-2026-02-02.md`](CORRECTIONS-2026-02-02.md) - **NOUVEAU**
  - Documentation complète des corrections

- ✅ [`TESTS-CHECKLIST-2026-02-02.md`](TESTS-CHECKLIST-2026-02-02.md) - **NOUVEAU**
  - Checklist détaillée des tests

---

## 🔍 Migrations existantes utilisées

Ces migrations existent déjà et doivent être appliquées **AVANT** 0018 :

- ✅ [`0016_secure_profiles_gdpr.sql`](supabase/migrations/0016_secure_profiles_gdpr.sql)
  - Sécurise l'accès aux données personnelles (profiles)
  - Seuls le bureau + soi-même peuvent voir les profiles

- ✅ [`0017_fix_event_volunteers_rls.sql`](supabase/migrations/0017_fix_event_volunteers_rls.sql)
  - Permet au bureau de voir les bénévoles inscrits
  - Policy pour voir ses propres inscriptions

**⚠️ Important** : L'ordre d'application est crucial : 0016 → 0017 → 0018

---

## ✅ Fonctionnalités déjà implémentées (pas de changement)

### Inscription membre

Le formulaire d'inscription membre est **déjà complet et fonctionnel** :

- Prénom, nom, email, téléphone, mot de passe
- Consentement RGPD obligatoire avec texte explicatif
- Auto-connexion après inscription
- Redirection vers dashboard

**Fichiers** : 
- [`pages/espace-membres.js`](pages/espace-membres.js)
- [`pages/api/auth/signup-member.js`](pages/api/auth/signup-member.js)

### Solde trésorerie

Le solde est **déjà affiché sur la page d'accueil** :

- Récupération via API `/api/treasury/balance`
- Formule : `startingBalance + transactionsTotal`
- Affiché dans le Hero : "💰 Solde trésorerie: XXXX.XX €"

**Fichiers** :
- [`pages/index.js`](pages/index.js) (getServerSideProps)
- [`components/Hero.js`](components/Hero.js)
- [`pages/api/treasury/balance.js`](pages/api/treasury/balance.js)

---

## 🎯 Résultat final attendu

| Fonctionnalité | Avant | Après |
|----------------|-------|-------|
| Bénévoles inscrits | ❌ Affiche 0 | ✅ Affiche nom/prénom/email |
| Suppression événements | ❌ Pas de bouton | ✅ Bouton + confirmation |
| Inscription membre | ✅ Déjà OK | ✅ Toujours OK |
| Solde trésorerie | ✅ Déjà OK | ✅ Toujours OK |

---

## 🐛 Troubleshooting

### Les bénévoles ne s'affichent toujours pas

1. **Vérifier les migrations appliquées:**
   ```sql
   SELECT version FROM supabase_migrations ORDER BY version DESC LIMIT 5;
   ```

2. **Vérifier les policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('event_volunteers', 'profiles');
   ```

3. **Vérifier le rôle de l'utilisateur:**
   ```sql
   SELECT id, email, role, is_jetc_admin FROM profiles WHERE email = 'votre.email@example.com';
   ```

### Le bouton supprimer n'apparaît pas

1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Vérifier que l'utilisateur est membre du bureau (rôle president/secretaire/etc.)
3. Vérifier la console browser (F12) pour erreurs JavaScript

### Erreur lors de la suppression

1. Vérifier la policy DELETE en base
2. Vérifier que l'événement n'a pas de contraintes bloquantes
3. Regarder les logs Supabase pour l'erreur exacte

---

## 📞 Support

- 📖 Documentation complète : [CORRECTIONS-2026-02-02.md](CORRECTIONS-2026-02-02.md)
- ✅ Checklist tests : [TESTS-CHECKLIST-2026-02-02.md](TESTS-CHECKLIST-2026-02-02.md)
- 🔧 Script migrations : [scripts/apply-migrations-0017-0018.sh](scripts/apply-migrations-0017-0018.sh)

---

**Date** : 2026-02-02  
**Version** : 1.0  
**Statut** : ✅ Prêt pour déploiement
