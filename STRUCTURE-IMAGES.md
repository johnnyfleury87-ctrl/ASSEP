# 📁 Structure organisée des images et assets

## 🎯 Objectif

Structure claire et organisée pour savoir **exactement où placer chaque photo** et **où elle s'affichera** sur le site.

---

## 📂 Arborescence complète

```
/public/
├── assets/
│   └── brand/                    🎨 IDENTITÉ VISUELLE
│       ├── README.md            → Guide logo, favicon
│       ├── logo-assep.png       (à ajouter)
│       ├── favicon.ico          ✅ Présent
│       ├── favicon.svg          ✅ Présent
│       └── jetc-logo.png        ✅ Présent
│
└── photos/
    ├── home/                     🏠 PAGE D'ACCUEIL
    │   ├── hero/                🎞️ CARROUSEL HERO (bande bleue)
    │   │   ├── README.md        → Guide carrousel
    │   │   ├── hero.png         ✅ Présent (actuel)
    │   │   ├── 01-xxx.jpg       (à ajouter)
    │   │   ├── 02-xxx.jpg       (à ajouter)
    │   │   └── 03-xxx.jpg       (à ajouter)
    │   │
    │   └── highlights/          ✨ VIGNETTES "VIE DE L'ASSO"
    │       ├── README.md        → Guide vignettes
    │       ├── 01-xxx.jpg       (optionnel, futur)
    │       └── 02-xxx.jpg       (optionnel, futur)
    │
    └── events/                   📅 ÉVÉNEMENTS
        ├── README.md            → Guide photos événements
        ├── default/             🖼️ PHOTO PAR DÉFAUT
        │   ├── README.md        → Guide fallback
        │   └── event-default.jpg (à ajouter)
        │
        ├── kermesse-2025/       📸 EXEMPLE ÉVÉNEMENT
        │   ├── cover.jpg        (photo de couverture)
        │   ├── 01-stand.jpg     (galerie)
        │   ├── 02-buvette.jpg   (galerie)
        │   └── 03-spectacle.jpg (galerie)
        │
        └── <slug-evenement>/    📸 AUTRES ÉVÉNEMENTS
            ├── cover.jpg
            └── 0X-xxx.jpg
```

---

## 🗺️ Où s'affiche quoi ?

### 🎨 `/public/assets/brand/`

| Fichier | Où ça s'affiche | Taille | Poids max |
|---------|-----------------|--------|-----------|
| `logo-assep.png` | Navbar + Hero + Footer | 40x40 → 80x80px | 50 Ko |
| `favicon.ico` | Onglet navigateur | 16x16, 32x32px | 10 Ko |
| `favicon.svg` | Onglet navigateur (moderne) | Vectoriel | 10 Ko |
| `jetc-logo.png` | Footer (crédit dev) | 150x50px | 30 Ko |

**Documentation** : [/public/assets/brand/README.md](/public/assets/brand/README.md)

---

### 🏠 `/public/photos/home/hero/`

| Photos | Où ça s'affiche | Taille | Poids max |
|--------|-----------------|--------|-----------|
| `hero.png` | Carrousel hero (bande bleue) | 1920x1080px | 500 Ko |
| `01-xxx.jpg` | Carrousel hero (photo 1) | 1920x1080px | 500 Ko |
| `02-xxx.jpg` | Carrousel hero (photo 2) | 1920x1080px | 500 Ko |
| `0X-xxx.jpg` | Carrousel hero (photo N) | 1920x1080px | 500 Ko |

**Ordre** : Alphabétique (préfixe numérique 01-, 02-... obligatoire)  
**Défilement** : Automatique toutes les 5 secondes  
**Documentation** : [/public/photos/home/hero/README.md](/public/photos/home/hero/README.md)

---

### ✨ `/public/photos/home/highlights/`

| Photos | Où ça s'affiche | Taille | Poids max |
|--------|-----------------|--------|-----------|
| `01-xxx.jpg` | Section "Vie de l'asso" (futur) | 800x600px | 200 Ko |
| `02-xxx.jpg` | Grille 3 colonnes (futur) | 800x600px | 200 Ko |
| `0X-xxx.jpg` | Vignettes accueil (futur) | 800x600px | 200 Ko |

**Statut** : 🚧 Fonctionnalité optionnelle (pas encore implémentée)  
**Documentation** : [/public/photos/home/highlights/README.md](/public/photos/home/highlights/README.md)

---

### 📅 `/public/photos/events/default/`

| Fichier | Où ça s'affiche | Taille | Poids max |
|---------|-----------------|--------|-----------|
| `event-default.jpg` | EventCard (si pas de cover) | 800x600px | 300 Ko |

**Fallback** : Utilisé quand un événement n'a pas de photo  
**Documentation** : [/public/photos/events/default/README.md](/public/photos/events/default/README.md)

---

### 📸 `/public/photos/events/<slug>/`

| Fichier | Où ça s'affiche | Taille | Poids max |
|---------|-----------------|--------|-----------|
| `cover.jpg` | EventCard + Page événement | 1200x600px | 300 Ko |
| `01-xxx.jpg` | Galerie événement (futur) | 1200x800px | 400 Ko |
| `02-xxx.jpg` | Galerie événement (futur) | 1200x800px | 400 Ko |
| `0X-xxx.jpg` | Galerie événement (futur) | 1200x800px | 400 Ko |

**Un dossier par événement** (slug = URL de l'événement)  
**Ordre galerie** : Alphabétique (préfixe numérique)  
**Documentation** : [/public/photos/events/README.md](/public/photos/events/README.md)

---

## 🚀 Quick Start : Ajouter des photos

### 1. Photos carrousel page d'accueil

```bash
# Placer les photos dans le dossier hero
cp mes-photos/*.jpg /workspaces/ASSEP/public/photos/home/hero/

# Les renommer avec préfixe numérique
mv fete-ecole.jpg 01-fete-ecole.jpg
mv kermesse.jpg 02-kermesse.jpg
```

**Déclarer dans le code** : `/lib/constants.js` → `HERO_IMAGES`

```javascript
export const HERO_IMAGES = [
  '/photos/home/hero/hero.png',
  '/photos/home/hero/01-fete-ecole.jpg',
  '/photos/home/hero/02-kermesse.jpg',
  '/photos/home/hero/03-activite-enfants.jpg'
]
```

---

### 2. Photo de couverture d'un événement

```bash
# Créer le dossier de l'événement (slug = URL)
mkdir -p /workspaces/ASSEP/public/photos/events/kermesse-2025

# Ajouter la cover
cp ma-photo-cover.jpg /workspaces/ASSEP/public/photos/events/kermesse-2025/cover.jpg

# Ajouter des photos de galerie (futur)
cp photo1.jpg /workspaces/ASSEP/public/photos/events/kermesse-2025/01-stand-jeux.jpg
cp photo2.jpg /workspaces/ASSEP/public/photos/events/kermesse-2025/02-buvette.jpg
```

**Si Supabase Storage** : Uploader dans le bucket `event-photos`  
**Mettre à jour la BDD** : `events.cover_photo = 'cover.jpg'`

---

## ✅ Conventions de nommage

### ✅ BONNES PRATIQUES

| Type | Exemple | Pourquoi |
|------|---------|----------|
| Carrousel hero | `01-fete-ecole.jpg` | Ordre contrôlé |
| Galerie événement | `01-stand-jeux.jpg` | Ordre logique |
| Cover événement | `cover.jpg` | Standard, simple |
| Photo par défaut | `event-default.jpg` | Explicite |

### ❌ À ÉVITER

| ❌ Mauvais | ✅ Bon | Problème |
|-----------|-------|----------|
| `photo1.jpg` | `01-fete.jpg` | Ordre alphabétique incorrect |
| `IMG_5678.jpg` | `01-activite.jpg` | Pas descriptif |
| `kermesse cover.jpg` | `cover.jpg` | Espaces = problèmes |
| `PHOTO.JPG` | `photo.jpg` | Majuscules = confusion |

---

## 📏 Optimisation des images

### Outils recommandés

- **https://tinypng.com** : Compression JPG/PNG (gratuit)
- **https://squoosh.app** : Conversion WebP, redimensionnement
- **ImageOptim** (macOS) : Compression locale

### Objectifs

| Type | Taille | Poids max | Format |
|------|--------|-----------|--------|
| Carrousel hero | 1920x1080px | < 500 Ko | JPG, WebP |
| Cover événement | 1200x600px | < 300 Ko | JPG |
| Galerie événement | 1200x800px | < 400 Ko | JPG, WebP |
| Vignettes accueil | 800x600px | < 200 Ko | JPG |

---

## 🔗 Documentation par dossier

Chaque dossier contient un **README.md détaillé** :

- [/public/assets/brand/README.md](/public/assets/brand/README.md) - Logo, favicon
- [/public/photos/home/hero/README.md](/public/photos/home/hero/README.md) - Carrousel hero
- [/public/photos/home/highlights/README.md](/public/photos/home/highlights/README.md) - Vignettes (futur)
- [/public/photos/events/default/README.md](/public/photos/events/default/README.md) - Fallback
- [/public/photos/events/README.md](/public/photos/events/README.md) - Photos par événement

---

## 🔧 Configuration dans le code

### Carrousel hero

**Fichier** : `/lib/constants.js`

```javascript
export const HERO_IMAGES = [
  '/photos/home/hero/hero.png',
  '/photos/home/hero/01-xxx.jpg',
  '/photos/home/hero/02-xxx.jpg'
]
```

### Logo et favicon

**Fichier** : `/lib/constants.js`

```javascript
export const JETC = {
  logoPath: "/assets/brand/jetc-logo.png"
}
```

**Fichier** : `/pages/_document.js`

```jsx
<link rel="icon" href="/assets/brand/favicon.ico" />
<link rel="icon" href="/assets/brand/favicon.svg" type="image/svg+xml" />
```

### Photo cover événement

**Fichier** : `/components/EventCard.js`

```javascript
const coverImageUrl = event.cover_photo
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.cover_photo}`
  : '/photos/events/default/event-default.jpg'
```

---

## ✅ Checklist globale

### Identité visuelle

- [ ] Logo ASSEP ajouté (`/assets/brand/logo-assep.png`)
- [x] Favicon présent et fonctionnel
- [x] Logo JETC présent

### Page d'accueil

- [ ] 3-5 photos ajoutées dans `/photos/home/hero/`
- [ ] Photos déclarées dans `/lib/constants.js` → `HERO_IMAGES`
- [ ] Photos optimisées (< 500 Ko chacune)

### Événements

- [ ] Photo par défaut créée (`/photos/events/default/event-default.jpg`)
- [ ] Dossiers créés par événement (`/photos/events/<slug>/`)
- [ ] Covers ajoutées (`cover.jpg` dans chaque dossier)

---

## 🎯 Résultat attendu

Avec cette structure, vous savez **exactement** :
- ✅ Où placer chaque photo
- ✅ Comment la nommer
- ✅ Où elle s'affichera sur le site
- ✅ Quelle taille/poids respecter
- ✅ Comment la déclarer dans le code

**➡️ Terminé le flou : chaque fichier a sa place !**

---

## 🆘 Support

Questions ou problèmes ?
- Lire le README.md du dossier concerné
- Vérifier la console navigateur (F12)
- Restart du serveur Next.js (`npm run dev`)
