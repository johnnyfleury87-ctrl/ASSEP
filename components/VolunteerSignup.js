// components/VolunteerSignup.js
// Composant d'inscription bénévole avec quota

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import Button from './Button'
import safeLog from '../lib/logger'

export default function VolunteerSignup({ eventId }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ current: 0, target: 0, remaining: 0 })
  const [user, setUser] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [eventId])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      // Charger les stats
      const response = await fetch(`/api/events/volunteers?eventId=${eventId}`)
      const data = await response.json()

      if (response.ok) {
        setStats(data)
      }

      // Vérifier si l'utilisateur est déjà inscrit
      if (currentUser) {
        const { data: volunteer } = await supabase
          .from('event_volunteers')
          .select('id, status')
          .eq('event_id', eventId)
          .eq('profile_id', currentUser.id)
          .is('shift_id', null)
          .single()

        setIsRegistered(volunteer && volunteer.status === 'confirmed')
      }

    } catch (err) {
      safeLog.error('Load error:', err)
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    setActionLoading(true)
    setMessage(null)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Vous devez être connecté pour vous inscrire')
        setActionLoading(false)
        return
      }

      const response = await fetch('/api/events/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ eventId })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setIsRegistered(true)
        await loadData()
      } else {
        setError(data.error || 'Erreur lors de l\'inscription')
      }
    } catch (err) {
      safeLog.error('Register error:', err)
      setError('Erreur de connexion')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnregister = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous désinscrire ?')) {
      return
    }

    setActionLoading(true)
    setMessage(null)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expirée')
        setActionLoading(false)
        return
      }

      const response = await fetch('/api/events/volunteers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ eventId })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setIsRegistered(false)
        await loadData()
      } else {
        setError(data.error || 'Erreur lors de la désinscription')
      }
    } catch (err) {
      safeLog.error('Unregister error:', err)
      setError('Erreur de connexion')
    } finally {
      setActionLoading(false)
    }
  }

  // Ne rien afficher si pas d'objectif de bénévoles
  if (!loading && stats.target === 0) {
    return null
  }

  return (
    <section style={{
      margin: '40px 0',
      padding: '30px',
      backgroundColor: '#e8f5e9',
      borderRadius: '12px',
      border: '2px solid #4CAF50'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
        🙋 Bénévoles
      </h2>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          {/* Compteur */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#4CAF50'
            }}>
              {stats.current}/{stats.target}
            </div>
            <div>
              <p style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                {stats.current} bénévole{stats.current > 1 ? 's' : ''} inscrit{stats.current > 1 ? 's' : ''}
              </p>
              <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
                {stats.remaining > 0
                  ? `${stats.remaining} place${stats.remaining > 1 ? 's' : ''} restante${stats.remaining > 1 ? 's' : ''}`
                  : 'Objectif atteint ! 🎉'}
              </p>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div style={{
              padding: '15px',
              backgroundColor: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #c3e6cb'
            }}>
              {message}
            </div>
          )}

          {error && (
            <div style={{
              padding: '15px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          {!user ? (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ marginBottom: '15px' }}>
                Connectez-vous pour vous inscrire comme bénévole
              </p>
              <Button href="/login" variant="primary">
                Se connecter
              </Button>
            </div>
          ) : isRegistered ? (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#4CAF50',
                marginBottom: '15px'
              }}>
                ✅ Vous êtes inscrit comme bénévole !
              </p>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                Merci pour votre aide. Nous vous contacterons prochainement.
              </p>
              <Button
                onClick={handleUnregister}
                disabled={actionLoading}
                variant="secondary"
              >
                {actionLoading ? 'Chargement...' : 'Se désinscrire'}
              </Button>
            </div>
          ) : stats.remaining > 0 ? (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ marginBottom: '15px' }}>
                Aidez-nous à organiser cet événement ! Inscrivez-vous dès maintenant.
              </p>
              <Button
                onClick={handleRegister}
                disabled={actionLoading}
                variant="primary"
              >
                {actionLoading ? 'Inscription...' : 'S\'inscrire comme bénévole'}
              </Button>
            </div>
          ) : (
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#666' }}>
                🎉 L'objectif de bénévoles est atteint !
              </p>
              <p style={{ color: '#888', marginTop: '10px' }}>
                Merci à tous ceux qui ont proposé leur aide.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
