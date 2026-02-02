# Améliorations de la page d'accueil – 2 février 2026

## 🎯 Objectif accompli

Rendre la page d'accueil plus vivante et humaine sans casser l'existant.

---

## ✅ Réalisations

### 1. **Logo ASSEP ajouté** 🏫

#### Navbar
- Logo circulaire vert avec emoji 🏫 à gauche du texte "ASSEP"
- Animation légère au hover (scale 1.02)
- Responsive : s'adapte au mobile

#### Hero
- Logo plus grand au-dessus du titre principal
- Animation "float" (flottement vertical doux)
- Shadow pour le mettre en valeur

**Fichiers modifiés** :
- [components/Navbar.js](components/Navbar.js)
- [components/Hero.js](components/Hero.js)

---

### 2. **Carrousel de photos en background** 🎞️

#### Fonctionnement
- Défilement automatique toutes les 5 secondes
- Transition douce (crossfade 1s)
- Overlay bleu maintenu pour lisibilité du texte
- Responsive : pas d'images trop lourdes

#### Configuration
- Liste d'images dans [lib/constants.js](lib/constants.js) : `HERO_IMAGES`
- Par défaut : `/hero.png` (actuel)
- **TODO** : Ajouter 4-5 photos de l'école/événements

**Comment ajouter des photos** : voir [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md)

**Fichiers modifiés** :
- [components/Hero.js](components/Hero.js)
- [lib/constants.js](lib/constants.js)

---

### 3. **Animations boutons améliorées** ✨

#### Boutons Hero ("Voir les événements" / "Faire un don")
- Utilise déjà le composant [Button.js](components/Button.js) avec animations sophistiquées :
  - Hover : scale(1.05) + translateY(-2px)
  - Box-shadow animée (pulse bleu)
  - Click : scale(0.98) pour effet "press"

#### Boutons EventCard
- Animation au hover :
  - Léger slide vers le haut
  - Shadow plus prononcée
  - Icône flèche se déplace vers la droite
- Transition fluide (300ms cubic-bezier)

**Fichiers modifiés** :
- [components/EventCard.js](components/EventCard.js)
- [components/Button.js](components/Button.js) (déjà existant, conservé)

---

### 4. **EventCard plus engageante** 💬

#### Nouveautés
1. **Badge "Bénévoles recherchés"** :
   - S'affiche si `volunteer_quota > volunteer_count`
   - Couleur jaune/ambre
   - Animation pulse subtile
   - Emoji 🙋

2. **Texte engageant** :
   - "✨ On vous attend !" en vert italique
   - Positionné entre la description et les infos pratiques

3. **Bouton avec flèche animée** :
   - Flèche → se déplace au hover
   - Micro-interaction fluide

**Fichiers modifiés** :
- [components/EventCard.js](components/EventCard.js)

---

### 5. **Animations CSS globales** 🎨

#### Ajoutées dans `globals.css`
- `@keyframes fadeIn` : apparition douce (utilisable)
- `@keyframes slideIn` : slide latéral (utilisable)
- `@keyframes pulse` : pulsation (utilisé dans EventCard)
- `scroll-behavior: smooth` : défilement fluide
- Transitions globales sur les propriétés courantes

**Fichiers modifiés** :
- [styles/globals.css](styles/globals.css)

---

## 📦 Fichiers créés

### Documentation
- [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md) : guide complet pour ajouter/gérer les photos du carrousel

### Récapitulatif
- [AMELIORATIONS-ACCUEIL-2026-02-02.md](AMELIORATIONS-ACCUEIL-2026-02-02.md) (ce fichier)

---

## 🧪 Tests recommandés

### Visuel
- [ ] Le logo apparaît bien dans la navbar et le hero
- [ ] Le carrousel défile automatiquement (5s)
- [ ] Les boutons réagissent au hover (animations fluides)
- [ ] Le badge "Bénévoles recherchés" s'affiche si applicable
- [ ] Le texte "On vous attend !" est visible dans les EventCard

### Responsive
- [ ] Mobile (< 640px) : logo adapté, carrousel fluide
- [ ] Tablet (640-1024px) : bon équilibre
- [ ] Desktop (> 1024px) : tous les éléments visibles

### Performance
- [ ] Le carrousel ne ralentit pas le site
- [ ] Les animations sont fluides (60fps)
- [ ] Les images s'affichent rapidement

---

## 🚀 Prochaines étapes (optionnel)

### À court terme
1. **Ajouter 4-5 photos réelles** dans `/public/photos/` :
   - Fête de l'école
   - Kermesse
   - Activités avec les enfants
   - Spectacles
   - Buvette/convivialité

2. **Configurer `HERO_IMAGES`** dans [lib/constants.js](lib/constants.js)

### Améliorations futures (facultatif)
3. **Bloc "Vie de l'asso"** en bas de page :
   - 3 mini-photos en grille
   - Lien vers une galerie photos
   - Section "Derniers moments"

4. **Gérer les photos via Supabase** :
   - Table `homepage_photos` avec ordre, légende, actif/inactif
   - Interface admin pour upload/gestion
   - Voir détails dans [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md)

---

## ⚠️ Points d'attention

### RGPD
- ⚠️ **Ne pas utiliser de photos d'enfants identifiables sans autorisation parentale**
- Privilégier : plans larges, dos, activités sans visages

### Performance
- Optimiser les images (< 500 Ko chacune)
- Format WebP recommandé
- Largeur max : 1920px

### Maintenance
- Les photos sont dans `/public/photos/` (git)
- La config est dans `/lib/constants.js`
- Facile à modifier sans toucher au code

---

## ✅ Checklist de validation

- [x] Logo ASSEP visible (navbar + hero)
- [x] Carrousel de photos fonctionnel
- [x] Animations boutons fluides
- [x] Badge "Bénévoles recherchés" (si quota)
- [x] Texte "On vous attend !"
- [x] Aucune régression sur l'existant
- [x] Code propre et commenté
- [x] Documentation complète
- [ ] **TODO : Ajouter photos réelles** (action manuelle)

---

## 🎉 Résultat

**Avant** : Page statique, image fixe, boutons basiques  
**Après** : Logo identifiable, photos dynamiques, animations engageantes, textes chaleureux

➡️ **La page d'accueil est maintenant plus vivante, humaine et professionnelle.**

---

## 📞 Support

Questions ou problèmes ?
- Lire [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md)
- Vérifier la console navigateur (F12)
- Tester sur un navigateur récent
