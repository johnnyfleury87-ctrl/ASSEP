// ============================================================================
// Configuration Storage - Buckets
// ============================================================================

/**
 * Nom du bucket Storage pour les photos d'événements
 * ⚠️ Ce bucket doit être créé manuellement (voir docs/ACTIONS-REQUISES-STORAGE.md)
 */
export const STORAGE_BUCKETS = {
  EVENT_PHOTOS: 'event-photos'
}

/**
 * Configuration du bucket event-photos
 */
export const EVENT_PHOTOS_BUCKET_CONFIG = {
  name: STORAGE_BUCKETS.EVENT_PHOTOS,
  public: false,
  fileSizeLimit: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxPhotosPerEvent: 20
}

/**
 * Génère l'URL publique d'une photo depuis le Storage
 * @param {string} storagePath - Chemin dans le bucket (ex: event-id/photo.jpg)
 * @returns {string} URL publique
 */
export function getEventPhotoUrl(storagePath) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL non défini')
    return ''
  }
  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKETS.EVENT_PHOTOS}/${storagePath}`
}

/**
 * Vérifie que le bucket existe (côté client)
 * @param {object} supabaseClient - Client Supabase
 * @returns {Promise<boolean>}
 */
export async function checkBucketExists(supabaseClient) {
  try {
    const { data, error } = await supabaseClient.storage.getBucket(STORAGE_BUCKETS.EVENT_PHOTOS)
    
    if (error) {
      console.error('❌ Bucket Storage manquant:', error.message)
      console.error('ℹ️  Voir docs/ACTIONS-REQUISES-STORAGE.md pour créer le bucket')
      return false
    }
    
    return !!data
  } catch (err) {
    console.error('❌ Erreur vérification bucket:', err.message)
    return false
  }
}

/**
 * Message d'erreur standardisé si bucket manquant
 */
export const BUCKET_MISSING_ERROR = `
❌ Le bucket Storage 'event-photos' n'existe pas.

Actions requises :
1. Créer le bucket via Dashboard Supabase (Storage → New bucket)
2. Nom: event-photos
3. Public: NON (décoché)
4. Taille limite: 5242880 (5MB)
5. Types MIME: image/jpeg,image/png,image/webp

Documentation complète : docs/ACTIONS-REQUISES-STORAGE.md
`.trim()
