// pages/espace-membres.js
// Page d'inscription/connexion pour devenir membre ASSEP

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import Layout from '../components/Layout'
import Button from '../components/Button'
import safeLog from '../lib/logger'

export default function EspaceMembres() {
  const router = useRouter()
  const { redirect } = router.query
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showSignup, setShowSignup] = useState(false)
  
  // États formulaire inscription
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    gdprConsent: false
  })
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Charger le profil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()
        
        setProfile(profileData)

        // Si déjà membre et redirect demandé
        if (profileData && redirect) {
          router.push(redirect)
        }
      }
    } catch (err) {
      safeLog.error('Check user error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError(null)
    setMessage(null)

    try {
      // Validation
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.phone) {
        setError('Tous les champs sont obligatoires')
        setFormLoading(false)
        return
      }

      if (!formData.gdprConsent) {
        setError('Vous devez accepter les conditions de protection des données personnelles')
        setFormLoading(false)
        return
      }

      // Créer le compte via API
      const response = await fetch('/api/auth/signup-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          volunteerConsent: formData.gdprConsent
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de l\'inscription')
        setFormLoading(false)
        return
      }

      setMessage('✅ Inscription réussie ! Vous allez être redirigé...')
      
      // Connexion automatique
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        setError('Compte créé. Veuillez vous connecter.')
        setFormLoading(false)
        return
      }

      // Redirection
      setTimeout(() => {
        if (redirect) {
          router.push(redirect)
        } else {
          router.push('/dashboard')
        }
      }, 1500)

    } catch (err) {
      safeLog.error('Signup error:', err)
      setError('Erreur de connexion au serveur')
    } finally {
      setFormLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        setError('Email ou mot de passe incorrect')
        setFormLoading(false)
        return
      }

      // Redirection
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      safeLog.error('Login error:', err)
      setError('Erreur de connexion')
    } finally {
      setFormLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p>Chargement...</p>
        </div>
      </Layout>
    )
  }

  if (user && profile) {
    return (
      <Layout>
        <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
          <div style={{
            backgroundColor: '#e8f5e9',
            padding: '30px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <h1 style={{ marginBottom: '20px' }}>✅ Vous êtes membre ASSEP</h1>
            <p style={{ marginBottom: '30px', fontSize: '18px' }}>
              Bienvenue {profile.first_name} {profile.last_name} !
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button href="/dashboard" variant="primary">
                Accéder à mon espace
              </Button>
              {redirect && (
                <Button href={redirect} variant="secondary">
                  Continuer vers la page demandée
                </Button>
              )}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 20px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>
          Espace Membres ASSEP
        </h1>

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

        {/* Toggle Connexion / Inscription */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => setShowSignup(false)}
            style={{
              padding: '10px 20px',
              backgroundColor: !showSignup ? '#2196F3' : '#e0e0e0',
              color: !showSignup ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Connexion
          </button>
          <button
            onClick={() => setShowSignup(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: showSignup ? '#2196F3' : '#e0e0e0',
              color: showSignup ? 'white' : '#666',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Devenir membre
          </button>
        </div>

        {/* Formulaire Connexion */}
        {!showSignup && (
          <form onSubmit={handleLogin} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Mot de passe *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <Button
              type="submit"
              disabled={formLoading}
              variant="primary"
              style={{ width: '100%' }}
            >
              {formLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
        )}

        {/* Formulaire Inscription */}
        {showSignup && (
          <form onSubmit={handleSignup} style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Prénom *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Nom *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Téléphone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Mot de passe *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
              <small style={{ color: '#666' }}>Minimum 6 caractères</small>
            </div>

            {/* Consentement RGPD */}
            <div style={{
              marginBottom: '25px',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              border: '2px solid #2196F3'
            }}>
              <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2196F3' }}>
                🔒 Protection des données personnelles
              </h3>
              <p style={{ marginBottom: '15px', fontSize: '14px', lineHeight: '1.6' }}>
                Les informations collectées (nom, prénom, téléphone, email) sont utilisées uniquement 
                dans le cadre de l'organisation des événements de l'ASSEP.
              </p>
              <p style={{ marginBottom: '15px', fontSize: '14px', lineHeight: '1.6' }}>
                ✔️ <strong>Seuls les membres du bureau</strong> de l'association (président, trésorier, secrétaire) 
                ont accès à ces données.
              </p>
              <p style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.6' }}>
                ⛔ Elles ne sont <strong>jamais transmises à des tiers</strong>.
              </p>
              
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  name="gdprConsent"
                  checked={formData.gdprConsent}
                  onChange={handleInputChange}
                  required
                  style={{
                    marginTop: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  J'accepte ces conditions et consens à la collecte et au traitement de mes données 
                  personnelles conformément aux règles énoncées ci-dessus. *
                </span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={formLoading || !formData.gdprConsent}
              variant="primary"
              style={{ width: '100%' }}
            >
              {formLoading ? 'Inscription...' : 'Créer mon compte membre'}
            </Button>
          </form>
        )}

        {redirect && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#856404' }}>
              ℹ️ Après inscription, vous serez redirigé vers la page demandée.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}
