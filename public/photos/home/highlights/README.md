# ✨ Dossier : Vignettes accueil / Highlights

## 📍 Où ça s'affiche ?

**Section "Vie de l'asso" ou "Derniers moments"** (en bas de la page d'accueil)  
Galerie de 3-6 mini photos en grille pour montrer la vie de l'association.

**Composant** : Pas encore implémenté  
**Statut** : 🚧 Fonctionnalité optionnelle (future amélioration)

---

## 📸 Photos attendues

**Quantité** : 3 à 6 photos  
**Format** : JPG, PNG, WebP  
**Dimensions** : 800x600px (4:3) ou 800x800px (carré)  
**Poids max** : 200 Ko par photo  
**Orientation** : Carré ou paysage

---

## 🏷️ Convention de nommage

```
01-titre-court.jpg
02-titre-court.jpg
03-titre-court.jpg
```

**Le titre** sera affiché sous la vignette (alt text).

**Exemples** :
- ✅ `01-kermesse-juin-2025.jpg`
- ✅ `02-spectacle-noel.jpg`
- ✅ `03-course-parrainnee.jpg`

---

## 🎨 Sujets recommandés

- Moments marquants de l'année
- Derniers événements réussis
- Photos "coup de cœur"
- Ambiances / émotions

---

## 🚧 Implémentation future

Cette fonctionnalité sera ajoutée ultérieurement avec :
- Affichage en grille 3 colonnes (desktop)
- Modal/lightbox au clic
- Légende sous chaque photo
- Lien vers une galerie complète

**Pour l'instant** : Ce dossier sert de placeholder.

---

## ✅ Checklist

- [ ] Fonctionnalité à implémenter
- [ ] Composant `HomeHighlights.js` à créer
- [ ] Intégration dans `/pages/index.js`

---

## 💡 Si vous voulez implémenter maintenant

Créez un composant simple dans `/components/HomeHighlights.js` :

```javascript
export default function HomeHighlights() {
  const highlights = [
    { src: '/photos/home/highlights/01-xxx.jpg', alt: 'Kermesse juin 2025' },
    { src: '/photos/home/highlights/02-xxx.jpg', alt: 'Spectacle Noël' },
    { src: '/photos/home/highlights/03-xxx.jpg', alt: 'Course parrainée' }
  ]

  return (
    <section style={{ padding: '60px 20px', backgroundColor: '#f9fafb' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>
        ✨ Moments de l'école
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {highlights.map((photo, i) => (
          <div key={i} style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <img 
              src={photo.src} 
              alt={photo.alt}
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px' }}>
              {photo.alt}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
```

Puis ajoutez dans `/pages/index.js` après la section "Prochains événements".
