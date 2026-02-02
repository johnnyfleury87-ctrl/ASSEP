// pages/dashboard/evenements/[id]/edit.js
// Édition d'un événement existant

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import safeLog from '../../../../lib/logger'

export default function EditEvent() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [profile, setProfile] = useState(null)
  const [event, setEvent] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    event_date: '',
    status: 'draft',
    buvette_active: false,
    signups_enabled: false,
    volunteer_target: 0
  })

  useEffect(() => {
    if (id) {
      loadEventAndProfile()
    }
  }, [id])

  const loadEventAndProfile = async () => {
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

      if (!profileData) {
        router.push('/dashboard')
        return
      }

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

      // Formater la date pour datetime-local
      const eventDate = new Date(eventData.event_date)
      const formattedDate = eventDate.toISOString().slice(0, 16)

      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        location: eventData.location || '',
        event_date: formattedDate,
        status: eventData.status || 'draft',
        buvette_active: eventData.buvette_active || false,
        signups_enabled: eventData.signups_enabled || false,
        volunteer_target: eventData.volunteer_target || 0
      })

      setLoading(false)
    } catch (err) {
      safeLog.error('Error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const canEdit = () => {
    if (!profile || !event) return false
    
    // JETC admin, président/vice, secrétaire/vice peuvent tout éditer
    if (profile.is_jetc_admin || ['president', 'vice_president', 'secretaire', 'vice_secretaire'].includes(profile.role)) {
      return true
    }
    
    return false
  }

  const canPublish = () => {
    return profile && (profile.is_jetc_admin || ['president', 'vice_president', 'secretaire', 'vice_secretaire'].includes(profile.role))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!canEdit()) {
      setError('Vous n\'avez pas les droits pour modifier cet événement')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          name: formData.name,
          description: formData.description || null,
          location: formData.location,
          event_date: formData.event_date,
          buvette_active: formData.buvette_active,
          signups_enabled: formData.signups_enabled,
          volunteer_target: parseInt(formData.volunteer_target) || 0
        })
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setSuccess('✅ Événement mis à jour avec succès')
      await loadEventAndProfile() // Recharger les données
      setSaving(false)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!canPublish()) {
      setError('Seul le président ou vice-président peut publier un événement')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir publier cet événement ? Il deviendra visible publiquement.')) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          status: 'published',
          approved_by: profile.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setSuccess('✅ Événement publié avec succès !')
      await loadEventAndProfile()
      setSaving(false)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  const handleUnpublish = async () => {
    if (!canPublish()) {
      setError('Seul le président ou vice-président peut dépublier un événement')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir retirer cet événement de la publication ? Il ne sera plus visible publiquement.')) {
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          status: 'draft',
          approved_by: null,
          approved_at: null
        })
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setSuccess('✅ Événement repassé en brouillon')
      await loadEventAndProfile()
      setSaving(false)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        Chargement...
      </div>
    )
  }

  if (!event || !canEdit()) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <p style={{ color: 'red' }}>Vous n'avez pas accès à cette page.</p>
        <Link href="/dashboard/evenements" style={{ color: '#4CAF50' }}>
          ← Retour aux événements
        </Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard/evenements" style={{ color: '#4CAF50' }}>
          ← Retour aux événements
        </Link>
        <h1 style={{ marginTop: '20px' }}>Éditer l'événement</h1>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
          <span style={{
            padding: '6px 12px',
            backgroundColor: event.status === 'published' ? '#4CAF50' : '#999',
            color: 'white',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {event.status === 'draft' ? '📝 Brouillon' : 
             event.status === 'published' ? '✅ Publié' : 
             event.status === 'archived' ? '📦 Archivé' : event.status}
          </span>
          {event.buvette_active && (
            <span style={{ fontSize: '14px', color: '#666' }}>🍺 Buvette activée</span>
          )}
          {event.signups_enabled && (
            <span style={{ fontSize: '14px', color: '#666' }}>📝 Inscriptions activées</span>
          )}
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

      {event.status === 'published' && event.buvette_active && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #ffc107'
        }}>
          ⚠️ <strong>Attention :</strong> La buvette est figée car l'événement est publié. 
          Pour modifier les produits, vous devez repasser l'événement en brouillon.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '30px',
        backgroundColor: '#f9f9f9',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Titre *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Lieu *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Date/heure début *
          </label>
          <input
            type="datetime-local"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.buvette_active}
                onChange={(e) => setFormData({ ...formData, buvette_active: e.target.checked })}
                disabled={event.status === 'published'}
                style={{ marginRight: '10px', width: '20px', height: '20px', cursor: event.status === 'published' ? 'not-allowed' : 'pointer' }}
              />
              <span style={{ fontWeight: 'bold' }}>🍺 Activer la buvette</span>
            </label>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 30px' }}>
              {event.status === 'published' 
                ? '⚠️ Figé (événement publié)' 
                : 'Gérer les produits après enregistrement'}
            </p>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.signups_enabled}
                onChange={(e) => setFormData({ ...formData, signups_enabled: e.target.checked })}
                style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 'bold' }}>📝 Activer les inscriptions publiques</span>
            </label>
            <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 30px' }}>
              Permet au public de s'inscrire aux créneaux bénévoles
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            👥 Nombre de bénévoles recherchés
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={formData.volunteer_target}
            onChange={(e) => setFormData({ ...formData, volunteer_target: e.target.value })}
            style={{ width: '150px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0 0 0' }}>
            Mettre 0 pour désactiver l'inscription bénévole simplifiée. Les visiteurs verront un compteur "X/Y" sur la page de l'événement.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 30px',
            backgroundColor: saving ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Enregistrement...' : '💾 Enregistrer les modifications'}
        </button>
      </form>

      {/* Actions de publication */}
      {canPublish() && (
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3 style={{ marginTop: 0 }}>Actions administrateur</h3>
          
          {event.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: saving ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              ✅ Publier l'événement
            </button>
          )}

          {event.status === 'published' && (
            <button
              onClick={handleUnpublish}
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: saving ? '#ccc' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer',
                marginRight: '10px'
              }}
            >
              📝 Repasser en brouillon
            </button>
          )}

          {event.buvette_active && (
            <Link
              href={`/dashboard/evenements/${id}/produits`}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '10px'
              }}
            >
              🍺 Gérer la buvette
            </Link>
          )}

          <Link
            href={`/dashboard/evenements/${id}/photos`}
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#9C27B0',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📸 Gérer les photos
          </Link>
        </div>
      )}
    </div>
  )
}
