# Guide : Solde de départ de la trésorerie

## Vue d'ensemble

Cette fonctionnalité permet au trésorier de définir un **solde de départ** pour la trésorerie de l'association. Le solde actuel est ensuite calculé automatiquement selon la formule :

```
Solde actuel = Solde de départ + Somme des transactions
```

## Architecture

### 1. Base de données

**Table : `treasury_settings`**
- `id` : UUID (clé primaire)
- `starting_balance` : NUMERIC(10,2) - montant du solde de départ
- `starting_balance_date` : DATE - date du solde (optionnelle)
- `updated_at` : TIMESTAMPTZ - date de dernière mise à jour
- `updated_by` : UUID - ID de l'utilisateur qui a fait la mise à jour

**Contraintes :**
- **Singleton** : Un seul enregistrement autorisé (trigger `prevent_multiple_treasury_settings`)
- **Protection suppression** : Impossible de supprimer la configuration (RLS)

**Migration :** `0015_treasury_starting_balance.sql`

### 2. API

**Endpoint : `/api/finance/starting-balance`**

#### GET
Récupère la configuration actuelle :
```json
{
  "starting_balance": 10000.00,
  "starting_balance_date": "2024-01-01",
  "updated_at": "2024-01-26T10:30:00Z"
}
```

#### PUT
Met à jour le solde de départ :
```json
{
  "starting_balance": 15000.00,
  "starting_balance_date": "2024-06-01"
}
```

**Authentification :** Bearer token requis  
**Autorisation :** trésorier, vice-trésorier, président, vice-président

### 3. Interface utilisateur

**Page : `/dashboard/tresorerie`**

#### Affichage du solde
```
┌─────────────────────────────────┐
│      Solde actuel               │
│    15 523.45 €                  │
│                                 │
│ Solde de départ : 10 000.00 €  │
│ (au 01/01/2024)                 │
│ Total des transactions :        │
│ 5 523.45 €                      │
└─────────────────────────────────┘
     [✏️ Définir solde de départ]
```

#### Modal de modification
- Champ montant (requis)
- Champ date (optionnel)
- Validation : montant doit être un nombre valide
- Actions : Annuler / Enregistrer

## Droits d'accès

### RLS (Row Level Security)

**SELECT :**
- trésorier
- vice-trésorier
- président
- vice-président
- Membres du bureau JETC admins

**UPDATE :**
- trésorier
- vice-trésorier
- président
- vice-président
- Membres du bureau JETC admins

**DELETE :** Bloqué pour tous

### Interface
Le bouton "✏️ Définir solde de départ" est visible uniquement pour :
- trésorier
- vice-trésorier
- président
- vice-président

## Utilisation

### Première configuration

1. Se connecter en tant que trésorier
2. Aller sur `/dashboard/tresorerie`
3. Cliquer sur "✏️ Définir solde de départ"
4. Saisir le montant du solde initial (ex: 10000.00)
5. Optionnel : saisir la date de référence
6. Cliquer sur "Enregistrer"

### Modification

1. Même processus que la première configuration
2. Le formulaire est pré-rempli avec les valeurs actuelles
3. Modifier les valeurs souhaitées
4. Enregistrer

### Calcul du solde

Le solde actuel affiché en haut de la page prend en compte :
1. Le solde de départ configuré
2. La somme de toutes les transactions (recettes - dépenses)

**Exemple :**
- Solde de départ : 10 000 €
- Recettes : +8 000 €
- Dépenses : -2 500 €
- **Solde actuel : 10 000 + 8 000 - 2 500 = 15 500 €**

## Export CSV

L'export CSV **ne contient que l'historique des transactions**, pas le solde de départ. Cela permet de conserver un fichier d'audit des mouvements uniquement.

## Sécurité

### Audit trail
Chaque modification du solde de départ enregistre :
- L'utilisateur qui a fait la modification (`updated_by`)
- La date et l'heure de la modification (`updated_at`)

### Validation
- Le montant doit être un nombre valide (avec 2 décimales max)
- L'API vérifie les droits d'accès avant toute opération
- Le token d'authentification est requis

## Migration

### Appliquer la migration

1. Aller sur le **Supabase Dashboard**
2. Ouvrir l'éditeur SQL
3. Copier le contenu de `supabase/migrations/0015_treasury_starting_balance.sql`
4. Exécuter la requête
5. Vérifier que la table `treasury_settings` est créée

### Vérification

```sql
-- Vérifier la table
SELECT * FROM treasury_settings;

-- Tester l'insertion (doit réussir)
INSERT INTO treasury_settings (starting_balance, starting_balance_date)
VALUES (10000.00, '2024-01-01');

-- Tester une deuxième insertion (doit échouer avec "Only one treasury settings record allowed")
INSERT INTO treasury_settings (starting_balance, starting_balance_date)
VALUES (5000.00, '2024-01-01');
```

## Dépannage

### Le bouton n'apparaît pas
- Vérifier que l'utilisateur a le rôle trésorier, vice-trésorier, président ou vice-président
- Vérifier que la session est active

### Erreur lors de la sauvegarde
- Vérifier que le montant est valide (nombre avec max 2 décimales)
- Vérifier les logs dans la console du navigateur
- Vérifier les logs côté serveur

### Le solde ne se met pas à jour
- Vérifier que la migration 0015 a été appliquée
- Vérifier que l'API `/api/finance/starting-balance` répond
- Recharger la page

## Notes techniques

### Choix de conception

**Table dédiée vs colonne dans transactions**
- ✅ **Table dédiée** (choix retenu) : Sépare la configuration des données transactionnelles
- ❌ Colonne dans transactions : Mélange config et historique, difficile à maintenir

**Singleton pattern**
- Un seul enregistrement autorisé pour éviter les incohérences
- Trigger `prevent_multiple_treasury_settings` bloque les insertions multiples
- Plus simple à gérer qu'une logique de "ligne active"

**Protection suppression**
- Le solde de départ est une configuration critique
- La suppression est bloquée au niveau RLS
- Pour "réinitialiser", il faut mettre le montant à 0

### Performance
- Pas d'impact : la table contient un seul enregistrement
- Pas de JOIN nécessaire pour calculer le solde
- Requête optimisée avec index sur `id`

## Fichiers modifiés

1. **Migration**
   - `supabase/migrations/0015_treasury_starting_balance.sql`

2. **API**
   - `pages/api/finance/starting-balance.js`

3. **Interface**
   - `pages/dashboard/tresorerie.js`

4. **Documentation**
   - `GUIDE-SOLDE-DEPART-TRESORERIE.md` (ce fichier)
