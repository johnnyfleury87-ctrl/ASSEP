// pages/dashboard/evenements/index.js
// Liste et gestion des événements

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function EventsManagement() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  const checkAuthAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profileData || !['secretaire', 'vice_secretaire', 'president', 'vice_president'].includes(profileData.role)) {
      router.push('/dashboard')
      return
    }

    setProfile(profileData)
    await loadEvents()
    setLoading(false)
  }

  const loadEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('starts_at', { ascending: false })

    setEvents(data || [])
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
        <h1 style={{ marginTop: '20px' }}>Gestion des événements</h1>
        <Link href="/dashboard/evenements/new">
          <a style={{ 
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            marginTop: '20px'
          }}>
            ➕ Créer un nouvel événement
          </a>
        </Link>
      </header>

      {events.length === 0 ? (
        <p>Aucun événement pour le moment.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {events.map(event => (
            <div key={event.id} style={{ 
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>{event.title}</h3>
                  {event.theme && <p style={{ color: '#666', margin: '0 0 10px 0' }}>{event.theme}</p>}
                  <p style={{ margin: '5px 0' }}>
                    📍 {event.location}<br />
                    📅 {new Date(event.starts_at).toLocaleDateString('fr-FR')}
                  </p>
                  <p style={{ 
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: event.status === 'published' ? '#4CAF50' : '#999',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    marginTop: '10px'
                  }}>
                    {event.status}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Link href={`/dashboard/evenements/${event.id}/benevoles`}>
                    <a style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#2196F3',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      Bénévoles
                    </a>
                  </Link>
                  <Link href={`/dashboard/evenements/${event.id}/caisse`}>
                    <a style={{ 
                      padding: '8px 16px',
                      backgroundColor: '#FF9800',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}>
                      Caisse
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
