// pages/dashboard/communications.js
// Gestion des campagnes d'emails (liste + envoi)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Button from '../../components/Button'
import CampaignForm from '../../components/CampaignForm'

export default function Communications() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [sendingCampaign, setSendingCampaign] = useState(null)
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

    if (!profileData || !['president', 'vice_president', 'secretaire', 'vice_secretaire'].includes(profileData.role)) {
      router.push('/dashboard')
      return
    }

    await loadCampaigns()
    setLoading(false)
  }

  const loadCampaigns = async () => {
    const { data: campaignsData } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    setCampaigns(campaignsData || [])
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

      const response = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création')
      }

      setMessage('Campagne créée avec succès (brouillon)')
      setShowForm(false)
      await loadCampaigns()
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError(err.message)
    }
  }

  const handleSend = async (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return

    const confirmMessage = `Envoyer la campagne "${campaign.name}" ?\n\nCette action est irréversible. Seuls les contacts opt-in recevront l'email.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    setSendingCampaign(campaignId)
    setError(null)
    setMessage(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ campaignId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setMessage(`Campagne envoyée ! ${data.sentCount} emails envoyés${data.failedCount > 0 ? `, ${data.failedCount} échecs` : ''}`)
      await loadCampaigns()
    } catch (err) {
      console.error('Error sending campaign:', err)
      setError(err.message)
    } finally {
      setSendingCampaign(null)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingCampaign(null)
    setError(null)
  }

  const getStatusLabel = (status) => {
    const labels = {
      'draft': 'Brouillon',
      'sent': 'Envoyée',
      'failed': 'Échec'
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#95a5a6',
      'sent': '#4CAF50',
      'failed': '#e74c3c'
    }
    return colors[status] || '#95a5a6'
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
        <h1 style={{ marginTop: '20px' }}>Communications</h1>
        <p style={{ color: '#666' }}>
          Gestion des campagnes d'emails aux membres ayant accepté de recevoir les communications.
        </p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Campagnes email</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '+ Nouvelle campagne'}
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

      {/* Formulaire de création */}
      {showForm && (
        <CampaignForm
          campaign={editingCampaign}
          onSubmit={handleCreate}
          onCancel={handleCancelForm}
        />
      )}

      {/* Liste des campagnes */}
      {campaigns.length === 0 ? (
        <p style={{ color: '#666', padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          Aucune campagne créée. Cliquez sur "Nouvelle campagne" pour commencer.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {campaigns.map(campaign => (
            <div key={campaign.id} style={{ 
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 5px 0', color: '#333' }}>{campaign.name}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '15px' }}>
                    Sujet : <strong>{campaign.subject}</strong>
                  </p>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(campaign.status),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginRight: '10px'
                  }}>
                    {getStatusLabel(campaign.status)}
                  </span>
                  {campaign.status === 'sent' && (
                    <span style={{ fontSize: '13px', color: '#666' }}>
                      {campaign.sent_count} envoyés
                      {campaign.failed_count > 0 && `, ${campaign.failed_count} échecs`}
                    </span>
                  )}
                </div>
                
                {campaign.status === 'draft' && (
                  <Button
                    onClick={() => handleSend(campaign.id)}
                    disabled={sendingCampaign === campaign.id}
                    style={{ 
                      backgroundColor: '#27ae60',
                      borderColor: '#27ae60'
                    }}
                  >
                    {sendingCampaign === campaign.id ? 'Envoi...' : 'Envoyer'}
                  </Button>
                )}
              </div>

              <div style={{ fontSize: '13px', color: '#999', marginTop: '10px' }}>
                {campaign.sent_at ? (
                  <p style={{ margin: 0 }}>
                    Envoyée le {new Date(campaign.sent_at).toLocaleString('fr-FR')}
                  </p>
                ) : (
                  <p style={{ margin: 0 }}>
                    Créée le {new Date(campaign.created_at).toLocaleString('fr-FR')}
                  </p>
                )}
                <p style={{ margin: '5px 0 0 0' }}>
                  Destinataires : {campaign.recipient_type === 'all' ? 'Tous (opt-in)' : 
                                   campaign.recipient_type === 'members' ? 'Membres uniquement' : 
                                   'Liste personnalisée'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
