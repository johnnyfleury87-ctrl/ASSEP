# ⚡ ACTION IMMÉDIATE REQUISE

## 🚨 Problème actuel
L'erreur `Missing Supabase credentials` sur Vercel est due à l'**absence de variables d'environnement** sur la plateforme de déploiement.

---

## ✅ SOLUTION EN 3 ÉTAPES (5 minutes max)

### Étape 1️⃣ : Accéder à Vercel
🔗 [https://vercel.com/dashboard](https://vercel.com/dashboard)

1. Cliquer sur le projet **ASSEP**
2. Cliquer sur **Settings** (onglet du haut)
3. Cliquer sur **Environment Variables** (menu gauche)

### Étape 2️⃣ : Ajouter les 3 variables

Cliquer 3 fois sur le bouton **"Add"** et remplir :

#### ✅ Variable 1
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://ifpsqzaskcfyoffcaagk.supabase.co
Environments: ☑️ Production  ☑️ Preview  ☑️ Development
```

#### ✅ Variable 2
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Mzg4NTQsImV4cCI6MjA4NTAxNDg1NH0.EayrZ5LEn9nkPOONqahAplC0t2IO7KftbatgZLEm1dA
Environments: ☑️ Production  ☑️ Preview  ☑️ Development
```

#### ✅ Variable 3
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQzODg1NCwiZXhwIjoyMDg1MDE0ODU0fQ.K4009aYPrqC5MAKWguJAt6XOEzymztzv1iRuugP3T7A
Environments: ☑️ Production  ☑️ Preview  ☑️ Development
```

⚠️ **IMPORTANT** : Cocher **les 3 cases** pour chaque variable !

### Étape 3️⃣ : Redéployer

**Option A** - Automatique (recommandé, déjà fait ✅)
```bash
# Les changements ont déjà été poussés sur GitHub
# Vercel redéploie automatiquement
```

**Option B** - Manuel (si nécessaire)
1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur les **3 points** `⋯` → **Redeploy**
4. ✅ Confirmer

---

## 🎉 Vérification post-déploiement

Attendre ~2 minutes puis vérifier :

1. ✅ La page [votre-domaine.vercel.app/espace-membres](https://votre-domaine.vercel.app/espace-membres) s'affiche
2. ✅ Pas d'erreur "Missing Supabase credentials"
3. ✅ Les boutons "Connexion" et "S'inscrire" sont visibles
4. ✅ L'inscription fonctionne

---

## 📦 Fichiers créés

- ✅ [FIX-VERCEL-ENV.md](FIX-VERCEL-ENV.md) - Guide rapide
- ✅ [VERCEL-ENV-CONFIG.md](VERCEL-ENV-CONFIG.md) - Documentation complète
- ✅ [scripts/configure-vercel-env.sh](scripts/configure-vercel-env.sh) - Script CLI automatisé

---

## 🔍 Pourquoi ce problème ?

Les variables d'environnement fonctionnent **localement** (dans `.env.local`) mais **pas sur Vercel**.

Vercel a besoin que vous **configuriez manuellement** ces variables dans son interface ou via CLI.

---

## ❓ Problème persistant ?

Si l'erreur continue après avoir tout configuré :

1. Vérifier que les 3 variables sont **bien présentes** dans Vercel
2. Vérifier que **les 3 environnements sont cochés** pour chaque variable
3. Forcer un nouveau build (pas juste Redeploy) : 
   - Faire un changement mineur dans le code
   - Commiter et pusher
4. Vérifier les **logs de build** dans Vercel → Deployments → cliquer sur le build → voir les logs

---

**Date** : 2026-02-02  
**Commit** : 23867ab  
**Statut** : ✅ Code poussé, en attente de configuration Vercel
