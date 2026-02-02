# 🎯 Récapitulatif : Structure organisée des images

## ✅ Mission accomplie

Vous disposez maintenant d'une **structure claire et documentée** pour gérer toutes les images du site ASSEP.

---

## 📂 Arborescence créée

```
/public/
├── assets/brand/          🎨 Identité visuelle
│   ├── README.md         (guide logo/favicon)
│   ├── favicon.ico       ✅
│   ├── favicon.svg       ✅
│   └── jetc-logo.png     ✅
│
└── photos/
    ├── home/             🏠 Page d'accueil
    │   ├── hero/         🎞️ Carrousel
    │   │   ├── README.md (guide carrousel)
    │   │   └── hero.png  ✅
    │   └── highlights/   ✨ Vignettes (futur)
    │       └── README.md
    │
    └── events/           📅 Événements
        ├── README.md     (guide événements)
        ├── default/      🖼️ Photo par défaut
        │   └── README.md
        └── <slug>/       📸 Par événement
            ├── cover.jpg
            └── 0X-xxx.jpg
```

---

## 📖 Documentation créée

### 🗺️ Guide principal

**[STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md)** - Vue d'ensemble complète
- Arborescence visuelle
- Où s'affiche chaque type de photo
- Conventions de nommage
- Quick start par type
- Configuration dans le code

### 📄 README par dossier

Chaque dossier contient un **README.md détaillé** :

| Dossier | Guide | Contenu |
|---------|-------|---------|
| `/assets/brand/` | [README.md](public/assets/brand/README.md) | Logo ASSEP, favicon, identité |
| `/photos/home/hero/` | [README.md](public/photos/home/hero/README.md) | Carrousel page d'accueil |
| `/photos/home/highlights/` | [README.md](public/photos/home/highlights/README.md) | Vignettes "Vie de l'asso" (futur) |
| `/photos/events/default/` | [README.md](public/photos/events/default/README.md) | Photo par défaut événement |
| `/photos/events/` | [README.md](public/photos/events/README.md) | Photos par événement (cover + galerie) |

### 📚 Guides complémentaires

- [AJOUT-PHOTOS-QUICK.md](AJOUT-PHOTOS-QUICK.md) - Quick start mis à jour
- [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md) - Guide technique complet
- [AMELIORATIONS-ACCUEIL-2026-02-02.md](AMELIORATIONS-ACCUEIL-2026-02-02.md) - Récapitulatif améliorations

---

## 🎯 Principe : "Je sais où ça va"

### 🎞️ Carrousel page d'accueil

**Je veux ajouter une photo dans le carrousel hero** :
1. ➡️ Je vais dans `/public/photos/home/hero/`
2. ➡️ Je lis le [README.md](public/photos/home/hero/README.md)
3. ➡️ Je copie `01-ma-photo.jpg` dans ce dossier
4. ➡️ Je déclare le chemin dans `/lib/constants.js` → `HERO_IMAGES`
5. ✅ La photo défile dans le carrousel automatiquement

---

### 📸 Photo de couverture d'un événement

**Je veux mettre une cover sur la kermesse 2025** :
1. ➡️ Je crée `/public/photos/events/kermesse-2025/`
2. ➡️ Je lis le [README.md](public/photos/events/README.md)
3. ➡️ Je copie `cover.jpg` dans ce dossier
4. ➡️ J'upload dans Supabase OU je mets à jour la BDD
5. ✅ La photo apparaît sur l'EventCard

---

### 🎨 Remplacer l'emoji du logo par une vraie image

**Je veux mettre le vrai logo ASSEP** :
1. ➡️ Je vais dans `/public/assets/brand/`
2. ➡️ Je lis le [README.md](public/assets/brand/README.md)
3. ➡️ Je copie `logo-assep.png` dans ce dossier
4. ➡️ Je remplace l'emoji dans Navbar.js et Hero.js (instructions dans le README)
5. ✅ Le logo s'affiche partout

---

## 🏷️ Conventions de nommage

### ✅ Règles uniformes

| Type | Exemple | Raison |
|------|---------|--------|
| Carrousel hero | `01-fete-ecole.jpg` | Ordre de défilement contrôlé |
| Galerie événement | `01-stand.jpg`, `02-buvette.jpg` | Ordre logique de la galerie |
| Cover événement | `cover.jpg` | Standard simple |
| Photo par défaut | `event-default.jpg` | Explicite |

**Préfixe numérique = contrôle de l'ordre alphabétique**

---

## 📏 Formats et poids

| Type | Dimensions | Poids max | Format |
|------|------------|-----------|--------|
| Carrousel hero | 1920x1080px | 500 Ko | JPG, WebP |
| Cover événement | 1200x600px | 300 Ko | JPG |
| Galerie événement | 1200x800px | 400 Ko | JPG, WebP |
| Vignettes accueil | 800x600px | 200 Ko | JPG |
| Logo ASSEP | 200x200px+ | 50 Ko | PNG, SVG |
| Favicon | 16-48px | 10 Ko | ICO, SVG |

**Outil recommandé** : https://tinypng.com

---

## 🔧 Code adapté

### Chemins mis à jour

**Avant** :
```javascript
heroImage: "/hero.png"
logoPath: "/jetc-logo.png"
HERO_IMAGES = ['/hero.png', '/photos/xxx.jpg']
```

**Après** :
```javascript
heroImage: "/photos/home/hero/hero.png"
logoPath: "/assets/brand/jetc-logo.png"
HERO_IMAGES = [
  '/photos/home/hero/hero.png',
  '/photos/home/hero/01-xxx.jpg'
]
```

**Fichier** : [lib/constants.js](lib/constants.js)

---

## ✅ Actions recommandées (à faire)

### Priorité 1 : Carrousel page d'accueil

- [ ] Ajouter 3-5 photos dans `/public/photos/home/hero/`
- [ ] Les renommer : `01-xxx.jpg`, `02-xxx.jpg`...
- [ ] Les déclarer dans `/lib/constants.js` → `HERO_IMAGES`
- [ ] Tester le défilement sur le site

**Guide** : [/public/photos/home/hero/README.md](public/photos/home/hero/README.md)

---

### Priorité 2 : Logo ASSEP

- [ ] Créer ou récupérer le logo ASSEP (PNG ou SVG)
- [ ] L'ajouter dans `/public/assets/brand/logo-assep.png`
- [ ] Remplacer l'emoji dans Navbar.js et Hero.js

**Guide** : [/public/assets/brand/README.md](public/assets/brand/README.md)

---

### Priorité 3 : Photo par défaut événement

- [ ] Créer une image générique "Événement ASSEP"
- [ ] L'ajouter dans `/public/photos/events/default/event-default.jpg`
- [ ] Adapter EventCard.js pour utiliser cette image

**Guide** : [/public/photos/events/default/README.md](public/photos/events/default/README.md)

---

### Optionnel : Photos par événement

- [ ] Créer des dossiers par événement (`/photos/events/<slug>/`)
- [ ] Ajouter `cover.jpg` dans chaque dossier
- [ ] Uploader dans Supabase Storage ou mettre à jour la BDD

**Guide** : [/public/photos/events/README.md](public/photos/events/README.md)

---

## 🎉 Résultat

**Avant** :  
❌ Photos éparpillées dans `/public/`  
❌ Pas de convention de nommage  
❌ Difficile de savoir où placer quoi

**Après** :  
✅ Structure claire et logique  
✅ Un README explicite dans chaque dossier  
✅ Convention de nommage uniforme  
✅ Facile de savoir où placer chaque photo  
✅ Documentation complète et accessible

---

## 🗺️ Navigation rapide

### Pour ajouter :

| Quoi | Où aller |
|------|----------|
| Photo carrousel | [/public/photos/home/hero/](public/photos/home/hero/) |
| Logo ASSEP | [/public/assets/brand/](public/assets/brand/) |
| Cover événement | [/public/photos/events/<slug>/](public/photos/events/) |
| Photo par défaut | [/public/photos/events/default/](public/photos/events/default/) |

### Pour comprendre :

| Besoin | Document |
|--------|----------|
| Vue d'ensemble | [STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md) |
| Quick start carrousel | [AJOUT-PHOTOS-QUICK.md](AJOUT-PHOTOS-QUICK.md) |
| Guide technique | [docs/GUIDE-PHOTOS-ACCUEIL.md](docs/GUIDE-PHOTOS-ACCUEIL.md) |

---

## 💡 Astuce

**Chaque README.md contient** :
- 📍 Où ça s'affiche exactement
- 📸 Format et dimensions
- 🏷️ Convention de nommage
- 🔧 Utilisation dans le code
- ✅ Checklist de validation

➡️ **Vous n'avez plus à deviner, tout est documenté !**

---

## 🆘 Support

Questions ?
1. Lire le README.md du dossier concerné
2. Consulter [STRUCTURE-IMAGES.md](STRUCTURE-IMAGES.md)
3. Vérifier la console navigateur (F12)
4. Restart du serveur (`npm run dev`)
