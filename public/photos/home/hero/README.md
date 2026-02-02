# 🎞️ Dossier : Photos carrousel Hero (page d'accueil)

## 📍 Où ça s'affiche ?

**Bande bleue en haut de la page d'accueil** (section hero)  
Les photos défilent automatiquement en arrière-plan avec un overlay bleu pour garder le texte lisible.

**Composant** : `/components/Hero.js`  
**Configuration** : `/lib/constants.js` → `HERO_IMAGES`

---

## 📸 Photos attendues

**Quantité** : 3 à 6 photos  
**Format** : JPG, PNG, WebP  
**Dimensions** : 1920x1080px (16:9) ou 2560x1080px (21:9)  
**Poids max** : 500 Ko par photo  
**Orientation** : Paysage (horizontal)

---

## 🏷️ Convention de nommage

Les photos sont chargées **par ordre alphabétique** :

```
01-fete-ecole.jpg
02-kermesse.jpg
03-activite-enfants.jpg
04-spectacle-noel.jpg
05-buvette.jpg
```

**Préfixe numérique obligatoire** pour contrôler l'ordre de défilement.

**Exemples valides** :
- ✅ `01-nom-descriptif.jpg`
- ✅ `02_evenement_juin.jpg`
- ✅ `03.jpg` (minimal)

**À éviter** :
- ❌ `photo1.jpg` (ordre alphabétique incorrect)
- ❌ `IMG_1234.jpg` (pas descriptif)

---

## 📐 Cadrage et composition

### ✅ Bonnes pratiques

**Zone centrale** : Éviter les éléments importants au centre (texte hero par-dessus)  
**Tiers inférieur** : Zone couverte par le titre "ASSEP" → éviter visages/textes  
**Luminosité** : Photos lumineuses (l'overlay bleu assombrit)  
**Contraste** : Privilégier des scènes colorées et contrastées

### 🎨 Sujets recommandés

- Fête de l'école (vue d'ensemble, ambiance)
- Kermesse / stand de jeux
- Activités avec les enfants (sport, ateliers)
- Spectacles / représentations
- Moments de convivialité (buvette, pique-nique)
- Bénévoles en action

### ⚠️ À éviter

- Photos floues ou sombres
- Visages d'enfants identifiables (RGPD)
- Plans trop serrés (recadrés par différentes résolutions)
- Photos avec texte/logo d'autres organismes

---

## ⚙️ Configuration technique

### Fichier : `/lib/constants.js`

```javascript
export const HERO_IMAGES = [
  '/photos/home/hero/01-fete-ecole.jpg',
  '/photos/home/hero/02-kermesse.jpg',
  '/photos/home/hero/03-activite-enfants.jpg',
  '/photos/home/hero/04-spectacle-noel.jpg',
  '/photos/home/hero/05-buvette.jpg'
]
```

### Défilement automatique

**Vitesse** : 5 secondes par photo (configurable dans Hero.js ligne ~18)  
**Transition** : Crossfade 1s (opacity)  
**Boucle** : Infinie (retour à la première après la dernière)

---

## 🚀 Quick Start

1. **Optimisez vos photos** (https://tinypng.com)
2. **Renommez-les** : `01-xxx.jpg`, `02-xxx.jpg`...
3. **Copiez-les** dans ce dossier `/public/photos/home/hero/`
4. **Déclarez-les** dans `/lib/constants.js` → `HERO_IMAGES`
5. **Rechargez** la page d'accueil

---

## 📏 Optimisation

**Outils recommandés** :
- https://tinypng.com (compression JPG/PNG)
- https://squoosh.app (conversion WebP, redimensionnement)
- ImageOptim (macOS)

**Objectif** : Photos < 500 Ko, largeur 1920px max

---

## ✅ Checklist avant ajout

- [ ] Photo optimisée (< 500 Ko)
- [ ] Dimensions : 1920x1080px (ou proche)
- [ ] Format : JPG ou WebP
- [ ] Nommée avec préfixe numérique (01-, 02-...)
- [ ] Pas de visage d'enfant identifiable
- [ ] Luminosité correcte (pas trop sombre)
- [ ] Déclarée dans `/lib/constants.js`

---

## 🐛 Problèmes courants

**La photo ne s'affiche pas** :
- Vérifier le chemin dans `HERO_IMAGES` (commence par `/photos/home/hero/`)
- Vérifier que le fichier existe bien dans ce dossier
- Restart du serveur Next.js (`npm run dev`)

**Le carrousel ne défile pas** :
- Il faut au moins 2 photos dans `HERO_IMAGES`
- Vérifier la console navigateur (F12)

**Photos trop lourdes / lentes** :
- Compresser avec TinyPNG ou Squoosh
- Passer en WebP (meilleur ratio qualité/poids)

---

## 🔗 Documentation complète

Voir : [/docs/GUIDE-PHOTOS-ACCUEIL.md](/docs/GUIDE-PHOTOS-ACCUEIL.md)
