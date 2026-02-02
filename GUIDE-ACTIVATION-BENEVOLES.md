# Guide rapide : Activer l'inscription bénévoles

## ✅ Ce qui a été fait

1. **Nouveau champ dans le formulaire d'édition** : "👥 Nombre de bénévoles recherchés"
2. **Composant d'inscription** : Affiche automatiquement sur la page événement si objectif > 0
3. **API complète** : Inscription, désinscription, compteurs

---

## 🚀 Étapes pour activer

### 1️⃣ Appliquer la migration Supabase (OBLIGATOIRE)

**Via Supabase Dashboard** :
1. Ouvrir [Supabase Dashboard](https://supabase.com/dashboard) → Votre projet
2. Aller dans **SQL Editor**
3. Copier le contenu de `supabase/migrations/0014_volunteers_simple_signup.sql`
4. Coller et **Exécuter**

✅ La colonne `volunteer_target` sera ajoutée à la table `events`

---

### 2️⃣ Configurer un événement

1. **Se connecter** au dashboard
2. Aller dans **Dashboard → Événements**
3. Cliquer sur **Modifier** pour un événement (ex: "Carnavalle")
4. Descendre jusqu'au nouveau champ :
   ```
   👥 Nombre de bénévoles recherchés
   [  5  ]  ← Entrez un nombre (ex: 5)
   ```
5. **Enregistrer**

---

### 3️⃣ Vérifier sur la page publique

1. Aller sur la page de l'événement : `/evenements/carnavalle`
2. **Le bloc "Bénévoles" devrait apparaître** :
   ```
   🙋 Bénévoles
   
   0/5
   0 bénévole inscrit
   5 places restantes
   
   [S'inscrire comme bénévole]
   ```

---

## ❓ Pourquoi je ne vois rien ?

### Problème 1 : La migration n'est pas appliquée
**Symptôme** : Erreur lors de l'enregistrement de l'événement

**Solution** : Appliquer la migration SQL (étape 1️⃣)

---

### Problème 2 : `volunteer_target = 0`
**Symptôme** : Pas de bloc "Bénévoles" sur la page événement

**Solution** : Le composant est **caché par défaut** si `volunteer_target = 0`
- Éditer l'événement
- Mettre un nombre > 0 (ex: 5)
- Enregistrer

---

### Problème 3 : L'événement n'est pas publié
**Symptôme** : Page événement non accessible

**Solution** : Publier l'événement depuis le dashboard

---

## 📊 Comment ça marche ?

```
Si volunteer_target = 0  →  Bloc caché
Si volunteer_target > 0  →  Bloc visible avec:
   - Compteur "inscrits/objectif"
   - Bouton inscription (si places restantes)
   - Bouton désactivé si complet
```

---

## 🧪 Test rapide

```sql
-- Vérifier que la colonne existe
SELECT id, name, volunteer_target FROM events LIMIT 5;

-- Mettre Carnavalle à 5 bénévoles
UPDATE events 
SET volunteer_target = 5 
WHERE slug = 'carnavalle';

-- Vérifier les inscriptions
SELECT COUNT(*) 
FROM event_volunteers 
WHERE shift_id IS NULL 
  AND status = 'confirmed';
```

---

## 📝 Fichiers modifiés

- [pages/dashboard/evenements/[id]/edit.js](../pages/dashboard/evenements/[id]/edit.js) ← **Nouveau champ**
- [components/VolunteerSignup.js](../components/VolunteerSignup.js) ← Composant d'inscription
- [pages/api/events/volunteers.js](../pages/api/events/volunteers.js) ← API
- [pages/evenements/[slug].js](../pages/evenements/[slug].js) ← Intégration

---

🎉 **Une fois la migration appliquée, tout devrait fonctionner !**
