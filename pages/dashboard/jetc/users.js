// pages/dashboard/jetc/users.js
// Gestion des utilisateurs (JETC admin uniquement)

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../../components/Button'

export default function JetcUsersManagement() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'membre'
  })

  const ROLES = [
    { value: 'president', label: 'Président' },
    { value: 'vice_president', label: 'Vice-Président' },
    { value: 'tresorier', label: 'Trésorier' },
    { value: 'vice_tresorier', label: 'Vice-Trésorier' },
    { value: 'secretaire', label: 'Secrétaire' },
    { value: 'vice_secretaire', label: 'Vice-Secrétaire' },
    { value: 'membre', label: 'Membre' }
  ]

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Vérifier le rôle JETC admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_jetc_admin')
        .eq('id', session.user.id)
        .single()

      if (!profile || !profile.is_jetc_admin) {
        setError('Accès refusé. Seuls les admins JETC peuvent accéder à cette page.')
        setLoading(false)
        return
      }

      await loadUsers(session.user.access_token)
    } catch (err) {
      console.error('Error:', err)
      setError('Erreur lors du chargement')
      setLoading(false)
    }
  }

  const loadUsers = async (token) => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    setMessage(null)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      setMessage(`Utilisateur créé avec succès ! Un email a été envoyé avec le mot de passe temporaire : ASSEP1234!`)
      
      // Reset form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'membre'
      })
      
      // Recharger la liste
      await loadUsers(session.user.access_token)
    } catch (err) {
      // Ne pas logger l'erreur complète côté client (peut contenir des données sensibles)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  if (error && users.length === 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/dashboard" style={{ color: '#4CAF50' }}>
            ← Retour au dashboard
          </Link>
        </div>
        <div style={{ 
          padding: '20px',
          backgroundColor: '#fee',
          color: '#c33',
          borderRadius: '8px'
        }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link href="/dashboard" style={{ color: '#4CAF50' }}>
          ← Retour au dashboard
        </Link>
        <h1 style={{ marginTop: '20px' }}>Gestion des utilisateurs JETC</h1>
        <p style={{ color: '#666' }}>
          Créez et gérez les comptes utilisateurs de l&apos;ASSEP
        </p>
      </div>

      {/* Formulaire de création */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0 }}>Créer un nouvel utilisateur</h2>

        {message && (
          <div style={{ 
            padding: '15px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            ✅ {message}
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '15px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleCreateUser}>
          <div style={{ display: 'grid', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Prénom
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Nom
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '15px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Rôle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '15px'
                }}
              >
                {ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ 
            padding: '15px',
            backgroundColor: '#fff3cd',
            color: '#856404',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            ℹ️ Le mot de passe temporaire sera <strong>ASSEP1234!</strong><br />
            L&apos;utilisateur devra le changer à sa première connexion.
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={creating}
          >
            {creating ? 'Création en cours...' : '✓ Créer l\'utilisateur'}
          </Button>
        </form>
      </div>

      {/* Liste des utilisateurs */}
      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ padding: '20px 30px', margin: 0, borderBottom: '1px solid #e5e7eb' }}>
          Utilisateurs existants ({users.length})
        </h2>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Nom</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Rôle</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>JETC Admin</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr 
                  key={user.id}
                  style={{ 
                    borderBottom: index < users.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    {user.full_name || <span style={{ color: '#999' }}>Non renseigné</span>}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {user.email}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {ROLES.find(r => r.value === user.role)?.label || user.role || 'membre'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {user.is_jetc_admin ? (
                      <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>✓ Admin</span>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              Aucun utilisateur trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
