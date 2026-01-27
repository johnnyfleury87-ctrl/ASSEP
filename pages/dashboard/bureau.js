// pages/dashboard/bureau.js
// Gestion du bureau (JETC Solution - présidents uniquement)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../components/Button'
import BureauMemberForm from '../../components/BureauMemberForm'
import safeLog from '../../lib/logger'

export default function BureauManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileData || !['president', 'vice_president'].includes(profileData.role)) {
      router.push('/dashboard')
      return
    }

    // Charger les membres via API
    await loadMembers()
    setLoading(false)
  }

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/admin/bureau')
      if (!response.ok) throw new Error('Erreur de chargement')
      const data = await response.json()
      setMembers(data.members || [])
    } catch (err) {
      safeLog.error('Error loading members:', err)
      setError('Erreur lors du chargement des membres')
    }
  }

  const handleCreate = async (formData) => {
    setError(null)
    setMessage(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/bureau', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          role: formData.role,
          name: formData.name,
          bio: formData.bio || null,
          photoUrl: formData.photo_url || null,
          email: formData.email || null,
          phone: formData.phone || null,
          displayOrder: parseInt(formData.display_order),
          isActive: formData.is_active
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la création')
      }

      setMessage('Membre ajouté avec succès')
      setShowForm(false)
      await loadMembers()
    } catch (err) {
      safeLog.error('Error creating member:', err)
      setError(err.message)
    }
  }

  const handleUpdate = async (formData) => {
    setError(null)
    setMessage(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/bureau', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          id: editingMember.id,
          role: formData.role,
          name: formData.name,
          bio: formData.bio || null,
          photoUrl: formData.photo_url || null,
          email: formData.email || null,
          phone: formData.phone || null,
          displayOrder: parseInt(formData.display_order),
          isActive: formData.is_active
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      setMessage('Membre mis à jour avec succès')
      setShowForm(false)
      setEditingMember(null)
      await loadMembers()
    } catch (err) {
      safeLog.error('Error updating member:', err)
      setError(err.message)
    }
  }

  const handleDelete = async (memberId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      return
    }

    setActionLoading(memberId)
    setError(null)
    setMessage(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/admin/bureau', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: memberId })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression')
      }

      setMessage('Membre supprimé avec succès')
      await loadMembers()
    } catch (err) {
      safeLog.error('Error deleting member:', err)
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setShowForm(true)
    setMessage(null)
    setError(null)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingMember(null)
    setError(null)
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard" style={{ color: '#4CAF50' }}>
          ← Retour au dashboard
        </Link>
        <h1 style={{ marginTop: '20px' }}>Gestion du Bureau</h1>
        <p style={{ color: '#666' }}>
          Configuration des membres du bureau affichés sur le site public + gestion des rôles utilisateurs
        </p>
      </header>

      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Carte "Le Bureau"</h2>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Ajouter un membre'}
          </Button>
        </div>

        {/* Messages de feedback */}
        {message && (
          <div style={{ 
            padding: '12px 20px',
            backgroundColor: '#d4edda',
            color: '#155724',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #c3e6cb'
          }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '12px 20px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Formulaire de création/édition */}
        {showForm && (
          <BureauMemberForm
            member={editingMember}
            onSubmit={editingMember ? handleUpdate : handleCreate}
            onCancel={handleCancelForm}
          />
        )}

        {/* Liste des membres */}
        {members.length === 0 ? (
          <p style={{ color: '#666', padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            Aucun membre du bureau configuré. Cliquez sur "Ajouter un membre" pour commencer.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {members.map(member => (
              <div key={member.id} style={{ 
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
                position: 'relative'
              }}>
                {member.photo_url && (
                  <img 
                    src={member.photo_url} 
                    alt={member.name || member.role}
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      marginBottom: '15px',
                      display: 'block',
                      margin: '0 auto 15px'
                    }}
                  />
                )}
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{member.role}</h4>
                  {member.name && <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{member.name}</p>}
                </div>
                
                <div style={{ 
                  fontSize: '12px',
                  color: member.is_active ? '#4CAF50' : '#999',
                  textAlign: 'center',
                  marginBottom: '15px',
                  fontWeight: '600'
                }}>
                  {member.is_active ? '✓ Visible' : '✗ Masqué'}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <Button
                    onClick={() => handleEdit(member)}
                    style={{ 
                      fontSize: '13px', 
                      padding: '6px 16px',
                      backgroundColor: '#3498db',
                      borderColor: '#3498db'
                    }}
                    disabled={actionLoading === member.id}
                  >
                    Éditer
                  </Button>
                  <Button
                    onClick={() => handleDelete(member.id)}
                    style={{ 
                      fontSize: '13px', 
                      padding: '6px 16px',
                      backgroundColor: '#e74c3c',
                      borderColor: '#e74c3c'
                    }}
                    disabled={actionLoading === member.id}
                  >
                    {actionLoading === member.id ? 'Suppression...' : 'Supprimer'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Gestion des rôles utilisateurs</h2>
        <p style={{ marginBottom: '20px' }}>
          Modifier les rôles des membres inscrits (accès JETC Solution).
        </p>

        <div style={{ 
          padding: '20px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffc107'
        }}>
          <p style={{ margin: 0, color: '#856404' }}>
            ⚠️ <strong>Fonctionnalité à implémenter :</strong> Interface pour lister les profils et modifier leur rôle.
            Utilisez l'API <code>/api/admin/roles</code> (PUT).
          </p>
        </div>
      </section>
    </div>
  )
}
