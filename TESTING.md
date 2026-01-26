# 🧪 GUIDE DE TEST - ASSEP

Ce guide vous aide à tester toutes les fonctionnalités du site ASSEP.

## Prérequis

- Projet configuré localement (`npm install` + `.env.local`)
- Migrations Supabase appliquées (0001-0006)
- Données de test insérées (`supabase/seed.sql` optionnel)
- Serveur lancé (`npm run dev`)

## 🔐 Test 1: Authentification

### 1.1 Créer un utilisateur test

**Option A - Via Supabase Dashboard:**
1. Supabase → Authentication → Add User
2. Email: `test@assep.fr`
3. Password: `TestASSEP2026!`
4. Confirm

**Option B - Via code (à implémenter si besoin):**
```javascript
// Ajouter une page /signup
```

### 1.2 Promouvoir en président

1. Supabase → Table Editor → `profiles`
2. Trouver l'utilisateur `test@assep.fr`
3. Modifier `role` → `president`
4. Save

### 1.3 Se connecter

1. Aller sur `http://localhost:3000/login`
2. Email: `test@assep.fr`
3. Password: `TestASSEP2026!`
4. Cliquer "Se connecter"

✅ **Attendu:** Redirection vers `/dashboard`

## 📅 Test 2: Gestion événements

### 2.1 Créer un événement

1. Dashboard → "Gérer les événements"
2. Cliquer "➕ Créer un nouvel événement"
3. Remplir:
   - Titre: `Vente de gâteaux`
   - Thème: `Collecte de fonds`
   - Lieu: `Hall de l'école`
   - Date/heure début: Choisir une date future
   - Cocher "Cet événement a une buvette"
   - Statut: `Publié`
4. Cliquer "Créer l'événement"

✅ **Attendu:** Redirection vers la liste, événement visible

### 2.2 Vérifier l'affichage public

1. Ouvrir un nouvel onglet (mode privé ou déconnexion)
2. Aller sur `http://localhost:3000/evenements`
3. Vérifier que "Vente de gâteaux" apparaît

✅ **Attendu:** Événement visible avec toutes les infos

### 2.3 Consulter le détail

1. Cliquer sur "Voir les détails"
2. Vérifier l'affichage complet

✅ **Attendu:** Page de détail avec infos complètes

## 🙋 Test 3: Inscription bénévole

### 3.1 Préparer l'événement (depuis dashboard admin)

Si pas fait avec seed.sql:

1. Dashboard → Événements → Sélectionner votre événement
2. (Cette interface n'est pas créée, utiliser seed.sql ou SQL direct)

Avec SQL direct dans Supabase:
```sql
-- Récupérer l'ID de votre événement
SELECT id, slug FROM events WHERE slug = 'vente-de-gateaux';

-- Insérer une tâche
INSERT INTO event_tasks (event_id, label) 
VALUES ('votre-event-id', 'Vente');

-- Insérer un créneau (récupérer task_id avant)
INSERT INTO event_shifts (event_task_id, starts_at, ends_at, required_count)
VALUES ('task-id', '2026-03-15 10:00:00', '2026-03-15 12:00:00', 3);
```

### 3.2 S'inscrire comme bénévole

1. Page publique de l'événement
2. Formulaire "Nous avons besoin de bénévoles"
3. Remplir:
   - Créneau: Choisir dans la liste
   - Prénom: `Alice`
   - Nom: `Test`
   - Email: `alice@example.com`
   - Téléphone: `0612345678`
   - Cocher "J'accepte de recevoir les communications"
4. Cliquer "S'inscrire"

✅ **Attendu:** 
- Message de succès
- Email reçu sur `alice@example.com` (vérifier Resend logs)

### 3.3 Vérifier l'inscription (dashboard admin)

1. Dashboard → Événements → Votre événement → "Bénévoles"
2. Vérifier qu'Alice Test apparaît

✅ **Attendu:** Ligne avec toutes les infos

### 3.4 Tester l'anti-doublon

1. Réessayer de s'inscrire avec le même email au même créneau
2. Vérifier le message d'erreur

✅ **Attendu:** Erreur "Vous êtes déjà inscrit à ce créneau"

### 3.5 Tester la capacité maximale

1. S'inscrire avec 2 autres emails (si capacité = 3)
2. Essayer de s'inscrire une 4ème fois

✅ **Attendu:** Erreur "Ce créneau est complet"

## 💰 Test 4: Caisse événement

### 4.1 Saisir les recettes

1. Dashboard → Événements → Votre événement → "Caisse"
2. Remplir:
   - Espèces: `5000` (= 50,00 €)
   - Carte: `3500` (= 35,00 €)
   - Chèques: `2000` (= 20,00 €)
   - Notes: `Recettes vente de gâteaux`
3. Cliquer "Enregistrer"

✅ **Attendu:** 
- Message de succès
- Total affiché: `105,00 €`

### 4.2 Modifier les recettes

1. Changer Espèces à `6000`
2. Enregistrer

✅ **Attendu:** Total mis à jour: `115,00 €`

## 💼 Test 5: Trésorerie globale

### 5.1 Voir le solde

1. Dashboard → "Trésorerie"
2. Vérifier le solde actuel

✅ **Attendu:** Affichage du solde avec historique

### 5.2 Exporter CSV

1. Cliquer "📥 Exporter en CSV"
2. Ouvrir le fichier téléchargé

✅ **Attendu:** Fichier CSV avec toutes les opérations

## 💝 Test 6: Dons

### 6.1 Dons généraux

1. Page publique `http://localhost:3000/dons`
2. Vérifier l'affichage du QR code

✅ **Attendu:** QR code visible, lien cliquable

### 6.2 Dons par événement

1. Page événement → Section "Soutenez cet événement"
2. Cliquer "Faire un don"
3. Vérifier le QR code spécifique

✅ **Attendu:** QR code avec URL contenant le slug de l'événement

## 👥 Test 7: Bureau

### 7.1 Affichage public

1. Page d'accueil `http://localhost:3000/`
2. Défiler jusqu'à "Le Bureau"

✅ **Attendu:** Liste des membres du bureau (si seed.sql appliqué)

### 7.2 Gestion (dashboard)

1. Dashboard → "Gestion Bureau"
2. Voir la liste des membres

✅ **Attendu:** Interface avec membres existants

## 📧 Test 8: Communications

### 8.1 Préparer une campagne (SQL direct)

```sql
INSERT INTO email_campaigns (subject, body_html, status, created_by)
VALUES (
  'Test newsletter',
  '<h1>Bonjour</h1><p>Ceci est un test.</p>',
  'draft',
  'votre-user-id'
);
```

### 8.2 Envoyer (via API)

```bash
curl -X POST http://localhost:3000/api/campaigns/send \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "campaign-id-from-db"}'
```

✅ **Attendu:** 
- Réponse JSON avec `sentCount`
- Emails reçus par les opt-in

## 🔐 Test 9: RLS (Sécurité)

### 9.1 Test public (déconnecté)

1. Déconnexion
2. Essayer d'aller sur `/dashboard`

✅ **Attendu:** Redirection vers `/login`

### 9.2 Test lecture publique

1. Déconnecté, aller sur `/evenements`
2. Vérifier que seuls les événements `published` sont visibles

✅ **Attendu:** Événements draft/archived invisibles

### 9.3 Test rôle secrétaire

1. Créer un user `secretaire@assep.fr`
2. Lui donner role `secretaire`
3. Se connecter
4. Essayer d'accéder à `/dashboard/tresorerie`

✅ **Attendu:** Redirection ou accès refusé (selon implémentation)

## 📊 Test 10: Export CSV

### 10.1 Export bénévoles

1. Dashboard → Événement → Bénévoles
2. Cliquer "📥 Exporter en CSV"
3. Ouvrir le fichier

✅ **Attendu:** CSV avec colonnes: Prénom, Nom, Email, Téléphone, Tâche, Créneau, etc.

### 10.2 Export trésorerie

1. Dashboard → Trésorerie
2. Cliquer "📥 Exporter en CSV"

✅ **Attendu:** CSV avec Date, Type, Libellé, Montant, Événement

## 🐛 Tests d'erreur

### Test 1: Email invalide
1. Formulaire inscription bénévole
2. Email: `test` (invalide)
3. Soumettre

✅ **Attendu:** Validation HTML5 empêche la soumission

### Test 2: Champs requis manquants
1. Formulaire sans prénom
2. Soumettre

✅ **Attendu:** Message d'erreur

### Test 3: Service Supabase down
1. Mettre une mauvaise URL Supabase
2. Recharger le site

✅ **Attendu:** Message d'erreur clair (pas de crash)

## 📱 Test 11: Responsive

### Desktop
- ✅ Navigation fluide
- ✅ Tableaux lisibles
- ✅ Formulaires alignés

### Tablette (768px)
- ✅ Menu adapté
- ✅ Grids en 2 colonnes

### Mobile (375px)
- ✅ Grids en 1 colonne
- ✅ Tableaux scrollables horizontalement
- ✅ Boutons pleine largeur

## ✅ Checklist finale

Avant de mettre en production:

- [ ] Tous les tests ci-dessus passent
- [ ] `npm run doctor` → 100% (sauf env vars en local)
- [ ] `npm run build` → succès
- [ ] Variables d'environnement Vercel configurées
- [ ] Migrations Supabase production appliquées
- [ ] Domaine email vérifié sur Resend
- [ ] Premier admin créé
- [ ] URLs de dons configurées (HelloAsso/Stripe)
- [ ] Test d'inscription bénévole en production
- [ ] Email de confirmation reçu en production

---

**✨ Bon test !**

Si un test échoue, vérifier:
1. Les logs du terminal (`npm run dev`)
2. Les logs Supabase (SQL Editor → Query History)
3. Les logs Resend (https://resend.com/logs)
4. La console navigateur (F12)
