# ✅ CHECKLIST DE TESTS - Corrections 2026-02-02

## 🔧 Pré-requis

- [ ] Migrations 0017 et 0018 appliquées en base (voir [APPLY-0017-0018.sql](supabase/migrations/APPLY-0017-0018.sql))
- [ ] Application redéployée avec les derniers changements
- [ ] Compte membre du bureau disponible pour tests

---

## 📋 Tests à effectuer

### ✅ TEST 1 : Bénévoles inscrits visibles

**En tant que membre du bureau (président, secrétaire, etc.)**

- [ ] Se connecter avec compte bureau
- [ ] Aller sur Dashboard > Événements
- [ ] Cliquer sur "👥 Bénévoles" sur un événement qui a des inscriptions
- [ ] **Vérifier** : Le compteur affiche le bon nombre (ex: "3 bénévole(s) inscrit(s)")
- [ ] **Vérifier** : Le tableau affiche nom, prénom, email, téléphone
- [ ] **Vérifier** : Bouton "📥 Exporter en CSV" est actif

**Résultat attendu** ✅ : Les bénévoles inscrits sont visibles avec leurs données personnelles

---

### ✅ TEST 2 : Suppression d'événements

**En tant que membre du bureau**

- [ ] Se connecter avec compte bureau
- [ ] Aller sur Dashboard > Événements
- [ ] **Vérifier** : Un bouton "🗑️ Supprimer" est visible sur chaque événement
- [ ] Créer un événement de test (Dashboard > Événements > ➕ Créer)
- [ ] Cliquer sur "🗑️ Supprimer" sur l'événement de test
- [ ] **Vérifier** : Une confirmation s'affiche avec détails des suppressions en cascade
- [ ] Confirmer la suppression
- [ ] **Vérifier** : L'événement disparaît de la liste
- [ ] **Vérifier** : Message de succès "✅ Événement supprimé avec succès"

**En tant que membre normal**

- [ ] Se connecter avec compte membre (rôle = 'membre')
- [ ] **Vérifier** : Pas d'accès à Dashboard > Événements (redirection)

**Résultat attendu** ✅ : Seul le bureau peut supprimer des événements

---

### ✅ TEST 3 : Inscription membre depuis espace-membres

**En tant que visiteur non connecté**

- [ ] Se déconnecter complètement
- [ ] Aller sur `/espace-membres`
- [ ] **Vérifier** : Deux boutons visibles "Connexion" et "S'inscrire"
- [ ] Cliquer sur "S'inscrire"
- [ ] Remplir le formulaire :
  - [ ] Prénom
  - [ ] Nom
  - [ ] Email (nouveau, pas déjà utilisé)
  - [ ] Téléphone
  - [ ] Mot de passe (min 6 caractères)
- [ ] **Vérifier** : Section RGPD visible avec texte explicatif
- [ ] Cocher la case "J'accepte ces conditions..."
- [ ] Cliquer sur "Créer mon compte membre"
- [ ] **Vérifier** : Message "✅ Compte créé avec succès. Bienvenue !"
- [ ] **Vérifier** : Redirection automatique vers /dashboard
- [ ] **Vérifier** : Profil accessible avec nom/prénom

**Tester email déjà utilisé**

- [ ] Se déconnecter
- [ ] Réessayer avec le même email
- [ ] **Vérifier** : Message "⚠️ Un compte existe déjà avec cet email."

**Résultat attendu** ✅ : Inscription complète et fonctionnelle avec GDPR

---

### ✅ TEST 4 : Solde trésorerie sur page d'accueil

**Vérification du solde**

- [ ] Aller sur la page d'accueil `/`
- [ ] Chercher dans le Hero (bandeau principal)
- [ ] **Vérifier** : Affichage "💰 Solde trésorerie: XXXX.XX €"
- [ ] Noter le montant affiché (ex: 6869.70 €)

**Comparaison avec page Trésorerie**

- [ ] Se connecter avec compte bureau
- [ ] Aller sur Dashboard > Trésorerie
- [ ] **Vérifier** : Le "Solde actuel" est identique à la page d'accueil
- [ ] **Vérifier** : Formule = Solde de départ + Somme des transactions

**Test cohérence**

- [ ] Ajouter une nouvelle transaction (recette ou dépense)
- [ ] Rafraîchir la page Trésorerie
- [ ] **Vérifier** : Le solde se met à jour
- [ ] Rafraîchir la page d'accueil
- [ ] **Vérifier** : Le solde est identique

**Résultat attendu** ✅ : Solde cohérent entre accueil et trésorerie

---

## 🎯 Récapitulatif

| Fonctionnalité | Statut | Notes |
|----------------|--------|-------|
| Bénévoles visibles | ⬜ | Bureau voit nom/prénom/email/téléphone |
| Suppression événements | ⬜ | Bouton + confirmation + cascade |
| Inscription membre | ⬜ | Formulaire complet + RGPD |
| Solde trésorerie | ⬜ | Cohérent accueil = trésorerie |

---

## 🐛 En cas de problème

### Bénévoles pas visibles
1. Vérifier migrations appliquées: `SELECT * FROM pg_policies WHERE tablename = 'event_volunteers';`
2. Vérifier que le compte est bien membre du bureau: `SELECT role FROM profiles WHERE id = auth.uid();`
3. Vérifier les inscriptions existent: `SELECT COUNT(*) FROM event_volunteers WHERE event_id = 'xxx';`

### Suppression ne fonctionne pas
1. Vérifier policy DELETE: `SELECT * FROM pg_policies WHERE tablename = 'events' AND cmd = 'DELETE';`
2. Vérifier rôle bureau
3. Vérifier console browser pour erreurs JavaScript

### Inscription membre échoue
1. Vérifier console browser (F12)
2. Vérifier email pas déjà utilisé
3. Vérifier consentement RGPD coché

### Solde incorrect
1. Vérifier API: `/api/treasury/balance` retourne le bon solde
2. Vérifier console logs
3. Comparer avec requête SQL directe: 
   ```sql
   SELECT 
     (SELECT starting_balance FROM treasury_starting_balance) as depart,
     COALESCE(SUM(CASE WHEN type = 'recette' THEN amount_cents ELSE -amount_cents END), 0) / 100.0 as transactions
   FROM transactions;
   ```

---

**Date** : 2026-02-02  
**Testeur** : _____________  
**Environnement** : Production / Développement _(barrer mention inutile)_
