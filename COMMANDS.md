# 🚀 AIDE-MÉMOIRE COMMANDES - ASSEP

## Installation initiale

```bash
# Cloner le projet
git clone <url-du-repo>
cd ASSEP

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# Lancer en développement
npm run dev
```

## Commandes npm

```bash
npm run dev         # Lancer serveur développement (port 3000)
npm run build       # Build de production
npm start           # Lancer après build
npm run lint        # Vérifier le code (ESLint)
npm run doctor      # Diagnostic santé du projet
```

## Supabase - Migrations

```sql
-- Dans Supabase Dashboard → SQL Editor
-- Exécuter dans l'ordre:

-- 1. Extensions et tables de base
\i supabase/migrations/0001_foundations.sql

-- 2. Événements
\i supabase/migrations/0002_events.sql

-- 3. Bénévoles
\i supabase/migrations/0003_signups.sql

-- 4. Finance
\i supabase/migrations/0004_finance.sql

-- 5. Emails et dons
\i supabase/migrations/0005_emails_donations.sql

-- 6. Sécurité RLS
\i supabase/migrations/0006_rls_policies.sql

-- Optionnel: données de test
\i supabase/seed.sql
```

## Supabase - Commandes utiles

```sql
-- Lister toutes les tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Vérifier RLS activé
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Lister les policies
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';

-- Promouvoir un user en président
UPDATE profiles SET role = 'president' WHERE email = 'votre@email.com';

-- Voir tous les événements
SELECT id, slug, title, status, starts_at FROM events ORDER BY starts_at DESC;

-- Voir les bénévoles d'un événement
SELECT vs.first_name, vs.last_name, vs.email, es.starts_at, et.label
FROM volunteer_signups vs
JOIN event_shifts es ON es.id = vs.shift_id
JOIN event_tasks et ON et.id = es.event_task_id
WHERE vs.event_id = 'votre-event-id';

-- Calculer le solde trésorerie
SELECT 
  SUM(CASE WHEN type = 'income' THEN amount_cents ELSE -amount_cents END) / 100.0 AS balance_eur
FROM ledger_entries;
```

## Git

```bash
# Vérifier le statut
git status

# Ajouter tous les fichiers modifiés
git add .

# Commit avec message
git commit -m "Feature: ajouter export PDF"

# Push vers GitHub (déclenche auto-deploy Vercel)
git push origin main

# Créer une branche pour tester
git checkout -b feature/nouvelle-fonctionnalite

# Merger une branche
git checkout main
git merge feature/nouvelle-fonctionnalite
```

## Vercel

```bash
# Installer Vercel CLI (optionnel)
npm i -g vercel

# Lancer preview en local
vercel dev

# Déployer manuellement
vercel

# Déployer en production
vercel --prod

# Voir les logs
vercel logs
```

## Debug

```bash
# Vérifier les variables d'environnement
cat .env.local

# Vérifier la configuration Next.js
cat next.config.js

# Lancer le diagnostic complet
npm run doctor

# Vérifier les erreurs de build
npm run build 2>&1 | tee build.log

# Vérifier les dépendances
npm list --depth=0

# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

## Resend (Emails)

```bash
# Tester l'envoi d'email (via API)
curl -X POST http://localhost:3000/api/signups \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "event-uuid",
    "shiftId": "shift-uuid",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "0612345678",
    "commsOptIn": true
  }'

# Vérifier les logs Resend
# https://resend.com/logs
```

## Raccourcis développement

```bash
# Ouvrir VS Code
code .

# Ouvrir Supabase Dashboard
echo "https://app.supabase.com/project/_/editor"

# Ouvrir Vercel Dashboard
echo "https://vercel.com/dashboard"

# Ouvrir Resend Dashboard
echo "https://resend.com/emails"

# Ouvrir le site local
open http://localhost:3000
```

## Maintenance

```bash
# Mettre à jour les dépendances (avec prudence)
npm outdated
npm update

# Vérifier les failles de sécurité
npm audit
npm audit fix

# Nettoyer le cache Next.js
rm -rf .next

# Réinitialiser complètement
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Backup

```bash
# Backup manuel des données Supabase
# Via Dashboard → Database → Backups

# Backup du code (déjà sur GitHub)
git push origin main

# Export local de toutes les migrations
tar -czf migrations-backup-$(date +%Y%m%d).tar.gz supabase/migrations/

# Export de la config
cp .env.local .env.backup-$(date +%Y%m%d)
```

## Tests rapides

```bash
# Test: le serveur démarre
npm run dev &
sleep 5
curl http://localhost:3000
killall node

# Test: le build passe
npm run build

# Test: doctor passe
npm run doctor

# Test: migrations SQL valides
for f in supabase/migrations/*.sql; do
  echo "Checking $f..."
  grep -q "CREATE\|ALTER" "$f" && echo "✓ OK" || echo "✗ Erreur"
done
```

## Monitoring production

```bash
# Logs Vercel (via CLI)
vercel logs --follow

# Ou via dashboard:
# https://vercel.com/votre-compte/assep/deployments

# Logs Supabase:
# Dashboard → Logs → API Logs

# Logs Resend:
# https://resend.com/logs
```

## URLs importantes

```bash
# Local
http://localhost:3000              # Site
http://localhost:3000/dashboard    # Dashboard
http://localhost:3000/login        # Connexion

# Production (à adapter)
https://assep.vercel.app
https://assep.vercel.app/dashboard

# Services
https://app.supabase.com           # Supabase
https://vercel.com/dashboard       # Vercel
https://resend.com/dashboard       # Resend
https://github.com/votre-compte    # GitHub
```

## Troubleshooting fréquent

```bash
# Erreur: "Module not found"
rm -rf node_modules .next
npm install

# Erreur: "Port 3000 already in use"
lsof -ti:3000 | xargs kill -9
npm run dev

# Erreur: "Supabase connection failed"
# Vérifier .env.local et les clés API

# Erreur: "Cannot read properties of undefined"
# Vérifier les migrations Supabase sont appliquées

# Emails non reçus
# Vérifier Resend logs + spam folder

# Build Vercel échoue
# Vérifier variables d'environnement dans Vercel Dashboard
```

---

**💡 Astuce:** Gardez ce fichier ouvert dans un onglet pour référence rapide !
