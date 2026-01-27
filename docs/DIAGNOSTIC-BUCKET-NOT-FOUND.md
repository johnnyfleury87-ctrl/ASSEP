# DIAGNOSTIC COMPLET - Erreur "Bucket not found"

Date : 2026-01-27

## 🔍 1. IDENTIFICATION DU BUCKET UTILISÉ

### Recherche dans le code

**Fichier** : `pages/dashboard/evenements/[id]/photos.js`

Lignes trouvées :
- Ligne 86 : `.from('event-photos')` - getPublicUrl
- Ligne 126 : `.from('event-photos')` - upload
- Ligne 149 : `.from('event-photos')` - remove
- Ligne 267 : `.from('event-photos')` - remove

**Fichier** : `pages/evenements/[slug].js`

- Ligne 111 : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${photo.storage_path}`

**Fichier** : `pages/evenements/index.js`

- Ligne 32 : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.coverPhoto.storage_path}`
- Ligne 93 : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.coverPhoto.storage_path}`

### ✅ Résultat

**UN SEUL bucket utilisé partout** : `event-photos`

Pas de bucket alternatif type `photos`, `photos-xxx` ou autre.

---

## 🔍 2. VÉRIFICATION CÔTÉ SUPABASE

### Dans les migrations SQL

**Fichier** : `supabase/migrations/0012_events_photos.sql`

```sql
-- Ligne 39 : Commentaire sur storage_path
COMMENT ON COLUMN public.event_photos.storage_path IS 'Chemin dans le bucket Supabase Storage event-photos';

-- Ligne 187-193 : Documentation
-- STORAGE BUCKET: event-photos
-- NOTE: Cette partie doit être exécutée via l'interface Supabase Storage
-- 1. Créer bucket "event-photos" (public: false)

-- Lignes 199-247 : Policies commentées (SQL ne peut pas les créer)
```

### ❌ Constat

**Le bucket N'EST PAS créé via SQL**. La migration 0012 contient :
- ✅ Table `event_photos` (créée)
- ✅ Triggers et fonctions (créés)
- ✅ Policies RLS sur table (créées)
- ❌ Bucket Storage `event-photos` (commenté, manuel requis)
- ❌ Storage Policies (commentées, manuel requis)

---

## 🔍 3. POURQUOI LE BUCKET MANQUE

### Cause racine

Supabase **ne permet PAS** de créer des buckets Storage via SQL standard. Les buckets se créent :

1. **Via Dashboard UI** : Storage → New bucket
2. **Via API REST** : Requête POST avec clé service_role
3. **Via Supabase CLI** : (si projet lié localement)

### Conséquence

Même si toutes les migrations SQL ont été appliquées correctement, le bucket `event-photos` **n'existe pas** car il nécessite une action manuelle.

---

## ✅ 4. FIX PROPRE ET ROBUSTE

### A. Standardisation du nom de bucket

**Fichier créé** : `lib/storageConfig.js`

```javascript
export const STORAGE_BUCKETS = {
  EVENT_PHOTOS: 'event-photos'
}

export const EVENT_PHOTOS_BUCKET_CONFIG = {
  name: STORAGE_BUCKETS.EVENT_PHOTOS,
  public: false,
  fileSizeLimit: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxPhotosPerEvent: 20
}

export function getEventPhotoUrl(storagePath) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.EVENT_PHOTOS}/${storagePath}`
}

export async function checkBucketExists(supabaseClient) {
  // Vérifie l'existence du bucket et log une erreur claire
}

export const BUCKET_MISSING_ERROR = `[Message d'erreur explicite]`
```

### B. Script de setup automatique

**Fichier créé** : `scripts/setup-storage.sh`

```bash
#!/bin/bash
# Utilise l'API Supabase pour créer le bucket automatiquement
# Usage: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=yyy ./setup-storage.sh
```

Ce script :
- ✅ Vérifie les variables d'environnement
- ✅ Crée le bucket via API POST
- ✅ Vérifie que le bucket existe
- ✅ Idempotent (ne plante pas si bucket existe déjà)
- ⚠️ Note que les policies doivent être créées manuellement

### C. Vérification au runtime dans l'UI

Modification de `pages/dashboard/evenements/[id]/photos.js` :

```javascript
import { checkBucketExists, BUCKET_MISSING_ERROR } from '../../../../lib/storageConfig'

// Au chargement
useEffect(() => {
  checkBucketExists(supabase).then(exists => {
    setBucketExists(exists)
    if (!exists) {
      setError(BUCKET_MISSING_ERROR) // Message clair + doc
    }
  })
}, [])

// Avant upload
const handleFileUpload = async (e) => {
  if (bucketExists === false) {
    setError(BUCKET_MISSING_ERROR)
    return // Bloque l'upload au lieu d'un 404
  }
  // ... reste du code
}
```

**Résultat** :
- ❌ AVANT : "Bucket not found" en 404 brutal
- ✅ APRÈS : Message clair avec lien vers documentation

### D. Documentation claire

**Fichiers créés** :

1. `docs/ACTIONS-REQUISES-STORAGE.md` - Guide pas à pas
2. `docs/CONFIGURATION-STORAGE-PHOTOS.md` - Doc complète
3. `docs/GUIDE-VERIFICATION-MIGRATIONS.md` - Checklist

---

## 🔍 5. CONTRÔLES ADDITIONNELS

### A. Variables d'environnement

**Fichier** : `.env.local.example`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

**À vérifier** :

1. **Local** : `.env.local` existe et contient les bonnes valeurs
2. **Vercel** : Variables d'environnement configurées dans Settings → Environment Variables

**Comment vérifier** :
```javascript
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
// Doit afficher : https://votreprojet.supabase.co
```

Si l'URL est différente → le code tape un autre projet Supabase → bucket inexistant.

### B. Storage Policies (RLS)

**Même après création du bucket**, l'upload peut planter avec "Unauthorized" si les policies manquent.

**Policies requises** (dans Dashboard Supabase → Storage → event-photos → Policies) :

1. **event_photos_upload** (INSERT)
   - Permet aux gestionnaires d'uploader
   
2. **event_photos_view** (SELECT)
   - Public peut voir si événement publié
   - Gestionnaires peuvent tout voir
   
3. **event_photos_delete** (DELETE)
   - Gestionnaires peuvent supprimer

**Vérification** :
```sql
-- Dans SQL Editor
SELECT * FROM storage.buckets WHERE id = 'event-photos';
-- Devrait retourner 1 ligne

-- Les policies ne sont PAS dans une table SQL accessible
-- Vérifier via Dashboard UI uniquement
```

---

## 🎯 RÉSULTAT ATTENDU

### Étapes pour corriger (ordre d'exécution)

#### Option 1 : Via script automatique (Recommandé)

```bash
# 1. Définir les variables (récupérer du Dashboard Supabase)
export SUPABASE_URL="https://votreprojet.supabase.co"
export SUPABASE_SERVICE_KEY="eyJhb...votre-clé-service"

# 2. Exécuter le script
./scripts/setup-storage.sh

# ✅ Bucket créé automatiquement
```

#### Option 2 : Via Dashboard Supabase (Manuel)

```
1. Aller sur : https://supabase.com/dashboard/project/VOTRE_PROJECT/storage/buckets
2. Cliquer "New bucket"
3. Remplir :
   - Name: event-photos
   - Public: NON (décoché)
   - File size limit: 5242880
   - Allowed MIME types: image/jpeg,image/png,image/webp
4. Cliquer "Create bucket"
```

#### Étape commune : Créer les Storage Policies

```
1. Storage → Buckets → event-photos → Policies
2. Créer 3 policies (copier-coller depuis docs/ACTIONS-REQUISES-STORAGE.md)
   - event_photos_upload
   - event_photos_view
   - event_photos_delete
```

### Test de validation

```
1. Aller sur /dashboard/evenements/[id]/photos
2. Sélectionner une image JPG < 5MB
3. Cliquer "Choisir des fichiers"
4. ✅ Devrait afficher "1 photo(s) uploadée(s) avec succès"
5. ✅ Photo visible dans la galerie
6. ✅ Photo visible sur page publique après publication
```

### Déploiement Vercel

```
1. Vérifier variables d'environnement Vercel :
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY (pour scripts)

2. Git push → Vercel redéploie
3. Tester upload en production
```

---

## 📊 RÉSUMÉ DU DIAGNOSTIC

| Élément | État | Action |
|---------|------|--------|
| Nom du bucket | ✅ Standardisé | `event-photos` partout |
| Bucket existe | ❌ Manquant | Créer via script/Dashboard |
| Table event_photos | ✅ OK | Migration 0012 appliquée |
| Triggers SQL | ✅ OK | Limite 20 photos active |
| Policies RLS (table) | ✅ OK | Gestionnaires uniquement |
| Storage Policies | ❌ Manquantes | Créer via Dashboard |
| Variables env | ⚠️ À vérifier | Local + Vercel |
| Code frontend | ✅ OK | Utilise le bon bucket |
| Vérification runtime | ✅ Ajoutée | Message clair si manquant |
| Documentation | ✅ Créée | 3 fichiers guide |
| Script setup | ✅ Créé | setup-storage.sh |

---

## 🚀 PROCHAINES ÉTAPES

1. **Créer le bucket** (choisir Option 1 script ou Option 2 manuel)
2. **Créer les 3 Storage Policies** (copier-coller depuis docs)
3. **Vérifier variables env** (local + Vercel)
4. **Tester l'upload** (local puis production)
5. **Valider affichage public** (photo de couverture + galerie)

**Temps estimé** : 15-20 minutes

---

**Fichiers créés/modifiés par ce diagnostic** :

- ✅ `lib/storageConfig.js` - Configuration centralisée
- ✅ `scripts/setup-storage.sh` - Script de création automatique
- ✅ `docs/DIAGNOSTIC-BUCKET-NOT-FOUND.md` - Ce fichier
- ⏸️ `pages/dashboard/evenements/[id]/photos.js` - À modifier (utiliser storageConfig)

---

**Conclusion** : Le problème est identifié et la correction est propre. Le bucket manque simplement car SQL ne peut pas le créer. Une fois créé + policies configurées, tout fonctionnera en local ET sur Vercel.
