// pages/dashboard/dons.js
// Gestion des donations reçues

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../components/Button'
import safeLog from '../../lib/logger'

export default function DonsManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [donations, setDonations] = useState([])
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    checkAuthAndLoad()
  }, [filterStatus])

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, is_jetc_admin')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['tresorier', 'vice_tresorier', 'president', 'vice_president']
    if (!profileData || (!profileData.is_jetc_admin && !allowedRoles.includes(profileData.role))) {
      router.push('/dashboard')
      return
    }

    loadDonations()
  }

  const loadDonations = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const url = filterStatus === 'all' 
        ? '/api/donations'
        : `/api/donations?status=${filterStatus}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des donations')
      }

      const data = await response.json()
      setDonations(data.donations || [])
      setStats(data.stats || null)
    } catch (err) {
      safeLog.error('Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (donationId, newStatus) => {
    if (!confirm(`Changer le statut de cette donation à "${getStatusLabel(newStatus)}" ?`)) {
      return
    }

    setError(null)
    setMessage(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session expirée')
      }

      const response = await fetch('/api/donations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ id: donationId, status: newStatus })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erreur lors de la mise à jour')
      }

      setMessage('Statut mis à jour avec succès !')
      loadDonations()
    } catch (err) {
      setError(err.message)
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      completed: 'Complété',
      failed: 'Échoué',
      refunded: 'Remboursé'
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FF9800',
      completed: '#4CAF50',
      failed: '#f44336',
      refunded: '#9E9E9E'
    }
    return colors[status] || '#666'
  }

  const getTypeLabel = (type) => {
    const labels = {
      'one-time': 'Unique',
      'monthly': 'Mensuel',
      'annual': 'Annuel'
    }
    return labels[type] || type
  }

  const exportCSV = () => {
    if (donations.length === 0) return

    const headers = ['Date', 'Donateur', 'Email', 'Téléphone', 'Montant (€)', 'Type', 'Statut', 'Méthode paiement', 'Référence', 'Événement', 'Opt-in comm']
    const rows = donations.map(d => [
      new Date(d.created_at).toLocaleDateString('fr-FR'),
      d.donor_name,
      d.donor_email,
      d.donor_phone || '',
      d.amount.toFixed(2),
      getTypeLabel(d.donation_type),
      getStatusLabel(d.status),
      d.payment_method || '',
      d.payment_reference || '',
      d.events?.title || '',
      d.comms_opt_in ? 'Oui' : 'Non'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `donations-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard" style={{ color: '#4CAF50' }}>
          ← Retour au dashboard
        </Link>
        <h1 style={{ marginTop: '20px' }}>Gestion des Donations</h1>
      </header>

      {/* Messages */}
      {message && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #c3e6cb'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {/* Statistiques */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0' }}>
              Total complété
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', margin: 0 }}>
              {stats.completed?.toFixed(2)} €
            </p>
          </div>

          {stats.pending !== undefined && (
            <div style={{
              padding: '20px',
              backgroundColor: '#fff3e0',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0' }}>
                En attente
              </p>
              <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#FF9800', margin: 0 }}>
                {stats.pending?.toFixed(2)} €
              </p>
            </div>
          )}

          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 8px 0' }}>
              Nombre de donations
            </p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: 0 }}>
              {stats.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filtres et actions */}
      <div style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <label style={{ fontWeight: 'bold' }}>Filtrer par statut :</label>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="all">Tous</option>
          <option value="pending">En attente</option>
          <option value="completed">Complété</option>
          <option value="failed">Échoué</option>
          <option value="refunded">Remboursé</option>
        </select>

        <button 
          onClick={exportCSV}
          disabled={donations.length === 0}
          style={{ 
            padding: '8px 16px',
            backgroundColor: donations.length === 0 ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: donations.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            marginLeft: 'auto'
          }}
        >
          📥 Exporter CSV
        </button>
      </div>

      {/* Liste des donations */}
      {donations.length === 0 ? (
        <p>Aucune donation enregistrée{filterStatus !== 'all' ? ` avec le statut "${getStatusLabel(filterStatus)}"` : ''}.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Donateur</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Contact</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Montant</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Statut</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Paiement</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Événement</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map(donation => (
                <tr key={donation.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {new Date(donation.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold' }}>{donation.donor_name}</div>
                    {donation.comms_opt_in && (
                      <span style={{ fontSize: '11px', color: '#4CAF50' }}>✓ Opt-in comm</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <div>{donation.donor_email}</div>
                    {donation.donor_phone && (
                      <div style={{ fontSize: '12px', color: '#666' }}>{donation.donor_phone}</div>
                    )}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '16px'
                  }}>
                    {donation.amount.toFixed(2)} €
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                    {getTypeLabel(donation.donation_type)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: getStatusColor(donation.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {getStatusLabel(donation.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {donation.payment_method || '-'}
                    {donation.payment_reference && (
                      <div style={{ fontSize: '11px' }}>{donation.payment_reference}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {donation.events?.title || '-'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {donation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(donation.id, 'completed')}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(donation.id, 'failed')}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px'
                            }}
                          >
                            Échec
                          </button>
                        </>
                      )}
                      {donation.status === 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(donation.id, 'refunded')}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#9E9E9E',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          Rembourser
                        </button>
                      )}
                      {(donation.status === 'failed' || donation.status === 'refunded') && (
                        <span style={{ fontSize: '11px', color: '#999' }}>-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
