# 🔧 FIX: Bénévoles inscrits maintenant visibles - 2026-02-02

## ❌ Problème identifié

Les bénévoles inscrits n'apparaissaient pas dans la page "Bénévoles" (affichage: "0 bénévole(s) inscrit(s)").

**Cause racine** : Les policies RLS sur la table `profiles` (migration 0016) bloquaient la jointure dans la requête côté client.

### Détails techniques

```javascript
// ❌ ANCIEN CODE (ne fonctionnait pas)
const { data: signups } = await supabase
  .from('event_volunteers')
  .select(`
    *,
    profiles (      // ← Cette jointure échouait à cause des RLS profiles
      first_name,
      last_name,
      email,
      phone
    )
  `)
  .eq('event_id', id)
  .eq('status', 'confirmed')
```

La migration 0016 a sécurisé la table `profiles` :
- Seul le bureau peut voir tous les profiles
- Chaque utilisateur peut voir uniquement son propre profile

**Problème** : Les policies RLS s'appliquent même aux jointures dans les requêtes Supabase côté client, ce qui bloquait l'affichage.

---

## ✅ Solution appliquée

Créer une route API qui utilise `supabaseAdmin` pour **bypass les RLS** et récupérer les données.

### Changements effectués

1. **Nouvelle route API** : [`/api/events/[id]/volunteers.js`](pages/api/events/[id]/volunteers.js)
   - Vérifie l'authentification
   - Vérifie que l'utilisateur est membre du bureau
   - Utilise `supabaseAdmin` pour récupérer les bénévoles avec leurs données profiles
   - Retourne les données au format JSON

2. **Page bénévoles modifiée** : [`pages/dashboard/evenements/[id]/benevoles.js`](pages/dashboard/evenements/[id]/benevoles.js)
   - Appelle l'API au lieu de faire la requête directe
   - Passe le token d'authentification
   - Affiche les résultats

### Code après correction

```javascript
// ✅ NOUVEAU CODE (fonctionne)

// Côté page - appel API
const token = (await supabase.auth.getSession()).data.session?.access_token

const response = await fetch(`/api/events/${id}/volunteers`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

if (response.ok) {
  const data = await response.json()
  setVolunteers(data.volunteers || [])
}
```

```javascript
// ✅ Côté API - utilise supabaseAdmin

// Vérifier que l'utilisateur est bureau
const isBureau = profile.is_jetc_admin || 
  ['president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire'].includes(profile.role)

// Récupérer avec supabaseAdmin (bypass RLS)
const { data: volunteers } = await supabaseAdmin
  .from('event_volunteers')
  .select(`
    id,
    event_id,
    profile_id,
    shift_id,
    status,
    notes,
    created_at,
    profiles!inner (
      first_name,
      last_name,
      email,
      phone
    )
  `)
  .eq('event_id', id)
  .eq('status', 'confirmed')
```

---

## 🎯 Résultat

✅ **Les membres du bureau voient maintenant tous les bénévoles inscrits** avec :
- Prénom
- Nom
- Email
- Téléphone
- Statut

✅ **Sécurité maintenue** :
- Seul le bureau peut accéder à l'API
- Vérification d'authentification
- Vérification du rôle

✅ **Performance** :
- Une seule requête API
- Pas de problème de RLS
- Données complètes

---

## 📦 Fichiers modifiés

- ✏️ [`pages/dashboard/evenements/[id]/benevoles.js`](pages/dashboard/evenements/[id]/benevoles.js) - Utilise l'API
- ⭐ [`pages/api/events/[id]/volunteers.js`](pages/api/events/[id]/volunteers.js) - **NOUVEAU** - Route API

---

## 🚀 Déploiement

✅ **Code poussé** : Commit `cbce3ab`  
✅ **Build OK** : Aucune erreur  
✅ **Prêt** : Vercel redéploie automatiquement  

---

## 🧪 Test

1. Se connecter en tant que membre du bureau
2. Aller sur Dashboard > Événements
3. Cliquer sur "👥 Bénévoles" sur un événement
4. ✅ Vérifier que les bénévoles inscrits apparaissent avec leurs informations

---

## 📝 Pourquoi cette solution ?

### Alternative écartée : Modifier les policies RLS

❌ **Problème** : Aurait ouvert l'accès aux données personnelles à tous les utilisateurs authentifiés

### Solution choisie : Route API avec admin

✅ **Avantages** :
- Sécurité maximale (vérification bureau côté serveur)
- Contrôle total sur les données exposées
- Pas de modification des policies RLS existantes
- Audit trail (logs API)

---

**Date** : 2026-02-02  
**Commit** : cbce3ab  
**Statut** : ✅ Résolu
