// pages/evenements/index.js
// Liste tous les événements publics

import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'

export default function EventsList({ upcomingEvents, pastEvents }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#4CAF50' }}>
          ← Retour à l'accueil
        </Link>
        <h1 style={{ marginTop: '20px' }}>Tous les événements</h1>
      </header>

      {/* Événements à venir */}
      <section style={{ marginBottom: '60px' }}>
        <h2>À venir</h2>
        {upcomingEvents && upcomingEvents.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {upcomingEvents.map(event => (
              <div key={event.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#f9f9f9'
              }}>
                <h3>{event.title}</h3>
                {event.theme && <p style={{ color: '#666' }}>{event.theme}</p>}
                <p><strong>📍 {event.location}</strong></p>
                <p>📅 {new Date(event.starts_at).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <Link href={`/evenements/${event.slug}`} style={{ 
                  display: 'inline-block',
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px'
                }}>
                  Voir les détails
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun événement à venir.</p>
        )}
      </section>

      {/* Événements passés */}
      <section>
        <h2>Événements passés</h2>
        {pastEvents && pastEvents.length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {pastEvents.map(event => (
              <div key={event.id} style={{ 
                border: '1px solid #eee', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: '#fafafa',
                opacity: 0.8
              }}>
                <h4>{event.title}</h4>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  {new Date(event.starts_at).toLocaleDateString('fr-FR')} - {event.location}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun événement passé.</p>
        )}
      </section>
    </div>
  )
}

export async function getServerSideProps() {
  try {
    const now = new Date().toISOString()

    // Événements à venir
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select('id, slug, title, theme, location, starts_at')
      .eq('status', 'published')
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })

    // Événements passés (10 derniers)
    const { data: pastEvents } = await supabase
      .from('events')
      .select('id, slug, title, location, starts_at')
      .eq('status', 'published')
      .lt('starts_at', now)
      .order('starts_at', { ascending: false })
      .limit(10)

    return {
      props: {
        upcomingEvents: upcomingEvents || [],
        pastEvents: pastEvents || []
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      props: {
        upcomingEvents: [],
        pastEvents: []
      }
    }
  }
}
