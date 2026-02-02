# Guide : Ajouter des photos à la page d'accueil

## 🎯 Objectif

Le carrousel de photos dans le hero rend la page d'accueil plus vivante et humaine. Ce guide explique comment ajouter vos propres photos.

## 📸 Méthode 1 : Photos locales (simple)

### Étape 1 : Ajouter les photos dans `/public`

1. Placez vos photos dans le dossier `/public/photos/` (créez-le si nécessaire)
2. Noms recommandés :
   - `fete-ecole.jpg`
   - `kermesse.jpg`
   - `enfants-activite.jpg`
   - `spectacle.jpg`
   etc.

### Étape 2 : Optimiser les images

Pour de bonnes performances :
- **Largeur recommandée** : 1920px max
- **Format** : JPG (photos), PNG (illustrations), WebP (idéal)
- **Poids** : < 500 Ko par image
- **Outils** : TinyPNG, Squoosh, ImageOptim

### Étape 3 : Configurer le carrousel

Éditez `/lib/constants.js` :

```javascript
export const HERO_IMAGES = [
  '/hero.png',
  '/photos/fete-ecole.jpg',
  '/photos/kermesse.jpg',
  '/photos/enfants-activite.jpg',
  '/photos/spectacle.jpg'
]
```

✅ **C'est tout !** Le carrousel défilera automatiquement toutes les 5 secondes.

---

## 🗄️ Méthode 2 : Photos depuis Supabase Storage (avancé)

### Option A : Créer un bucket dédié

Si vous voulez gérer les photos via Supabase :

1. **Créer le bucket** :
   - Aller dans Supabase Storage
   - Créer un bucket `homepage-photos` (public)

2. **Uploader les photos** via l'interface Supabase

3. **Modifier le code** dans `/components/Hero.js` :

```javascript
// Remplacer HERO_IMAGES par un fetch dynamique
const [heroImages, setHeroImages] = useState([])

useEffect(() => {
  async function loadImages() {
    const { data, error } = await supabase.storage
      .from('homepage-photos')
      .list()
    
    if (data) {
      const urls = data.map(file => 
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/homepage-photos/${file.name}`
      )
      setHeroImages(urls)
    }
  }
  loadImages()
}, [])
```

### Option B : Table `homepage_photos`

Pour encore plus de contrôle (ordre, légende, actif/inactif) :

**Migration SQL** :

```sql
CREATE TABLE homepage_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE homepage_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos publiques en lecture"
  ON homepage_photos FOR SELECT
  USING (is_active = true);
```

**Dans le code** (`/pages/index.js`) :

```javascript
export async function getServerSideProps() {
  const { data: heroPhotos } = await supabase
    .from('homepage_photos')
    .select('*')
    .eq('is_active', true)
    .order('display_order')

  return {
    props: {
      heroPhotos: heroPhotos || []
    }
  }
}
```

Puis passer `heroPhotos` au composant Hero.

---

## 🎨 Paramètres du carrousel

Dans `/components/Hero.js`, vous pouvez ajuster :

### Vitesse de défilement

```javascript
// Ligne ~18 : change toutes les 5 secondes
}, 5000)

// Pour changer : 3000 = 3s, 7000 = 7s, etc.
```

### Effet de transition

```javascript
// Ligne ~45 : transition actuelle
transition: 'opacity 1s ease-in-out'

// Alternatives :
// - Plus rapide : 'opacity 0.5s ease-in-out'
// - Plus lent : 'opacity 2s ease-in-out'
// - Fondu + zoom : 'opacity 1s ease-in-out, transform 1s ease-in-out'
```

---

## 🖼️ Conseils photos

### ✅ Bonnes pratiques

- **Qualité** : images nettes et bien éclairées
- **Diversité** : événements, activités, moments de vie
- **Humanité** : privilégier les photos avec des enfants, parents, bénévoles
- **Émotions** : joie, partage, convivialité
- **Couleurs** : vives et chaleureuses

### ⚠️ À éviter

- Photos floues ou sombres
- Trop de texte sur l'image (illisible en fond)
- Visages d'enfants sans autorisation parentale (RGPD)
- Photos avec mentions d'autres organismes/logos

### 📐 Format idéal

- **Ratio** : 16:9 (paysage) ou 21:9 (ultra-wide)
- **Recadrage** : centrer les éléments importants
- **Texte** : éviter le bas et le centre (zone du titre)

---

## ✅ Checklist de déploiement

Avant de mettre en production :

- [ ] Toutes les images sont optimisées (< 500 Ko)
- [ ] Le carrousel fonctionne en desktop ET mobile
- [ ] Les images sont lisibles avec l'overlay bleu
- [ ] Pas de photo sensible (RGPD)
- [ ] Au moins 3-5 photos pour un défilement fluide
- [ ] Tester sur connexion lente (throttling 3G)

---

## 🐛 Troubleshooting

### Les images ne s'affichent pas

1. Vérifier le chemin dans `HERO_IMAGES`
2. S'assurer que les fichiers sont bien dans `/public`
3. Vérifier la console navigateur (F12)
4. Restart du serveur Next.js

### Le carrousel ne défile pas

1. Vérifier que `HERO_IMAGES.length > 1`
2. Ouvrir la console : erreurs JavaScript ?
3. Tester avec des images par défaut

### Images trop lourdes / site lent

1. Compresser avec TinyPNG ou Squoosh
2. Convertir en WebP
3. Utiliser Next/Image (optionnel, plus complexe)

---

## 🎯 Résultat attendu

Avec ces améliorations, votre page d'accueil :

✅ Affiche un logo ASSEP moderne (🏫)  
✅ Défile des photos vivantes en fond  
✅ Anime les boutons au hover  
✅ Affiche des badges "Bénévoles recherchés"  
✅ Incite à l'action avec "On vous attend !"  

➡️ **Une page d'accueil plus humaine, engageante et professionnelle.**
