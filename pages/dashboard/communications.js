// pages/dashboard/communications.js
// Gestion des campagnes d'emails (liste + envoi)

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Communications() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState([])

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

    const { data: campaignsData } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    setCampaigns(campaignsData || [])
    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard">
          <a style={{ color: '#4CAF50' }}>← Retour au dashboard</a>
        </Link>
        <h1 style={{ marginTop: '20px' }}>Communications</h1>
        <p style={{ color: '#666' }}>
          Gestion des campagnes d'emails aux membres ayant accepté de recevoir les communications.
        </p>
      </header>

      <div style={{ 
        padding: '20px',
        backgroundColor: '#fff3cd',
        borderRadius: '8px',
        marginBottom: '40px',
        border: '1px solid #ffc107'
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          ⚠️ <strong>Fonctionnalité à implémenter :</strong> Créer une interface pour composer et envoyer des campagnes emails.
          Pour le moment, utilisez directement l'API <code>/api/campaigns/send</code> avec un ID de campagne existant.
        </p>
      </div>

      <h2>Campagnes existantes</h2>

      {campaigns.length === 0 ? (
        <p>Aucune campagne créée pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {campaigns.map(campaign => (
            <div key={campaign.id} style={{ 
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f9f9f9'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{campaign.subject}</h3>
              <p style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                backgroundColor: campaign.status === 'sent' ? '#4CAF50' : '#999',
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {campaign.status}
              </p>
              {campaign.sent_at && (
                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  Envoyée le {new Date(campaign.sent_at).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
