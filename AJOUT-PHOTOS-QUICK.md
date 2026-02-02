# Instructions rapides : Ajouter des photos à la page d'accueil

## ⚠️ MISE À JOUR : Nouvelle structure organisée

**Ce guide a été remplacé par une structure plus claire.**

➡️ **Voir maintenant : [STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md)**

Cette nouvelle structure vous indique **exactement** où placer chaque photo.

---

## 🚀 Quick Start (2 minutes)

### Étape 1 : Ajouter vos photos

Les photos du carrousel vont maintenant dans :

```bash
/workspaces/ASSEP/public/photos/home/hero/
```

1. Copiez 3-5 photos de vos événements dans ce dossier

2. Renommez-les avec un **préfixe numérique** :
   - `01-fete-ecole-2025.jpg`
   - `02-kermesse.jpg`
   - `03-activite-enfants.jpg`
   - `04-spectacle.jpg`
   - `05-buvette.jpg`

**Pourquoi ?** Le préfixe contrôle l'ordre de défilement.

---

### Étape 2 : Les déclarer dans le code

Éditez `/workspaces/ASSEP/lib/constants.js`, ligne ~19 :

```javascript
// Images du carrousel hero (ordre alphabétique)
export const HERO_IMAGES = [
  '/photos/home/hero/hero.png',
  '/photos/home/hero/01-fete-ecole-2025.jpg',
  '/photos/home/hero/02-kermesse.jpg',
  '/photos/home/hero/03-activite-enfants.jpg',
  '/photos/home/hero/04-spectacle.jpg'
]
```

---

### Étape 3 : C'est fini !

Rechargez la page d'accueil → Le carrousel défile automatiquement vos photos.

---

## 📏 Optimisation recommandée

Avant d'ajouter les photos, optimisez-les :

**Outil en ligne** : https://tinypng.com

- Largeur : 1920px max
- Format : JPG ou WebP
- Poids : < 500 Ko par image

---

## 📂 Structure complète des images

Pour savoir où placer **toutes les photos** du site (événements, logo, etc.) :

➡️ **Voir : [STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md)**

---

## 📚 Documentation complète

- [STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md) : **Structure organisée de tous les dossiers**
- [/public/photos/home/hero/README.md](/public/photos/home/hero/README.md) : Guide carrousel détaillé
- [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md) : Guide technique complet
- [AMELIORATIONS-ACCUEIL-2026-02-02.md](AMELIORATIONS-ACCUEIL-2026-02-02.md) : Récapitulatif des améliorations
