# 🚨 ERREUR RESOLUE : Missing Supabase credentials

## 🎯 Problème
Erreur sur Vercel : `Error: Missing Supabase credentials`

## ✅ Solution

### Option 1 : Interface Vercel (Recommandé - 2 minutes)

1. **Aller sur Vercel Dashboard** : [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. **Sélectionner le projet ASSEP**
3. **Settings** → **Environment Variables**
4. **Ajouter 3 variables** (bouton "Add") :

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://ifpsqzaskcfyoffcaagk.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Mzg4NTQsImV4cCI6MjA4NTAxNDg1NH0.EayrZ5LEn9nkPOONqahAplC0t2IO7KftbatgZLEm1dA
Environments: ✅ Production ✅ Preview ✅ Development
```

```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQzODg1NCwiZXhwIjoyMDg1MDE0ODU0fQ.K4009aYPrqC5MAKWguJAt6XOEzymztzv1iRuugP3T7A
Environments: ✅ Production ✅ Preview ✅ Development
```

5. **Redéployer** :
   - Aller dans **Deployments**
   - Cliquer sur le dernier déploiement → `...` → **Redeploy**

### Option 2 : Via Vercel CLI

Si vous avez Vercel CLI installé :

```bash
cd /workspaces/ASSEP
./scripts/configure-vercel-env.sh
git push  # Déclenche un redéploiement auto
```

---

## 📋 Checklist post-configuration

- [ ] Les 3 variables sont ajoutées sur Vercel
- [ ] Elles sont activées pour **tous les environnements** (Production + Preview + Development)
- [ ] Un redéploiement a été effectué
- [ ] La page `/espace-membres` fonctionne sans erreur
- [ ] L'inscription membre fonctionne

---

## 📚 Documentation complète

Voir [VERCEL-ENV-CONFIG.md](VERCEL-ENV-CONFIG.md) pour plus de détails.
