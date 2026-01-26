# 🚀 Guide de déploiement Vercel - ASSEP

## Prérequis

- Compte GitHub avec le repo ASSEP
- Compte Vercel (https://vercel.com)
- Compte Supabase configuré avec migrations appliquées
- Compte Resend configuré

## Étape 1: Préparer Supabase

### 1.1 Appliquer les migrations

Dans Supabase Dashboard → **SQL Editor**:

1. Ouvrir `supabase/migrations/0001_foundations.sql`
2. Copier/coller le contenu
3. Cliquer sur **Run**
4. Répéter pour les fichiers 0002 à 0006 **dans l'ordre**

### 1.2 Récupérer les clés API

Dans Supabase → **Project Settings → API**:

- `Project URL` → sera `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` → sera `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` → sera `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Gardez-la secrète!

## Étape 2: Configurer Resend

1. Aller sur https://resend.com/api-keys
2. Créer une nouvelle API Key
3. Copier la clé → sera `RESEND_API_KEY`
4. Configurer le domaine d'envoi:
   - Si vous avez un domaine: le vérifier dans Resend
   - Sinon: utiliser leur domaine de test (`onboarding@resend.dev`)

## Étape 3: Déployer sur Vercel

### 3.1 Importer le projet

1. Aller sur https://vercel.com/new
2. Cliquer sur **Import Git Repository**
3. Sélectionner votre repo GitHub `ASSEP`
4. Vercel détecte automatiquement Next.js

### 3.2 Configurer les variables d'environnement

Dans la section **Environment Variables**, ajouter:

#### Variables publiques (cocher Production + Preview + Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
NEXT_PUBLIC_DONATION_GENERAL_URL=https://helloasso.com/...
NEXT_PUBLIC_DONATION_EVENT_BASE_URL=https://helloasso.com/...?event=
```

#### Variables secrètes (cocher uniquement Production):

```
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
RESEND_API_KEY=votre_resend_api_key
EMAIL_FROM=ASSEP <noreply@votredomaine.fr>
```

### 3.3 Déployer

1. Cliquer sur **Deploy**
2. Attendre la fin du build (~2-3 minutes)
3. Vercel vous donne une URL de production: `https://assep.vercel.app`

## Étape 4: Créer le premier admin

### 4.1 S'inscrire

1. Aller sur votre site Vercel: `https://votre-projet.vercel.app/login`
2. **Option A:** Utiliser Supabase Dashboard → Authentication → Add User
3. **Option B:** Implémenter une page d'inscription (signup) si nécessaire

### 4.2 Promouvoir en président

Dans Supabase Dashboard:

1. Aller dans **Table Editor → profiles**
2. Trouver votre utilisateur
3. Modifier la colonne `role` de `membre` à `president`
4. Sauvegarder

Vous pouvez maintenant vous connecter avec tous les droits admin.

## Étape 5: Tester

### Tests essentiels:

- ✅ Page d'accueil s'affiche
- ✅ Connexion fonctionne
- ✅ Dashboard accessible avec votre rôle président
- ✅ Créer un événement (brouillon puis publié)
- ✅ Voir l'événement sur la page publique
- ✅ S'inscrire comme bénévole → email reçu
- ✅ Voir les bénévoles dans le dashboard
- ✅ QR codes dons s'affichent

## Étape 6: Déploiements futurs

### Automatique

Vercel redéploie automatiquement à chaque push sur `main`:

```bash
git add .
git commit -m "Fix: correction bug"
git push origin main
```

### Preview deployments

Chaque pull request crée un deployment preview avec URL unique pour tester avant de merger.

## Troubleshooting

### Build échoue

**Erreur:** `Module not found: Can't resolve ...`
→ Vérifier que toutes les dépendances sont dans `package.json`
→ Relancer le build

**Erreur:** `Missing environment variables`
→ Vérifier dans Vercel → Project Settings → Environment Variables
→ Toutes les variables requises sont présentes

### Erreur 500 en production

1. Vérifier les logs: Vercel → Project → Deployments → Logs
2. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est bien configurée
3. Vérifier que les migrations Supabase sont appliquées

### Emails non envoyés

1. Vérifier `RESEND_API_KEY` dans Vercel
2. Vérifier que le domaine est vérifié dans Resend
3. Vérifier les logs Resend: https://resend.com/logs

### RLS bloque les requêtes

1. Vérifier que toutes les migrations (0001-0006) sont appliquées
2. Vérifier les rôles dans Supabase → Table Editor → profiles
3. Tester les policies dans Supabase → SQL Editor:

```sql
-- Tester si un user peut lire les événements
SELECT * FROM events WHERE status = 'published';
```

## URLs importantes

- **Production:** https://votre-projet.vercel.app
- **Dashboard Vercel:** https://vercel.com/votre-compte/assep
- **Supabase Dashboard:** https://app.supabase.com/project/votre-projet
- **Resend Logs:** https://resend.com/logs

## Support

En cas de problème:

1. Consulter les logs Vercel
2. Consulter SETUP.md pour la configuration locale
3. Exécuter `npm run doctor` en local pour diagnostic

---

**Bonne chance ! 🚀**
