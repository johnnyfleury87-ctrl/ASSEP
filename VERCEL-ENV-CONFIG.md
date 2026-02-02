# 🚀 Configuration des variables d'environnement Vercel

## ⚠️ Problème actuel

Erreur : `Missing Supabase credentials` sur la page déployée.

**Cause** : Les variables d'environnement Supabase ne sont pas configurées sur Vercel.

---

## ✅ Solution : Configurer les variables sur Vercel

### 1️⃣ Accéder aux paramètres Vercel

1. Aller sur [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **ASSEP**
3. Cliquer sur **Settings** (onglet en haut)
4. Dans le menu latéral, cliquer sur **Environment Variables**

### 2️⃣ Ajouter les variables Supabase

Ajouter **3 variables** avec les valeurs suivantes :

#### Variable 1 : NEXT_PUBLIC_SUPABASE_URL

- **Name** : `NEXT_PUBLIC_SUPABASE_URL`
- **Value** : `https://ifpsqzaskcfyoffcaagk.supabase.co`
- **Environments** : ✅ Production ✅ Preview ✅ Development

#### Variable 2 : NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Mzg4NTQsImV4cCI6MjA4NTAxNDg1NH0.EayrZ5LEn9nkPOONqahAplC0t2IO7KftbatgZLEm1dA`
- **Environments** : ✅ Production ✅ Preview ✅ Development

#### Variable 3 : SUPABASE_SERVICE_ROLE_KEY (SECRET - côté serveur uniquement)

- **Name** : `SUPABASE_SERVICE_ROLE_KEY`
- **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQzODg1NCwiZXhwIjoyMDg1MDE0ODU0fQ.K4009aYPrqC5MAKWguJAt6XOEzymztzv1iRuugP3T7A`
- **Environments** : ✅ Production ✅ Preview ✅ Development

---

## 3️⃣ Vérification importante

### ✅ Variables client (exposées au navigateur)

Ces variables **doivent** avoir le préfixe `NEXT_PUBLIC_` :

- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 🔒 Variable serveur (secrète)

Cette variable **ne doit PAS** avoir le préfixe `NEXT_PUBLIC_` :

- ✅ `SUPABASE_SERVICE_ROLE_KEY` (sans préfixe)

---

## 4️⃣ Redéploiement après configuration

Une fois les variables ajoutées, il faut **redéployer** pour qu'elles soient prises en compte :

### Option A : Redéploiement automatique via Git

```bash
git add .
git commit -m "docs: add Vercel env config guide"
git push
```

Vercel redéploiera automatiquement.

### Option B : Redéploiement manuel depuis Vercel

1. Aller sur le Dashboard Vercel
2. Sélectionner le projet ASSEP
3. Cliquer sur l'onglet **Deployments**
4. Trouver le dernier déploiement
5. Cliquer sur les 3 points `...` → **Redeploy**

---

## 5️⃣ Vérification post-déploiement

Après le redéploiement, vérifier :

1. ✅ La page [/espace-membres](https://votre-domaine.vercel.app/espace-membres) s'affiche sans erreur
2. ✅ L'inscription membre fonctionne
3. ✅ La connexion fonctionne
4. ✅ Pas d'erreur "Missing Supabase credentials"

---

## 📝 Variables optionnelles (pour plus tard)

Si vous utilisez d'autres services, ajoutez aussi :

### Email (Resend)

- `EMAIL_PROVIDER` : `resend`
- `RESEND_API_KEY` : votre clé API Resend
- `EMAIL_FROM` : `"ASSEP <noreply@votredomaine.fr>"`

### Dons (HelloAsso)

- `NEXT_PUBLIC_DONATION_GENERAL_URL` : URL du formulaire de dons
- `NEXT_PUBLIC_DONATION_EVENT_BASE_URL` : URL de base pour les dons événements

---

## ❓ Besoin d'aide ?

Si l'erreur persiste après configuration :

1. Vérifier que les 3 variables sont bien présentes dans Vercel
2. Vérifier qu'elles sont activées pour **tous les environnements**
3. Forcer un nouveau déploiement (pas juste un "Redeploy")
4. Vérifier les logs de build dans Vercel → Deployments → cliquer sur le déploiement → voir les logs

---

**Date de création** : 2026-02-02  
**Dernière mise à jour** : 2026-02-02
