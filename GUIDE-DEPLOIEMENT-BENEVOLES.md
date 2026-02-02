# 🚀 GUIDE RAPIDE - Déploiement système bénévoles RGPD

**Date**: 2026-02-02  
**Temps estimé**: 10 minutes

---

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers
- ✅ `supabase/migrations/0016_secure_profiles_gdpr.sql` - Migration RGPD
- ✅ `pages/espace-membres.js` - Page inscription membre
- ✅ `pages/api/auth/signup-member.js` - API création compte
- ✅ `scripts/verify-volunteers-gdpr.sh` - Script vérification
- ✅ `LIVRAISON-BENEVOLES-RGPD.md` - Documentation complète
- ✅ `TESTS-BENEVOLES-RGPD.md` - Checklist de tests

### Fichiers modifiés
- ✅ `components/VolunteerSignup.js` - Redirection + messages RGPD

---

## ⚡ Déploiement express

### Étape 1: Vérification locale
```bash
cd /workspaces/ASSEP
./scripts/verify-volunteers-gdpr.sh
```
**Attendu**: Tous les ✅ verts

---

### Étape 2: Appliquer migration Supabase

**Option A - Via Supabase CLI (recommandé)**
```bash
# Se connecter à Supabase
supabase login

# Lier au projet
supabase link --project-ref [votre-project-ref]

# Appliquer migrations
supabase db push
```

**Option B - Via Dashboard Supabase**
1. Ouvrir [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **SQL Editor**
4. Copier le contenu de `supabase/migrations/0016_secure_profiles_gdpr.sql`
5. Coller et exécuter
6. Vérifier le message `COMMIT` en bas

---

### Étape 3: Vérifier migration appliquée
```sql
-- Dans SQL Editor Supabase
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE tablename = 'profiles';
```
**Attendu**: Au moins 4 policies

```sql
-- Vérifier colonnes ajoutées
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name LIKE 'volunteer_consent%';
```
**Attendu**: 2 lignes (volunteer_consent_given, volunteer_consent_date)

---

### Étape 4: Déployer code

```bash
# Commit et push
git add .
git commit -m "feat: système inscription bénévole RGPD sécurisé"
git push origin main
```

**Si Vercel**: Déploiement automatique (vérifier dans Dashboard Vercel)

**Si autre**: Suivre votre processus de déploiement habituel

---

### Étape 5: Test rapide en production

1. **Test inscription membre**
   - Ouvrir `https://[votre-domaine]/espace-membres`
   - Créer compte test
   - ✅ Vérifier consentement RGPD obligatoire

2. **Test inscription bénévole**
   - Se déconnecter
   - Aller sur un événement
   - Cliquer "S'inscrire comme bénévole"
   - ✅ Vérifier redirection vers espace-membres

3. **Test sécurité RLS**
   - Console développeur
   ```javascript
   const { data } = await supabase.from('profiles').select('*')
   console.log(data.length) // Doit être 1 (son propre profil)
   ```

---

## 🔧 Configuration requise

### Variables d'environnement
Vérifier que ces variables sont configurées :

```bash
# .env.local (local)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Pour API signup-member
```

**Vercel**: Vérifier dans Dashboard → Settings → Environment Variables

---

## ⚠️ Points de vigilance

### 1. Service Role Key
L'API `signup-member.js` utilise `supabaseAdmin` (service_role).  
**Vérifier**: Cette clé **NE DOIT JAMAIS** être exposée côté client.

### 2. RLS Profiles
La migration supprime `profiles_select_authenticated` (trop permissive).  
**Impact**: Les membres ne voient plus les profils des autres (voulu).

### 3. Backward compatibility
Les anciennes inscriptions bénévoles restent valides.  
Les membres sans consentement peuvent continuer (ajouter via UPDATE si besoin).

---

## 🐛 Troubleshooting

### Erreur: "Policy already exists"
```sql
-- Supprimer policies existantes si besoin
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "event_volunteers_select_public" ON event_volunteers;
```
Puis réexécuter la migration.

### Erreur: "Permission denied for table profiles"
Vérifier que la migration RLS est bien appliquée :
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```
**Attendu**: `rowsecurity = true`

### Erreur: "volunteerConsent is required"
Vérifier que la case RGPD est bien cochée côté frontend.

### Page blanche /espace-membres
1. Vérifier la console navigateur (F12)
2. Vérifier logs Next.js
3. Vérifier que `supabaseClient` est bien importé

---

## 📞 Support

**Documentation complète**: [LIVRAISON-BENEVOLES-RGPD.md](LIVRAISON-BENEVOLES-RGPD.md)  
**Tests détaillés**: [TESTS-BENEVOLES-RGPD.md](TESTS-BENEVOLES-RGPD.md)

**En cas de problème**:
1. Exécuter `./scripts/verify-volunteers-gdpr.sh`
2. Vérifier logs Vercel/serveur
3. Vérifier logs Supabase (Dashboard → Logs)
4. Consulter la documentation technique

---

## ✅ Checklist finale

Avant de valider en production :

- [ ] Migration 0016 appliquée et vérifiée
- [ ] Code déployé (Vercel build success)
- [ ] Variables d'environnement configurées
- [ ] Test inscription membre OK
- [ ] Test inscription bénévole OK
- [ ] Test RLS profiles OK (membre simple ne voit que son profil)
- [ ] Test RLS profiles OK (bureau voit tous les profils)
- [ ] Test mobile OK
- [ ] Aucune erreur console
- [ ] Aucune régression événements existants

---

## 🎉 C'est prêt !

Votre système d'inscription bénévole RGPD est déployé et sécurisé.

**Prochaines actions possibles** :
- Communiquer aux membres sur la nouvelle page `/espace-membres`
- Former le bureau sur l'accès aux données personnelles
- Monitorer les inscriptions bénévoles
- Ajuster `volunteer_target` sur les événements

**Conformité RGPD** : ✅ Activée et tracée
