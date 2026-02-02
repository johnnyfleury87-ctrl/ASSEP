# 🖼️ Dossier : Photos par défaut événements

## 📍 Où ça s'affiche ?

**Carte événement** (EventCard) sur la page d'accueil et liste événements  
Utilisé quand un événement **n'a pas de photo de couverture** uploadée.

**Composant** : `/components/EventCard.js`  
**Fallback** : Si `event.cover_photo` est vide

---

## 📸 Photo attendue

**Fichier** : `event-default.jpg` ou `event-default.png`  
**Format** : JPG ou PNG  
**Dimensions** : 800x600px (4:3) ou 1200x600px (2:1)  
**Poids max** : 300 Ko  
**Orientation** : Paysage (horizontal)

---

## 🎨 Sujet recommandé

**Image générique représentant l'association** :
- Logo ASSEP sur fond coloré
- Illustration "événement" (calendrier, ballons, fête)
- Photo de l'école vue de l'extérieur
- Montage photos d'ambiance

**Style** :
- Neutre et accueillant
- Pas trop spécifique (utilisable pour tout type d'événement)
- Couleurs vives et engageantes

---

## 🔧 Utilisation dans le code

### Fichier : `/components/EventCard.js`

Actuellement : Emoji 🏃 en fallback (ligne ~50)

**Pour utiliser l'image par défaut**, remplacez par :

```javascript
) : (
  <div style={{
    width: '100%',
    height: '200px',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0'
  }}>
    <img
      src="/photos/events/default/event-default.jpg"
      alt="Événement ASSEP"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover'
      }}
    />
  </div>
)}
```

---

## ✅ Checklist

- [ ] Créer ou choisir une image par défaut
- [ ] La nommer `event-default.jpg`
- [ ] L'optimiser (< 300 Ko, 800x600px)
- [ ] La placer dans ce dossier
- [ ] Adapter le code EventCard.js

---

## 💡 Idées d'images par défaut

### Option 1 : Logo ASSEP centré
```
Fond dégradé vert (#4CAF50)
Logo ASSEP au centre
Texte "Événement à venir" en bas
```

### Option 2 : Collage photos
```
Montage de 3-4 photos d'événements passés
Filtre uniforme (noir 30% ou vert transparent)
```

### Option 3 : Illustration
```
Icône calendrier/fête stylisée
Couleurs ASSEP (vert + bleu)
Style moderne/flat
```

---

## 🚀 Création rapide

**Outil en ligne** : https://www.canva.com

1. Format : 800x600px
2. Background : Dégradé vert (#4CAF50 → #81C784)
3. Ajoutez : Logo ASSEP (ou emoji 🏫)
4. Texte : "Événement ASSEP"
5. Export : JPG, qualité 80%, < 300 Ko

---

## 🔗 Alternative : Emoji actuel

Si vous n'avez pas d'image par défaut, l'emoji 🏃 (actuel) fonctionne correctement.  
Il est simple, clair, et ne nécessite aucune bande passante.

**Avantages emoji** :
- Poids : 0 Ko
- Responsive natif
- Pas de chargement

**Avantages image** :
- Plus professionnel
- Branding ASSEP
- Cohérence visuelle
