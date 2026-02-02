# ✅ CHECKLIST DÉPLOIEMENT : Solde de départ trésorerie

**Date :** 02 février 2026  
**Environnement :** Production  
**Temps estimé :** 10-15 minutes

---

## 🚀 Avant le déploiement

### Vérifications préalables
- [ ] Build réussi localement : `npm run build`
- [ ] Aucune erreur TypeScript/ESLint
- [ ] Tests manuels effectués en développement
- [ ] Documentation lue et comprise
- [ ] Backup de la base de données effectué

---

## 📦 Étape 1 : Migration base de données

### 1.1 Accéder à Supabase Dashboard
- [ ] Ouvrir [https://app.supabase.com](https://app.supabase.com)
- [ ] Sélectionner le projet ASSEP
- [ ] Aller dans "SQL Editor"

### 1.2 Appliquer la migration
- [ ] Ouvrir le fichier `supabase/migrations/0015_treasury_starting_balance.sql`
- [ ] Copier tout le contenu (119 lignes)
- [ ] Coller dans l'éditeur SQL de Supabase
- [ ] Cliquer sur "Run" (ou Ctrl+Entrée)
- [ ] Vérifier : Message de succès "Success. No rows returned"

### 1.3 Vérifier la table
```sql
-- Exécuter dans SQL Editor
SELECT * FROM treasury_settings;
```
- [ ] Résultat : Table vide (0 rows) ✅
- [ ] Pas d'erreur ✅

### 1.4 Tester le singleton
```sql
-- Test 1: Première insertion (doit réussir)
INSERT INTO treasury_settings (starting_balance) VALUES (0);

-- Test 2: Deuxième insertion (doit échouer)
INSERT INTO treasury_settings (starting_balance) VALUES (0);
```
- [ ] Test 1 : ✅ Success
- [ ] Test 2 : ❌ Error "Only one treasury settings record allowed"

**✅ Migration appliquée avec succès**

---

## 💻 Étape 2 : Déploiement du code

### 2.1 Préparer le commit
```bash
cd /workspaces/ASSEP

# Vérifier les fichiers modifiés
git status

# Ajouter les fichiers
git add pages/dashboard/tresorerie.js
git add pages/api/finance/starting-balance.js
git add supabase/migrations/0015_treasury_starting_balance.sql
git add scripts/verify-starting-balance.js
git add GUIDE-SOLDE-DEPART-TRESORERIE.md
git add LIVRAISON-SOLDE-DEPART-2026-02-02.md
git add TEST-SOLDE-DEPART-2026-02-02.md
git add RECAP-FINAL-SOLDE-DEPART.md
git add ARCHITECTURE-SOLDE-DEPART.md
git add CHECKLIST-DEPLOIEMENT-SOLDE-DEPART.md
```
- [ ] Commandes exécutées

### 2.2 Créer le commit
```bash
git commit -m "feat: Ajout système de solde de départ trésorerie

- Migration 0015: Table treasury_settings avec pattern singleton
- API endpoint /api/finance/starting-balance (GET/PUT)
- Interface UI avec modal de modification
- Calcul automatique: Solde actuel = Solde départ + Transactions
- RLS policies pour tresorier/vice/president
- Documentation complète + script de vérification"
```
- [ ] Commit créé

### 2.3 Pousser vers la branche
```bash
# Option A: Push vers main (si autorisé)
git push origin main

# Option B: Push vers feature branch
git checkout -b feature/solde-depart-tresorerie
git push origin feature/solde-depart-tresorerie
```
- [ ] Code poussé vers le dépôt

### 2.4 Déploiement automatique
- [ ] Vercel détecte le nouveau commit
- [ ] Build automatique déclenché
- [ ] Attendre la fin du build (2-5 min)
- [ ] Vérifier : Build réussi ✅

**✅ Code déployé avec succès**

---

## 🧪 Étape 3 : Tests en production

### 3.1 Vérifier l'API
```bash
# Remplacer YOUR_TOKEN et YOUR_DOMAIN
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://YOUR_DOMAIN.vercel.app/api/finance/starting-balance
```
- [ ] Status 200 OK
- [ ] Réponse JSON valide

### 3.2 Tester l'interface
- [ ] Ouvrir https://YOUR_DOMAIN.vercel.app
- [ ] Se connecter en tant que trésorier
- [ ] Aller sur `/dashboard/tresorerie`
- [ ] Vérifier : Page se charge sans erreur
- [ ] Vérifier : Bouton "✏️ Définir solde de départ" visible
- [ ] Vérifier : Affichage du solde correct

### 3.3 Tester le workflow complet
- [ ] Cliquer sur "✏️ Définir solde de départ"
- [ ] Saisir un montant (ex: 10000)
- [ ] Saisir une date (ex: 01/01/2024)
- [ ] Cliquer sur "Enregistrer"
- [ ] Vérifier : Message de succès
- [ ] Vérifier : Modal se ferme
- [ ] Vérifier : Solde mis à jour
- [ ] Vérifier : Détail affiché correctement

### 3.4 Tester la sécurité
- [ ] Se déconnecter
- [ ] Se connecter en tant qu'adhérent
- [ ] Vérifier : Page tresorerie inaccessible ✅

**✅ Tests en production réussis**

---

## 📊 Étape 4 : Monitoring

### 4.1 Logs Vercel
- [ ] Ouvrir Vercel Dashboard
- [ ] Aller dans "Logs"
- [ ] Vérifier : Pas d'erreur 500
- [ ] Vérifier : Pas d'erreur dans les logs

### 4.2 Logs Supabase
- [ ] Ouvrir Supabase Dashboard
- [ ] Aller dans "Logs"
- [ ] Vérifier : Pas d'erreur RLS
- [ ] Vérifier : Requêtes SQL réussies

### 4.3 Monitoring des performances
- [ ] Temps de réponse API < 500ms
- [ ] Temps de chargement page < 2s
- [ ] Pas de requêtes échouées

**✅ Monitoring configuré**

---

## 📢 Étape 5 : Communication

### 5.1 Documentation utilisateur
- [ ] Créer un message d'annonce pour les utilisateurs
- [ ] Expliquer la nouvelle fonctionnalité
- [ ] Fournir un lien vers le guide d'utilisation

**Exemple de message :**
```
🎉 Nouvelle fonctionnalité : Solde de départ

Bonjour à tous,

Une nouvelle fonctionnalité est disponible pour la gestion de la trésorerie !

✨ Quoi de neuf ?
Le trésorier peut maintenant définir un "solde de départ" pour la trésorerie.
Le solde actuel sera calculé automatiquement :
Solde actuel = Solde de départ + Total des transactions

📖 Comment l'utiliser ?
1. Aller sur Dashboard > Trésorerie
2. Cliquer sur "✏️ Définir solde de départ"
3. Saisir le montant initial (ex: 10000 €)
4. Optionnel : saisir la date de référence
5. Enregistrer

📚 Documentation complète : [lien vers le guide]

Bonne utilisation !
```

### 5.2 Formation des utilisateurs
- [ ] Organiser une session de formation pour le trésorier
- [ ] Démontrer le workflow complet
- [ ] Répondre aux questions

**✅ Communication effectuée**

---

## 🔄 Étape 6 : Validation finale

### 6.1 Checklist complète
- [ ] Migration appliquée ✅
- [ ] Code déployé ✅
- [ ] Tests passés ✅
- [ ] Monitoring actif ✅
- [ ] Communication faite ✅

### 6.2 Vérification post-déploiement (J+1)
- [ ] Vérifier les logs (24h après déploiement)
- [ ] Vérifier l'utilisation (nombre de modifications)
- [ ] Recueillir les feedbacks utilisateurs
- [ ] Corriger les bugs éventuels

**✅ Déploiement validé**

---

## 🐛 En cas de problème

### Rollback rapide

#### Si problème critique
1. **Rollback code**
   ```bash
   # Dans Vercel Dashboard
   # Aller dans "Deployments"
   # Trouver le deployment précédent
   # Cliquer sur "..." puis "Promote to Production"
   ```

2. **Rollback migration (si nécessaire)**
   ```sql
   -- Dans Supabase SQL Editor
   DROP TABLE IF EXISTS treasury_settings CASCADE;
   ```

#### Si problème mineur
1. Créer un ticket GitHub
2. Corriger le bug localement
3. Tester la correction
4. Créer un nouveau commit
5. Déployer

---

## 📞 Support

### Contacts
- Développeur : [nom]
- Trésorier : [nom]
- Admin système : [nom]

### Ressources
- Documentation : `GUIDE-SOLDE-DEPART-TRESORERIE.md`
- Tests : `TEST-SOLDE-DEPART-2026-02-02.md`
- Architecture : `ARCHITECTURE-SOLDE-DEPART.md`
- GitHub Issues : [lien]

---

## 📝 Notes de déploiement

**Environnement :**
- Date : [à compléter]
- Heure : [à compléter]
- Version : [à compléter]
- Déployé par : [à compléter]

**Observations :**
[à compléter]

**Incidents :**
[à compléter]

**Résolution :**
[à compléter]

---

## ✨ Post-déploiement

### Améliorations futures (backlog)
- [ ] Historique des modifications du solde de départ
- [ ] Export CSV incluant le solde de départ
- [ ] Graphiques d'évolution du solde
- [ ] Notifications email lors des modifications
- [ ] Version mobile optimisée

### Métriques à suivre
- [ ] Nombre d'utilisations de la fonctionnalité
- [ ] Temps de réponse API moyen
- [ ] Taux d'erreur
- [ ] Feedbacks utilisateurs

---

**Checklist créée le :** 02 février 2026  
**Version :** 1.0  
**Statut :** ✅ Prêt pour déploiement
