// pages/dashboard/evenements/[id]/benevoles.js
// Liste des bénévoles inscrits à un événement + export CSV

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function EventVolunteers() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState(null)
  const [volunteers, setVolunteers] = useState([])

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (!eventData) {
      router.push('/dashboard/evenements')
      return
    }

    setEvent(eventData)

    const { data: signups } = await supabase
      .from('volunteer_signups')
      .select(`
        *,
        event_shifts (
          starts_at,
          ends_at,
          event_tasks (
            label
          )
        )
      `)
      .eq('event_id', id)
      .order('created_at', { ascending: false })

    setVolunteers(signups || [])
    setLoading(false)
  }

  const exportCSV = () => {
    if (volunteers.length === 0) return

    const headers = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Tâche', 'Créneau début', 'Créneau fin', 'Statut', 'Comm. opt-in']
    const rows = volunteers.map(v => [
      v.first_name,
      v.last_name,
      v.email,
      v.phone || '',
      v.event_shifts?.event_tasks?.label || '',
      new Date(v.event_shifts?.starts_at).toLocaleString('fr-FR'),
      new Date(v.event_shifts?.ends_at).toLocaleString('fr-FR'),
      v.status,
      v.comms_opt_in ? 'Oui' : 'Non'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `benevoles-${event.slug}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard/evenements" style={{ color: '#4CAF50' }}>
          ← Retour aux événements
        </Link>
        <h1 style={{ marginTop: '20px' }}>Bénévoles - {event.title}</h1>
        <button 
          onClick={exportCSV}
          disabled={volunteers.length === 0}
          style={{ 
            padding: '10px 20px',
            backgroundColor: volunteers.length === 0 ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: volunteers.length === 0 ? 'not-allowed' : 'pointer',
            marginTop: '10px'
          }}
        >
          📥 Exporter en CSV
        </button>
      </header>

      <p style={{ marginBottom: '20px' }}>
        <strong>{volunteers.length}</strong> bénévole(s) inscrit(s)
      </p>

      {volunteers.length === 0 ? (
        <p>Aucun bénévole inscrit pour le moment.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            backgroundColor: 'white'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Prénom</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Nom</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Téléphone</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Tâche</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Créneau</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.map(volunteer => (
                <tr key={volunteer.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{volunteer.first_name}</td>
                  <td style={{ padding: '12px' }}>{volunteer.last_name}</td>
                  <td style={{ padding: '12px' }}>{volunteer.email}</td>
                  <td style={{ padding: '12px' }}>{volunteer.phone || '-'}</td>
                  <td style={{ padding: '12px' }}>{volunteer.event_shifts?.event_tasks?.label || '-'}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    {volunteer.event_shifts ? (
                      <>
                        {new Date(volunteer.event_shifts.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(volunteer.event_shifts.ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 8px',
                      backgroundColor: volunteer.status === 'confirmed' ? '#4CAF50' : '#999',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {volunteer.status}
                    </span>
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
