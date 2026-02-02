# Instructions rapides : Ajouter des photos à la page d'accueil

## 🚀 Quick Start (2 minutes)

### Étape 1 : Ajouter vos photos

1. Créez le dossier si nécessaire :
```bash
mkdir -p /workspaces/ASSEP/public/photos
```

2. Copiez 3-5 photos de vos événements dans `/workspaces/ASSEP/public/photos/`

Nommez-les par exemple :
- `fete-ecole-2025.jpg`
- `kermesse.jpg`
- `activite-enfants.jpg`
- `spectacle.jpg`
- `buvette.jpg`

### Étape 2 : Les déclarer dans le code

Éditez `/workspaces/ASSEP/lib/constants.js`, ligne ~15 :

```javascript
// Images du carrousel hero
export const HERO_IMAGES = [
  '/hero.png',
  '/photos/fete-ecole-2025.jpg',
  '/photos/kermesse.jpg',
  '/photos/activite-enfants.jpg',
  '/photos/spectacle.jpg'
]
```

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

## 🔄 Si vous n'avez pas encore de photos

Le site fonctionne déjà avec `/hero.png` (image actuelle).

Le carrousel attendra que vous ajoutiez d'autres images.

---

## 📚 Documentation complète

Pour plus de détails, voir :
- [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md) : guide complet
- [AMELIORATIONS-ACCUEIL-2026-02-02.md](AMELIORATIONS-ACCUEIL-2026-02-02.md) : récapitulatif des améliorations
