# Rapport de Nettoyage Pre-Production
**Date**: 2026-01-27  
**Statut**: EN COURS

## 1. Sécurité - Logs Sensibles

### ✅ Actions Complétées

1. **Helper safeLog créé** (`lib/logger.js`)
   - Masquage automatique des champs sensibles (password, token, authorization, etc.)
   - Mode production: logs debug/info désactivés
   - Logs d'erreur toujours sanitizés
   - Support logs spécialisés: `safeLog.auth()`, `safeLog.api()`

2. **Fichiers corrigés**:
   - ✅ `pages/api/admin/bureau.js` - Tous les console.log remplacés par safeLog

### 🔄 En cours

- Migration des autres fichiers API critiques
- Traitement des fichiers dashboard (logs côté client)

### Fichiers Prioritaires Identifiés (logs sensibles)

**API Routes (CRITIQUE)**:
- `pages/api/admin/users/create.js` - Logs de création d'utilisateur avec password temporaire
- `pages/api/admin/reset-password.js` - Réinitialisation password
- `pages/api/admin/users.js` - Gestion utilisateurs
- `pages/api/admin/whoami.js` - Info auth
- `pages/api/admin/roles.js` - Gestion rôles
- `pages/api/finance/transactions.js` - Authorization headers
- `pages/api/events/approve.js` - Authorization
- `pages/api/events/reject.js` - Authorization
- `pages/api/donations.js` - Authorization
- `pages/api/campaigns/*.js` - Authorization

**Pages Dashboard (MOYEN)**:
- `pages/dashboard/jetc/users.js` - Access tokens utilisés
- `pages/dashboard/tresorerie.js` - Access tokens + console.log verbeux
- `pages/dashboard/bureau.js` - Access tokens
- `pages/dashboard/admin/roles.js` - Access tokens

**Scripts (BAS - à conserver pour debug)**:
- Scripts dans `/scripts/` peuvent rester en console.log (usage manuel)

### Règles appliquées

```javascript
// ❌ AVANT
console.log('User:', user) // Peut contenir session/tokens
console.error('Auth error:', authError) // Peut contenir tokens

// ✅ APRÈS
import safeLog from '../lib/logger'

safeLog.auth('User loaded', { userId: user.id, role: user.role }) // Sanitizé
safeLog.error('Auth error:', authError) // Automatiquement sanitizé
```

---

## 2. Console - Erreurs Catégorisées

### À identifier (prochaine étape)

**A) Erreurs bloquantes à corriger**:
- [ ] 500 sur API
- [ ] 400/404 Supabase sur tables réelles
- [ ] Uncaught errors JS

**B) Erreurs non-bloquantes mais sales**:
- [ ] Fetch inutiles
- [ ] Spam d'erreurs répétées

**C) Avertissements ignorables**:
- Autocomplete warnings (Chrome)
- Warnings React dev mode

---

## 3. Réseau - Endpoints Supabase

### À analyser

- [ ] Identifier tous les 404 Supabase rest/v1/...
- [ ] Vérifier existence des tables/vues
- [ ] Désactiver fetches pour features non-utilisées

---

## 4. Mode Production

### ✅ Implémenté

- Logger désactive automatiquement debug/info en production
- Seuls error/warn actifs (sanitizés)
- Variable `NEXT_PUBLIC_DEBUG_MODE=true` pour forcer les logs si besoin

### À faire

- [ ] Vérifier que les toasts d'erreur user-facing sont génériques
- [ ] Détails techniques seulement en dev

---

## 5. Validation

### Checklist avant commit

- [ ] `npm run build` OK
- [ ] Navigation: Accueil / Événements / Dons / Espace membres OK
- [ ] Login/Logout OK
- [ ] Upload photo event OK
- [ ] Aucune régression UI
- [ ] Console clean en prod mode

---

## Commits

### Commit 1: Helper safeLog
```
feat(security): Add safeLog helper to sanitize logs

- Created lib/logger.js with automatic sensitive data masking
- Masks password, tokens, authorization headers
- Disabled debug/info logs in production
- Added specialized loggers: safeLog.auth(), safeLog.api()
```

### Commit 2: Migrate bureau API
```
refactor(security): Migrate bureau API to safeLog

- Replaced all console.log/error with safeLog
- No more sensitive data logged
- Auth actions properly traced
```

### Prochains commits
- Migration autres API routes
- Migration pages dashboard
- Fix erreurs réseau

---

## Métriques

- **Fichiers à traiter**: ~50
- **Fichiers critiques (auth/API)**: ~15
- **Fichiers traités**: 2
- **Console.log détectés**: ~200
- **Logs sensibles**: ~30

---

## Notes

- **Pas de refactor massif**: On touche uniquement aux logs
- **Zéro régression**: Tests avant chaque commit
- **Logs scripts**: Conservés pour usage manuel/debug
