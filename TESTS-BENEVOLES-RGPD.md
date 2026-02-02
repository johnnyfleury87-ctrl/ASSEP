# 📋 CHECKLIST DE TEST - Inscription bénévoles RGPD

**Date**: 2026-02-02  
**Objectif**: Valider le système d'inscription bénévole sécurisé

---

## ⚙️ Pré-requis

- [ ] Migration 0016 appliquée sur Supabase
- [ ] Code déployé en production
- [ ] Compte test membre créé
- [ ] Compte test président créé
- [ ] Événement test avec `volunteer_target > 0`

---

## 🧪 Tests fonctionnels

### Test 1: Inscription membre (nouveau compte)

**Objectif**: Vérifier que l'inscription membre fonctionne avec consentement RGPD

**Étapes:**
1. [ ] Ouvrir `/espace-membres` (navigateur privé)
2. [ ] Cliquer "Devenir membre"
3. [ ] Remplir le formulaire:
   - Prénom: Jean
   - Nom: Dupont
   - Email: jean.dupont@test.fr
   - Téléphone: 06 12 34 56 78
   - Mot de passe: Test1234
4. [ ] **NE PAS cocher** la case RGPD
5. [ ] Cliquer "Créer mon compte membre"
6. [ ] **Attendu**: Message d'erreur "Vous devez accepter les conditions..."
7. [ ] Cocher la case RGPD
8. [ ] Cliquer "Créer mon compte membre"
9. [ ] **Attendu**: Message "Inscription réussie ! Vous allez être redirigé..."
10. [ ] **Attendu**: Redirection vers `/dashboard`

**Résultat**: ⬜ Réussi / ⬜ Échoué

**Notes**:
```


```

---

### Test 2: Connexion membre existant

**Objectif**: Vérifier la connexion membre

**Étapes:**
1. [ ] Ouvrir `/espace-membres`
2. [ ] Cliquer "Connexion"
3. [ ] Entrer email et mot de passe du compte test
4. [ ] Cliquer "Se connecter"
5. [ ] **Attendu**: Redirection vers `/dashboard`

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 3: Inscription bénévole (utilisateur non connecté)

**Objectif**: Vérifier la redirection vers espace-membres

**Étapes:**
1. [ ] Se déconnecter (navigateur privé)
2. [ ] Aller sur `/evenements/[event-id]` (événement avec bénévolat)
3. [ ] Scroll jusqu'à la section "🙋 Bénévoles"
4. [ ] **Attendu**: Message "Pour vous inscrire comme bénévole, vous devez disposer d'un compte membre ASSEP"
5. [ ] Cliquer "Devenir membre / Se connecter"
6. [ ] **Attendu**: Redirection vers `/espace-membres?redirect=/evenements/[event-id]`
7. [ ] Se connecter ou créer compte
8. [ ] **Attendu**: Retour automatique vers `/evenements/[event-id]`

**Résultat**: ⬜ Réussi / ⬜ Échoué

**Notes**:
```


```

---

### Test 4: Inscription bénévole (utilisateur connecté)

**Objectif**: Vérifier l'inscription bénévole directe

**Étapes:**
1. [ ] Se connecter avec compte membre
2. [ ] Aller sur `/evenements/[event-id]`
3. [ ] Scroll jusqu'à "🙋 Bénévoles"
4. [ ] **Attendu**: Affichage compteur "0/5" (exemple)
5. [ ] Cliquer "S'inscrire comme bénévole"
6. [ ] **Attendu**: Message "✅ Merci pour votre engagement ! Votre inscription..."
7. [ ] **Attendu**: Compteur mis à jour "1/5"
8. [ ] **Attendu**: Bouton changé en "Se désinscrire"

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 5: Désinscription bénévole

**Objectif**: Vérifier la désinscription

**Étapes:**
1. [ ] Depuis le test précédent (inscrit)
2. [ ] Cliquer "Se désinscrire"
3. [ ] **Attendu**: Confirmation demandée
4. [ ] Confirmer
5. [ ] **Attendu**: Message "Désinscription réussie"
6. [ ] **Attendu**: Compteur décrémenté "0/5"
7. [ ] **Attendu**: Bouton redevenu "S'inscrire comme bénévole"

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 6: Quota atteint

**Objectif**: Vérifier le blocage si quota atteint

**Pré-requis**: Événement avec `volunteer_target = 2`

**Étapes:**
1. [ ] Inscrire 2 bénévoles (comptes différents)
2. [ ] **Attendu**: Compteur "2/2"
3. [ ] **Attendu**: Message "🎉 L'objectif de bénévoles est atteint !"
4. [ ] Se connecter avec un 3ème compte membre
5. [ ] Tenter de s'inscrire
6. [ ] **Attendu**: Message "⚠️ Le nombre de bénévoles requis est déjà atteint..."

**Résultat**: ⬜ Réussi / ⬜ Échoué

**Notes**:
```


```

---

## 🔒 Tests de sécurité RGPD

### Test 7: Vérification RLS profiles (membre simple)

**Objectif**: Vérifier qu'un membre ne voit que son profil

**Étapes:**
1. [ ] Se connecter avec compte membre simple
2. [ ] Ouvrir la console développeur
3. [ ] Exécuter (via Supabase client):
   ```javascript
   const { data, error } = await supabase
     .from('profiles')
     .select('id, email, first_name, last_name, phone')
   console.log(data)
   ```
4. [ ] **Attendu**: Un seul profil retourné (le sien)
5. [ ] **Attendu**: Pas d'accès aux autres profils

**Résultat**: ⬜ Réussi / ⬜ Échoué

**Notes**:
```


```

---

### Test 8: Vérification RLS profiles (membre bureau)

**Objectif**: Vérifier qu'un membre bureau voit tous les profils

**Étapes:**
1. [ ] Se connecter avec compte président/trésorier
2. [ ] Ouvrir la console développeur
3. [ ] Exécuter:
   ```javascript
   const { data, error } = await supabase
     .from('profiles')
     .select('id, email, first_name, last_name, phone')
   console.log(data.length)
   ```
4. [ ] **Attendu**: Tous les profils retournés
5. [ ] **Attendu**: Données complètes (nom, prénom, téléphone, email)

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 9: Vérification consentement enregistré

**Objectif**: Vérifier que le consentement RGPD est tracé

**Étapes:**
1. [ ] Créer un nouveau compte membre avec consentement RGPD
2. [ ] Via Supabase Dashboard → SQL Editor:
   ```sql
   SELECT id, email, volunteer_consent_given, volunteer_consent_date
   FROM profiles
   WHERE email = 'test@example.com';
   ```
3. [ ] **Attendu**: `volunteer_consent_given = true`
4. [ ] **Attendu**: `volunteer_consent_date` = date/heure inscription

**Résultat**: ⬜ Réussi / ⬜ Échoué

**Notes**:
```


```

---

## 📱 Tests responsive

### Test 10: Mobile (320px)

**Objectif**: Vérifier l'affichage mobile

**Étapes:**
1. [ ] Ouvrir `/espace-membres` sur mobile (ou DevTools mobile)
2. [ ] **Attendu**: Formulaire lisible (pas de débordement)
3. [ ] **Attendu**: Case RGPD facilement cliquable
4. [ ] **Attendu**: Texte RGPD lisible
5. [ ] **Attendu**: Boutons accessibles (pas trop petits)
6. [ ] Tester inscription complète
7. [ ] **Attendu**: Workflow fluide sur mobile

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 11: Tablet (768px)

**Objectif**: Vérifier l'affichage tablette

**Étapes:**
1. [ ] Ouvrir `/espace-membres` sur tablette
2. [ ] **Attendu**: Layout adapté
3. [ ] Tester inscription
4. [ ] **Attendu**: Tout fonctionne correctement

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

## 🐛 Tests erreurs

### Test 12: Email déjà utilisé

**Objectif**: Vérifier gestion erreur email existant

**Étapes:**
1. [ ] Tenter de créer compte avec email existant
2. [ ] **Attendu**: Message "Cet email est déjà utilisé"

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 13: Mot de passe trop court

**Objectif**: Vérifier validation mot de passe

**Étapes:**
1. [ ] Tenter mot de passe < 6 caractères
2. [ ] **Attendu**: Validation HTML5 empêche soumission
3. [ ] **Attendu**: Message "Minimum 6 caractères"

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 14: Champs obligatoires vides

**Objectif**: Vérifier validation champs

**Étapes:**
1. [ ] Tenter soumission avec champs vides
2. [ ] **Attendu**: Validation HTML5 empêche soumission

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

## 🎨 Tests UX

### Test 15: Messages utilisateur clairs

**Objectif**: Vérifier la clarté des messages

**Vérifications:**
- [ ] Message "compte membre requis" explicite
- [ ] Message consentement RGPD clair et complet
- [ ] Message succès inscription encourageant
- [ ] Message quota atteint poli
- [ ] Messages d'erreur constructifs

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

### Test 16: Feedback visuel

**Objectif**: Vérifier les indicateurs de chargement

**Vérifications:**
- [ ] Bouton "Inscription..." pendant traitement
- [ ] Désactivation bouton pendant chargement
- [ ] Pas de double soumission possible
- [ ] Messages disparaissent après action

**Résultat**: ⬜ Réussi / ⬜ Échoué

---

## 📊 Récapitulatif

**Tests réussis**: __ / 16  
**Tests échoués**: __ / 16

**Bloquants identifiés**:
```




```

**Points à améliorer**:
```




```

**Validation finale**: ⬜ OK pour production / ⬜ Corrections nécessaires

---

**Testeur**: _______________  
**Date**: _______________  
**Environnement**: ⬜ Dev / ⬜ Staging / ⬜ Production
