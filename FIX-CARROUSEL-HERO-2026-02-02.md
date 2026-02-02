# ✅ Carrousel Hero corrigé - 2 février 2026

## 🔧 Problème résolu

**Symptôme** : Les images `01.jpg`, `02.jpg`, `03.jpg` étaient présentes dans `/public/photos/home/hero/` mais le carrousel ne défilait pas.

**Cause** : Les images n'étaient **pas déclarées** dans le fichier [lib/constants.js](lib/constants.js). Le tableau `HERO_IMAGES` contenait uniquement `hero.png`, ce qui empêchait le défilement (il faut au moins 2 images).

**Solution** : Mise à jour de `HERO_IMAGES` pour inclure vos 3 nouvelles photos.

---

## ✅ Ce qui a été corrigé

### Fichier : [lib/constants.js](lib/constants.js)

**Avant** :
```javascript
export const HERO_IMAGES = [
  '/photos/home/hero/hero.png',
  // TODO: Ajouter plus de photos...
]
```

**Après** :
```javascript
export const HERO_IMAGES = [
  '/photos/home/hero/01.jpg',
  '/photos/home/hero/02.jpg',
  '/photos/home/hero/03.jpg'
]
```

---

## 🎯 Comportement attendu (maintenant actif)

### Carrousel automatique

✅ **Défilement** : Toutes les 5 secondes  
✅ **Transition** : Fade doux (opacity 1s ease-in-out)  
✅ **Ordre** : 01.jpg → 02.jpg → 03.jpg → boucle  
✅ **Overlay bleu** : Maintenu pour lisibilité du texte  
✅ **Responsive** : Fonctionne sur mobile

### Code technique (déjà en place)

Le composant [components/Hero.js](components/Hero.js) utilise :
- `useState` pour l'index actuel
- `useEffect` avec `setInterval` pour le défilement
- `clearInterval` au unmount (pas de fuite mémoire)
- Transition CSS pure (pas de lib externe)

---

## 🧪 Comment tester

### 1. Démarrer le serveur (si pas déjà fait)

```bash
cd /workspaces/ASSEP
npm run dev
```

Le serveur démarre sur : http://localhost:3000

---

### 2. Ouvrir la page d'accueil

Dans votre navigateur (ou dans le Simple Browser de VS Code) :
- Aller sur http://localhost:3000
- Attendre 5 secondes
- Observer le changement d'image en fond du hero (bande bleue)

---

### 3. Vérifier le cycle complet

**Timeline attendue** :
- 0s : `01.jpg` affiché
- 5s : Fade vers `02.jpg`
- 10s : Fade vers `03.jpg`
- 15s : Fade vers `01.jpg` (boucle)

---

## 🐛 Si le carrousel ne défile toujours pas

### Vérification 1 : Images présentes

```bash
ls -la /workspaces/ASSEP/public/photos/home/hero/
```

**Attendu** :
```
01.jpg  ✅
02.jpg  ✅
03.jpg  ✅
```

---

### Vérification 2 : Configuration correcte

```bash
cat /workspaces/ASSEP/lib/constants.js | grep -A 5 "HERO_IMAGES"
```

**Attendu** :
```javascript
export const HERO_IMAGES = [
  '/photos/home/hero/01.jpg',
  '/photos/home/hero/02.jpg',
  '/photos/home/hero/03.jpg'
]
```

---

### Vérification 3 : Console navigateur

Ouvrir la console (F12) et vérifier :
- ❌ Pas d'erreur 404 sur les images
- ❌ Pas d'erreur JavaScript
- ✅ Onglet Network → les 3 JPG sont bien chargés

---

### Vérification 4 : Cache navigateur

Si les images ne s'affichent pas :
1. Forcer le refresh : `Ctrl + Shift + R` (ou `Cmd + Shift + R` sur Mac)
2. Ou vider le cache : `Ctrl + Shift + Suppr` → Cocher "Images et fichiers en cache"

---

### Vérification 5 : Restart complet

```bash
# Arrêter le serveur (Ctrl+C dans le terminal npm run dev)
cd /workspaces/ASSEP
pkill -f "next dev"

# Redémarrer proprement
npm run dev
```

---

## 📐 Personnalisation

### Changer la vitesse de défilement

**Fichier** : [components/Hero.js](components/Hero.js) ligne ~18

```javascript
}, 5000) // Change toutes les 5 secondes
```

**Pour modifier** :
- Plus rapide : `3000` (3 secondes)
- Plus lent : `7000` (7 secondes)

---

### Changer la durée du fade

**Fichier** : [components/Hero.js](components/Hero.js) ligne ~48

```javascript
transition: 'opacity 1s ease-in-out',
```

**Pour modifier** :
- Plus rapide : `opacity 0.5s ease-in-out`
- Plus lent : `opacity 2s ease-in-out`

---

### Ajouter plus d'images

1. **Ajouter les fichiers** dans `/public/photos/home/hero/` :
   ```
   04.jpg
   05.jpg
   06.jpg
   ```

2. **Les déclarer** dans [lib/constants.js](lib/constants.js) :
   ```javascript
   export const HERO_IMAGES = [
     '/photos/home/hero/01.jpg',
     '/photos/home/hero/02.jpg',
     '/photos/home/hero/03.jpg',
     '/photos/home/hero/04.jpg',
     '/photos/home/hero/05.jpg',
     '/photos/home/hero/06.jpg'
   ]
   ```

3. **Restart** du serveur (`npm run dev`)

---

## ✅ Résultat final

**Avant** :  
❌ Carrousel statique (une seule image)  
❌ Pas de défilement

**Après** :  
✅ Carrousel dynamique (3 images)  
✅ Défilement automatique toutes les 5s  
✅ Fade doux et fluide  
✅ Texte lisible avec overlay  
✅ Mobile responsive

---

## 🎉 Commit effectué

```
fix: activer le carrousel hero avec les nouvelles images

✅ Correction:
- Déclaration de 01.jpg, 02.jpg, 03.jpg dans HERO_IMAGES
- Le carrousel peut maintenant défiler (besoin de 2+ images)
- Défilement automatique toutes les 5s avec fade

Les images étaient présentes mais pas déclarées dans /lib/constants.js
```

**Commit hash** : `4fa04f5`  
**Poussé sur** : `main`

---

## 📚 Documentation

Pour plus d'informations :
- [STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md) - Structure complète des dossiers
- [/public/photos/home/hero/README.md](/public/photos/home/hero/README.md) - Guide carrousel
- [AMELIORATIONS-ACCUEIL-2026-02-02.md](AMELIORATIONS-ACCUEIL-2026-02-02.md) - Améliorations page d'accueil

---

## 🆘 Support

Si le problème persiste :
1. Vérifier que les 3 images existent bien dans le dossier
2. Vérifier la console navigateur (F12)
3. Forcer le refresh (Ctrl + Shift + R)
4. Restart du serveur Next.js
