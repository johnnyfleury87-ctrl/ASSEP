# 🎨 Dossier : Identité visuelle / Brand

## 📍 Où ça s'affiche ?

Ce dossier contient tous les éléments d'identité visuelle du site :
- **Logo ASSEP** : navbar + hero + footer
- **Favicon** : icône du navigateur (onglet)
- **Logo JETC** : footer (développeur du site)

---

## 📦 Fichiers attendus

### Logo principal ASSEP

**Fichier** : `logo-assep.png` ou `logo-assep.svg`  
**Format recommandé** : PNG avec transparence OU SVG  
**Dimensions** : 200x200px minimum (SVG = illimité)  
**Poids max** : 50 Ko  
**Où** : Navbar (40x40px) + Hero (80x80px)

**Actuellement** : Emoji 🏫 (placeholder)  
➡️ **Action** : Remplacer par le vrai logo ASSEP

---

### Favicon

**Fichiers** :
- `favicon.ico` (16x16, 32x32, 48x48)
- `favicon.svg` (recommandé, moderne)

**Format** : ICO + SVG  
**Poids max** : 10 Ko  
**Où** : Onglet du navigateur, favoris, mobile

**Actuellement** : 
- ✅ `favicon.ico` (présent)
- ✅ `favicon.svg` (présent)

---

### Logo JETC Solution

**Fichier** : `jetc-logo.png`  
**Format** : PNG avec transparence  
**Dimensions** : 150x50px environ  
**Poids max** : 30 Ko  
**Où** : Footer (crédit développeur)

**Actuellement** : ✅ `jetc-logo.png` (présent)

---

## 🔧 Utilisation dans le code

### Logo ASSEP

Actuellement placeholder emoji dans :
- `/components/Navbar.js` ligne ~50
- `/components/Hero.js` ligne ~75

**Pour remplacer** :
1. Ajoutez `logo-assep.png` ou `logo-assep.svg` ici
2. Remplacez l'emoji par :
```jsx
<img 
  src="/assets/brand/logo-assep.png" 
  alt="Logo ASSEP"
  style={{ width: '40px', height: '40px' }}
/>
```

### Favicon

Déclaré dans `/pages/_document.js` :
```jsx
<link rel="icon" href="/assets/brand/favicon.ico" />
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" />
```

### Logo JETC

Déclaré dans `/lib/constants.js` :
```javascript
logoPath: "/assets/brand/jetc-logo.png"
```

---

## ✅ Checklist

- [ ] Ajouter le vrai logo ASSEP (PNG ou SVG)
- [x] Favicon présent et fonctionnel
- [x] Logo JETC présent

---

## 📐 Conseils design

### Logo ASSEP
- Fond transparent (PNG/SVG)
- Contraste suffisant (visible sur fond vert #4CAF50)
- Forme carrée ou circulaire (s'adapte au cercle vert)
- Éviter les détails trop fins (illisibles en petit)

### Favicon
- Simple et reconnaissable en 16x16px
- Forme géométrique claire
- 2-3 couleurs max
- Testable : https://realfavicongenerator.net/

---

## 🚫 Ne pas modifier

- `jetc-logo.png` : propriété JETC Solution
