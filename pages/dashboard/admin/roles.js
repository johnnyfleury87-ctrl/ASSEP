// pages/dashboard/admin/roles.js
// Gestion des rôles (président/vice-président uniquement)

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../../components/Button'

export default function RolesManagement() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

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

      // Vérifier le rôle
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!profile || !['president', 'vice_president'].includes(profile.role)) {
        setError('Accès refusé. Seuls le président et vice-président peuvent accéder à cette page.')
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

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs')
      }

      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (userId, newRole) => {
    setUpdating(userId)
    setMessage(null)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.access_token}`
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour')
      }

      setMessage(`Rôle mis à jour avec succès`)
      
      // Recharger les users
      await loadUsers(session.user.access_token)
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err.message)
    } finally {
      setUpdating(null)
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
        <h1 style={{ marginTop: '20px' }}>Gestion des rôles</h1>
        <p style={{ color: '#666' }}>
          Assignez et modifiez les rôles des membres de l&apos;ASSEP
        </p>
      </div>

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

      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Nom</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Rôle actuel</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Modifier</th>
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      id={`role-${user.id}`}
                      defaultValue={user.role || 'membre'}
                      disabled={updating === user.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        minWidth: '160px'
                      }}
                    >
                      {ROLES.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="primary"
                      disabled={updating === user.id}
                      onClick={() => {
                        const select = document.getElementById(`role-${user.id}`)
                        updateRole(user.id, select.value)
                      }}
                    >
                      {updating === user.id ? '...' : '✓'}
                    </Button>
                  </div>
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
  )
}
