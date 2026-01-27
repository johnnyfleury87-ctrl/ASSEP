// pages/dashboard/evenements/[id]/photos.js
// Gestion des photos d'un événement

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  STORAGE_BUCKETS, 
  EVENT_PHOTOS_BUCKET_CONFIG, 
  getEventPhotoUrl,
  checkBucketExists,
  BUCKET_MISSING_ERROR 
} from '../../../../lib/storageConfig'

export default function EventPhotos() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [event, setEvent] = useState(null)
  const [photos, setPhotos] = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Charger profil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Charger événement
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (eventError || !eventData) {
        setError('Événement non trouvé')
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Charger photos
      await loadPhotos()

      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const loadPhotos = async () => {
    const { data: photosData, error: photosError } = await supabase
      .from('event_photos')
      .select('*')
      .eq('event_id', id)
      .order('display_order', { ascending: true })

    if (photosError) {
      console.error('Error loading photos:', photosError)
    } else {
      setPhotos(photosData || [])
    }
  }

  const getPhotoUrl = (storagePath) => {
    const { data } = supabase.storage
      .from('event-photos')
      .getPublicUrl(storagePath)
    return data.publicUrl
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length === 0) return

    // Vérifier limite 20 photos
    if (photos.length + files.length > 20) {
      setError(`❌ Limite atteinte : maximum 20 photos par événement (actuellement ${photos.length})`)
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      for (const file of files) {
        // Vérifier type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          setError(`❌ Format invalide pour ${file.name}. Formats acceptés : JPG, PNG, WEBP`)
          continue
        }

        // Vérifier taille (5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`❌ Fichier trop volumineux : ${file.name} (max 5MB)`)
          continue
        }

        // Générer nom unique
        const fileExt = file.name.split('.').pop()
        const fileName = `${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Upload vers Storage
        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(fileName, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          setError(`❌ Erreur upload ${file.name}: ${uploadError.message}`)
          continue
        }

        // Créer entrée en base
        const { error: insertError } = await supabase
          .from('event_photos')
          .insert({
            event_id: id,
            storage_path: fileName,
            is_cover: photos.length === 0, // Première photo = cover par défaut
            display_order: photos.length,
            uploaded_by: profile.id
          })

        if (insertError) {
          console.error('Insert error:', insertError)
          // Nettoyer le fichier uploadé
          await supabase.storage.from('event-photos').remove([fileName])
          
          if (insertError.message.includes('Limite atteinte')) {
            setError('❌ Limite de 20 photos atteinte')
          } else {
            setError(`❌ Erreur enregistrement ${file.name}: ${insertError.message}`)
          }
          continue
        }
      }

      setSuccess(`✅ ${files.length} photo(s) uploadée(s) avec succès`)
      await loadPhotos()
      e.target.value = '' // Reset input
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSetCover = async (photoId) => {
    const canModify = profile && (
      profile.is_jetc_admin || 
      ['president', 'vice_president'].includes(profile.role) ||
      event.status !== 'published'
    )

    if (!canModify) {
      setError('❌ Seul le président ou admin peut changer la photo de couverture d\'un événement publié')
      return
    }

    setError(null)
    setSuccess(null)

    try {
      // Retirer cover de toutes les photos
      const { error: removeError } = await supabase
        .from('event_photos')
        .update({ is_cover: false })
        .eq('event_id', id)

      if (removeError) {
        setError(removeError.message)
        return
      }

      // Définir nouvelle cover
      const { error: setCoverError } = await supabase
        .from('event_photos')
        .update({ is_cover: true })
        .eq('id', photoId)

      if (setCoverError) {
        setError(setCoverError.message)
        return
      }

      setSuccess('✅ Photo de couverture mise à jour')
      await loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdateCaption = async (photoId, newCaption) => {
    try {
      const { error: updateError } = await supabase
        .from('event_photos')
        .update({ caption: newCaption || null })
        .eq('id', photoId)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('✅ Légende mise à jour')
      await loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (photo) => {
    const canDelete = profile && (
      profile.is_jetc_admin || 
      ['president', 'vice_president'].includes(profile.role) ||
      (event.status !== 'published' || !photo.is_cover)
    )

    if (!canDelete) {
      setError('❌ Seul le président ou admin peut supprimer la photo de couverture d\'un événement publié')
      return
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette photo${photo.is_cover ? ' de couverture' : ''} ?`)) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      // Supprimer de la base
      const { error: deleteError } = await supabase
        .from('event_photos')
        .delete()
        .eq('id', photo.id)

      if (deleteError) {
        setError(deleteError.message)
        return
      }

      // Supprimer du Storage
      const { error: storageError } = await supabase.storage
        .from('event-photos')
        .remove([photo.storage_path])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }

      setSuccess('✅ Photo supprimée')
      await loadPhotos()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        Chargement...
      </div>
    )
  }

  if (!event) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <p style={{ color: 'red' }}>{error || 'Événement non trouvé'}</p>
        <Link href="/dashboard/evenements" style={{ color: '#4CAF50' }}>
          ← Retour aux événements
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href={`/dashboard/evenements/${id}/edit`} style={{ color: '#4CAF50' }}>
          ← Retour à l'événement
        </Link>
        <h1 style={{ marginTop: '20px' }}>📸 Photos de l'événement</h1>
        <p style={{ color: '#666' }}>{event.name}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
          <span style={{
            padding: '6px 12px',
            backgroundColor: event.status === 'published' ? '#4CAF50' : '#999',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {event.status === 'draft' ? '📝 Brouillon' : 
             event.status === 'published' ? '✅ Publié' : event.status}
          </span>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {photos.length} / 20 photos
          </span>
        </div>
      </header>

      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}

      {event.status === 'published' && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d1ecf1',
          color: '#0c5460',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #bee5eb'
        }}>
          ℹ️ <strong>Événement publié :</strong> Vous pouvez ajouter des photos. 
          Seul le président/admin peut modifier ou supprimer la photo de couverture.
        </div>
      )}

      <div style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        marginBottom: '30px'
      }}>
        <h3 style={{ marginTop: 0 }}>📤 Uploader des photos</h3>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          Formats acceptés : JPG, PNG, WEBP • Taille max : 5MB par fichier • Maximum 20 photos total
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileUpload}
          disabled={uploading || photos.length >= 20}
          style={{
            padding: '10px',
            border: '2px dashed #ccc',
            borderRadius: '4px',
            width: '100%',
            cursor: uploading || photos.length >= 20 ? 'not-allowed' : 'pointer'
          }}
        />
        {uploading && (
          <p style={{ marginTop: '10px', color: '#666' }}>⏳ Upload en cours...</p>
        )}
      </div>

      {photos.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          border: '2px dashed #ddd',
          borderRadius: '8px',
          color: '#999'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 10px 0' }}>📸</p>
          <p style={{ fontSize: '18px', margin: 0 }}>Aucune photo</p>
          <p style={{ fontSize: '14px' }}>Uploadez vos premières photos ci-dessus</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {photos.map(photo => (
            <div key={photo.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white',
              position: 'relative'
            }}>
              {photo.is_cover && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  padding: '6px 12px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  zIndex: 1
                }}>
                  ⭐ Photo de couverture
                </div>
              )}
              
              <img
                src={getPhotoUrl(photo.storage_path)}
                alt={photo.caption || 'Photo événement'}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />
              
              <div style={{ padding: '15px' }}>
                <input
                  type="text"
                  placeholder="Ajouter une légende..."
                  defaultValue={photo.caption || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (photo.caption || '')) {
                      handleUpdateCaption(photo.id, e.target.value)
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    fontSize: '14px'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {!photo.is_cover && (
                    <button
                      onClick={() => handleSetCover(photo.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      ⭐ Définir comme couverture
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDelete(photo)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Supprimer
                  </button>
                </div>

                <p style={{ 
                  fontSize: '11px', 
                  color: '#999', 
                  marginTop: '10px',
                  marginBottom: 0 
                }}>
                  Uploadé le {new Date(photo.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
