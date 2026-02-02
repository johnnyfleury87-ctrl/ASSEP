# ✅ Plan de test : Solde de départ trésorerie

## 🎯 Objectif
Valider que le système de solde de départ fonctionne correctement de bout en bout.

---

## 📋 Checklist de test

### ✅ Phase 1 : Migration base de données

**Test 1.1 : Appliquer la migration**
- [ ] Aller sur Supabase Dashboard
- [ ] Ouvrir SQL Editor
- [ ] Copier le contenu de `0015_treasury_starting_balance.sql`
- [ ] Exécuter la migration
- [ ] Vérifier : Aucune erreur

**Test 1.2 : Vérifier la structure**
```sql
-- Exécuter dans SQL Editor
SELECT * FROM treasury_settings;
```
- [ ] Résultat : Table vide ou 1 ligne (si déjà configuré)

**Test 1.3 : Tester le singleton**
```sql
-- Première insertion (doit réussir)
INSERT INTO treasury_settings (starting_balance, starting_balance_date)
VALUES (10000.00, '2024-01-01');

-- Deuxième insertion (doit échouer)
INSERT INTO treasury_settings (starting_balance, starting_balance_date)
VALUES (5000.00, '2024-01-01');
```
- [ ] 1ère insertion : ✅ Réussite
- [ ] 2ème insertion : ❌ Erreur "Only one treasury settings record allowed"

**Test 1.4 : Tester la protection suppression**
```sql
DELETE FROM treasury_settings WHERE id IS NOT NULL;
```
- [ ] Résultat : ❌ Erreur de permission (suppression bloquée)

---

### ✅ Phase 2 : API Backend

**Test 2.1 : GET sans configuration**
```bash
# Remplacer YOUR_TOKEN par un vrai token
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/finance/starting-balance
```
- [ ] Status : 200 OK
- [ ] Réponse : 
  ```json
  {
    "starting_balance": 0,
    "starting_balance_date": null,
    "updated_at": null
  }
  ```

**Test 2.2 : PUT avec données valides**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"starting_balance": 10000.00, "starting_balance_date": "2024-01-01"}' \
  http://localhost:3000/api/finance/starting-balance
```
- [ ] Status : 200 OK
- [ ] Réponse : 
  ```json
  {
    "success": true,
    "starting_balance": 10000.00,
    "starting_balance_date": "2024-01-01"
  }
  ```

**Test 2.3 : GET après configuration**
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/finance/starting-balance
```
- [ ] Status : 200 OK
- [ ] starting_balance : 10000.00
- [ ] starting_balance_date : "2024-01-01"
- [ ] updated_at : Date valide

**Test 2.4 : PUT avec montant invalide**
```bash
curl -X PUT \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"starting_balance": "abc"}' \
  http://localhost:3000/api/finance/starting-balance
```
- [ ] Status : 400 Bad Request
- [ ] Message d'erreur : "Invalid starting_balance"

**Test 2.5 : Accès sans authentification**
```bash
curl -X GET http://localhost:3000/api/finance/starting-balance
```
- [ ] Status : 401 Unauthorized

**Test 2.6 : Accès avec rôle non autorisé**
```bash
# Token d'un utilisateur avec role = 'adherent'
curl -X PUT \
  -H "Authorization: Bearer ADHERENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"starting_balance": 5000}' \
  http://localhost:3000/api/finance/starting-balance
```
- [ ] Status : 403 Forbidden
- [ ] Message : "Access denied"

---

### ✅ Phase 3 : Interface utilisateur

**Test 3.1 : Accès à la page trésorerie**
- [ ] Se connecter en tant que trésorier
- [ ] Aller sur `/dashboard/tresorerie`
- [ ] Vérifier : Page se charge sans erreur

**Test 3.2 : Affichage du solde (sans configuration)**
- [ ] Vérifier : Solde actuel affiché
- [ ] Vérifier : "Solde de départ : 0.00 €"
- [ ] Vérifier : "Total des transactions : X.XX €"
- [ ] Vérifier : Bouton "✏️ Définir solde de départ" visible

**Test 3.3 : Ouverture du modal**
- [ ] Cliquer sur "✏️ Définir solde de départ"
- [ ] Vérifier : Modal s'ouvre
- [ ] Vérifier : Champ "Montant" vide ou pré-rempli
- [ ] Vérifier : Champ "Date" vide ou pré-rempli
- [ ] Vérifier : Boutons "Annuler" et "Enregistrer"

**Test 3.4 : Annulation**
- [ ] Cliquer sur "Annuler"
- [ ] Vérifier : Modal se ferme
- [ ] Vérifier : Aucune modification

**Test 3.5 : Enregistrement valide**
- [ ] Ouvrir le modal
- [ ] Saisir : 10000 dans le champ montant
- [ ] Saisir : 01/01/2024 dans le champ date
- [ ] Cliquer sur "Enregistrer"
- [ ] Vérifier : Message de succès "Solde de départ mis à jour avec succès !"
- [ ] Vérifier : Modal se ferme
- [ ] Vérifier : "Solde de départ : 10 000.00 € (au 01/01/2024)"

**Test 3.6 : Calcul du solde total**
Contexte : Solde de départ = 10 000 €, Transactions = +3 000 €
- [ ] Vérifier : Solde actuel = 13 000.00 €
- [ ] Vérifier : Détail correct :
  - Solde de départ : 10 000.00 €
  - Total des transactions : 3 000.00 €

**Test 3.7 : Modification du solde de départ**
- [ ] Ouvrir le modal
- [ ] Vérifier : Champs pré-remplis avec valeurs actuelles
- [ ] Modifier : 15000
- [ ] Modifier date : 01/06/2024
- [ ] Enregistrer
- [ ] Vérifier : Mise à jour réussie
- [ ] Vérifier : Nouveau calcul correct (15 000 + transactions)

**Test 3.8 : Validation frontend**
- [ ] Ouvrir le modal
- [ ] Saisir : "abc" dans le montant
- [ ] Enregistrer
- [ ] Vérifier : Message d'erreur "Veuillez saisir un montant valide"

**Test 3.9 : Visibilité du bouton selon le rôle**
- [ ] Se connecter en tant que trésorier → Bouton visible ✓
- [ ] Se connecter en tant que vice-trésorier → Bouton visible ✓
- [ ] Se connecter en tant que président → Bouton visible ✓
- [ ] Se connecter en tant que vice-président → Bouton visible ✓
- [ ] Se connecter en tant que secrétaire → Bouton invisible ✗
- [ ] Se connecter en tant qu'adhérent → Page inaccessible ✗

---

### ✅ Phase 4 : Export CSV

**Test 4.1 : Export avec solde de départ défini**
- [ ] Définir un solde de départ (ex: 10 000 €)
- [ ] Créer quelques transactions
- [ ] Cliquer sur "📥 Exporter en CSV"
- [ ] Ouvrir le fichier CSV
- [ ] Vérifier : Contient uniquement les transactions (pas le solde de départ)
- [ ] Vérifier : Colonnes : Date, Type, Catégorie, Description, Montant, Événement

---

### ✅ Phase 5 : Responsive design

**Test 5.1 : Desktop (1920x1080)**
- [ ] Ouvrir `/dashboard/tresorerie`
- [ ] Vérifier : Affichage correct
- [ ] Vérifier : Modal centré et lisible

**Test 5.2 : Tablette (768x1024)**
- [ ] Ouvrir `/dashboard/tresorerie`
- [ ] Vérifier : Affichage adapté
- [ ] Vérifier : Modal responsive

**Test 5.3 : Mobile (375x667)**
- [ ] Ouvrir `/dashboard/tresorerie`
- [ ] Vérifier : Affichage mobile correct
- [ ] Vérifier : Modal occupe 90% de la largeur
- [ ] Vérifier : Champs de saisie utilisables

---

### ✅ Phase 6 : Sécurité et RLS

**Test 6.1 : RLS policies - SELECT**
```sql
-- Se connecter en tant que trésorier (via Supabase Auth)
SELECT * FROM treasury_settings;
```
- [ ] Résultat : ✅ 1 ligne retournée

```sql
-- Se connecter en tant qu'adhérent (via Supabase Auth)
SELECT * FROM treasury_settings;
```
- [ ] Résultat : ❌ Aucune ligne (ou erreur de permission)

**Test 6.2 : RLS policies - UPDATE**
```sql
-- Se connecter en tant que trésorier
UPDATE treasury_settings 
SET starting_balance = 20000 
WHERE id IS NOT NULL;
```
- [ ] Résultat : ✅ Mise à jour réussie

```sql
-- Se connecter en tant qu'adhérent
UPDATE treasury_settings 
SET starting_balance = 20000 
WHERE id IS NOT NULL;
```
- [ ] Résultat : ❌ Erreur de permission

**Test 6.3 : Audit trail**
```sql
SELECT starting_balance, updated_at, updated_by 
FROM treasury_settings;
```
- [ ] Vérifier : `updated_by` contient l'UUID du trésorier
- [ ] Vérifier : `updated_at` contient la date/heure de la dernière modification

---

### ✅ Phase 7 : Performance et stabilité

**Test 7.1 : Chargement de la page**
- [ ] Mesurer : Temps de chargement < 2 secondes
- [ ] Vérifier : Aucune erreur dans la console

**Test 7.2 : Modifications multiples**
- [ ] Modifier le solde de départ 5 fois de suite
- [ ] Vérifier : Toutes les modifications réussies
- [ ] Vérifier : Aucune fuite mémoire

**Test 7.3 : Concurrent updates**
- [ ] Ouvrir 2 onglets en tant que trésorier
- [ ] Modifier le solde dans l'onglet 1
- [ ] Modifier le solde dans l'onglet 2
- [ ] Vérifier : Dernière modification gagne
- [ ] Vérifier : `updated_at` reflète la bonne date

---

### ✅ Phase 8 : Script de vérification

**Test 8.1 : Exécuter le script**
```bash
node scripts/verify-starting-balance.js
```
- [ ] Vérifier : Toutes les vérifications passent ✅
- [ ] Vérifier : Rapport clair et détaillé
- [ ] Vérifier : Pas d'erreur

---

## 📊 Résumé des tests

| Phase | Tests | Statut |
|-------|-------|--------|
| 1. Migration DB | 4 tests | ☐ |
| 2. API Backend | 6 tests | ☐ |
| 3. Interface UI | 9 tests | ☐ |
| 4. Export CSV | 1 test | ☐ |
| 5. Responsive | 3 tests | ☐ |
| 6. Sécurité RLS | 3 tests | ☐ |
| 7. Performance | 3 tests | ☐ |
| 8. Script verif | 1 test | ☐ |
| **TOTAL** | **30 tests** | ☐ |

---

## ✅ Critères de réussite

**Fonctionnel**
- ✅ Le trésorier peut définir un solde de départ
- ✅ Le solde actuel est calculé correctement (solde départ + transactions)
- ✅ Les modifications sont enregistrées avec audit trail
- ✅ L'export CSV fonctionne correctement

**Sécurité**
- ✅ Seuls les rôles autorisés peuvent modifier le solde
- ✅ RLS protège les données au niveau DB
- ✅ Authentification requise pour toutes les opérations
- ✅ Suppression bloquée (protection config)

**UX**
- ✅ Interface intuitive et claire
- ✅ Messages d'erreur compréhensibles
- ✅ Validation frontend et backend
- ✅ Responsive sur tous les devices

**Technique**
- ✅ Build sans erreur
- ✅ Pas d'erreur console
- ✅ Performance correcte (< 2s)
- ✅ Code maintenable et documenté

---

## 🐛 Bugs connus

_Aucun bug connu pour le moment_

---

## 📝 Notes de test

**Environnement de test**
- OS : [à compléter]
- Navigateur : [à compléter]
- Version Node : [à compléter]
- Version Next.js : 14.2.35

**Testeur**
- Nom : [à compléter]
- Date : [à compléter]
- Durée : [à compléter]

**Observations**
[à compléter]

---

**Date de création :** 02 février 2026  
**Version :** 1.0  
**Statut :** En attente de test
