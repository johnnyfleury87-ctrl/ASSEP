# 📅 Dossier : Photos par événement

## 📍 Où ça s'affiche ?

**Page détail événement** (`/evenements/[slug]`)  
Chaque événement peut avoir :
- 1 photo de couverture (cover)
- Plusieurs photos de galerie

**Composants** :
- `/components/EventCard.js` (cover uniquement)
- `/pages/evenements/[slug].js` (cover + galerie)

---

## 📂 Structure par événement

Chaque événement a son propre dossier nommé selon son **slug** :

```
/photos/events/
  ├── default/
  │   └── event-default.jpg          (fallback si pas de cover)
  ├── kermesse-2025/
  │   ├── cover.jpg                  (photo de couverture)
  │   ├── 01-stand-jeux.jpg          (galerie)
  │   ├── 02-buvette.jpg             (galerie)
  │   └── 03-spectacle.jpg           (galerie)
  ├── course-parrainee-2025/
  │   ├── cover.jpg
  │   ├── 01-depart.jpg
  │   └── 02-arrivee.jpg
  └── spectacle-noel-2024/
      ├── cover.jpg
      └── 01-scene.jpg
```

---

## 🏷️ Convention de nommage

### Photo de couverture

**Fichier** : `cover.jpg` ou `cover.png`  
**Dimensions** : 1200x600px (2:1) ou 800x600px (4:3)  
**Poids max** : 300 Ko  
**Format** : JPG (recommandé), PNG

**Où** : EventCard + haut de la page événement

---

### Photos de galerie

**Fichiers** : `01-xxx.jpg`, `02-xxx.jpg`, `03-xxx.jpg`...  
**Dimensions** : 1200x800px (3:2) ou 1200x1200px (carré)  
**Poids max** : 400 Ko par photo  
**Format** : JPG, WebP

**Ordre** : Alphabétique (préfixe numérique obligatoire)

**Exemples** :
- ✅ `01-stand-jeux.jpg`
- ✅ `02-buvette-convivialite.jpg`
- ✅ `03-spectacle-scene.jpg`

**À éviter** :
- ❌ `photo1.jpg` (ordre alphabétique incorrect)
- ❌ `IMG_5678.jpg` (pas descriptif)

---

## 🚀 Workflow : Ajouter des photos à un événement

### Étape 1 : Créer le dossier

Créez un dossier avec le **slug** de l'événement :

```bash
mkdir -p /workspaces/ASSEP/public/photos/events/nom-evenement-2025
```

**Le slug** = URL de l'événement (ex : `/evenements/kermesse-2025`)  
Trouvez-le dans Supabase → table `events` → colonne `slug`

---

### Étape 2 : Ajouter la cover

```bash
cp ma-photo-cover.jpg /workspaces/ASSEP/public/photos/events/kermesse-2025/cover.jpg
```

**Optimisez avant** : https://tinypng.com (< 300 Ko)

---

### Étape 3 : Ajouter les photos de galerie

```bash
cp photo-stand.jpg /workspaces/ASSEP/public/photos/events/kermesse-2025/01-stand-jeux.jpg
cp photo-buvette.jpg /workspaces/ASSEP/public/photos/events/kermesse-2025/02-buvette.jpg
...
```

**Optimisez avant** : < 400 Ko chacune

---

### Étape 4 : Uploader dans Supabase Storage

**Si vous utilisez Supabase Storage** (actuellement configuré) :

1. Aller dans Supabase → Storage → bucket `event-photos`
2. Upload des fichiers (cover.jpg + 01-xxx.jpg, 02-xxx.jpg...)
3. Dans la table `events`, colonne `cover_photo`, mettre : `cover.jpg`

**OU mettre le chemin local dans la BDD** :
```sql
UPDATE events 
SET cover_photo = 'kermesse-2025/cover.jpg' 
WHERE slug = 'kermesse-2025';
```

---

## 📐 Dimensions recommandées

### Photo de couverture (cover)

**Format** : 2:1 (large) ou 4:3 (standard)  
**Dimensions** :
- Desktop : 1200x600px (2:1)
- Responsive : min 800x400px

**Cadrage** : Zone centrale importante (visages, action)

---

### Photos de galerie

**Format** : 3:2 (photo classique) ou carré  
**Dimensions** :
- Standard : 1200x800px (3:2)
- Carré : 1200x1200px (Instagram style)

**Variété** : Mixer plans larges + plans serrés

---

## 🎨 Conseils photo

### ✅ Bonnes pratiques

**Cover** :
- Image forte, engageante (donne envie de cliquer)
- Bonne luminosité et contraste
- Sujet clair et identifiable

**Galerie** :
- Raconter une histoire (début → déroulé → fin)
- Varier les angles et plans
- Montrer l'ambiance, les émotions, les participants

### ⚠️ RGPD

- Pas de visage d'enfant identifiable sans autorisation
- Privilégier : plans larges, dos, activités sans gros plans visages
- Flouter si nécessaire (avant upload)

---

## 🔧 Utilisation dans le code

### Photo de couverture

**Dans EventCard** (`/components/EventCard.js`) :

```javascript
const coverImageUrl = event.cover_photo
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.cover_photo}`
  : null
```

**Si vous utilisez des fichiers locaux** :
```javascript
const coverImageUrl = event.cover_photo
  ? `/photos/events/${event.slug}/cover.jpg`
  : '/photos/events/default/event-default.jpg'
```

---

### Galerie photos

**À implémenter** : Composant `EventGallery.js`

```javascript
// Exemple : liste des photos d'un événement
const galleryPhotos = [
  '/photos/events/kermesse-2025/01-stand-jeux.jpg',
  '/photos/events/kermesse-2025/02-buvette.jpg',
  '/photos/events/kermesse-2025/03-spectacle.jpg'
]
```

Ou dynamique via Supabase Storage (liste les fichiers du bucket).

---

## ✅ Checklist par événement

- [ ] Dossier créé avec le bon slug
- [ ] Photo cover présente (`cover.jpg`)
- [ ] Cover optimisée (< 300 Ko, 1200x600px)
- [ ] Photos galerie nommées avec préfixes (01-, 02-...)
- [ ] Photos galerie optimisées (< 400 Ko chacune)
- [ ] Pas de photo RGPD sensible
- [ ] Upload Supabase Storage (si utilisé)
- [ ] BDD `events.cover_photo` mis à jour

---

## 🐛 Problèmes courants

**La cover ne s'affiche pas** :
- Vérifier le slug dans la BDD (table `events`)
- Vérifier le chemin Supabase Storage ou local
- Vérifier que `cover.jpg` existe dans le bon dossier
- Restart du serveur Next.js

**Galerie vide** :
- Fonctionnalité à implémenter (pas encore dans le code)
- Vérifier les fichiers 01-, 02-... dans le dossier

---

## 🔗 Documentation

Voir :
- [/docs/CONFIGURATION-STORAGE-PHOTOS.md](/docs/CONFIGURATION-STORAGE-PHOTOS.md)
- Supabase Storage : https://supabase.com/docs/guides/storage
