// pages/evenements/index.js
// Liste tous les événements publics

import { supabase } from '../../lib/supabaseClient'
import Link from 'next/link'
import Layout from '../../components/Layout'
import ClientDate from '../../components/ClientDate'
import safeLog from '../../lib/logger'

export default function EventsList({ upcomingEvents, pastEvents }) {
  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ marginBottom: '40px' }}>Tous les événements</h1>

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
                backgroundColor: '#f9f9f9',
                display: 'grid',
                gridTemplateColumns: event.coverPhoto ? '250px 1fr' : '1fr',
                gap: '20px',
                alignItems: 'start'
              }}>
                {event.coverPhoto && (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.coverPhoto.storage_path}`}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '180px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                )}
                <div>
                  <h3>{event.name}</h3>
                  {event.description && <p style={{ color: '#666' }}>{event.description}</p>}
                  <p><strong>📍 {event.location}</strong></p>
                  <p>📅 <ClientDate date={event.event_date} format="full" /></p>
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
                opacity: 0.8,
                display: 'grid',
                gridTemplateColumns: event.coverPhoto ? '150px 1fr' : '1fr',
                gap: '15px',
                alignItems: 'start'
              }}>
                {event.coverPhoto && (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.coverPhoto.storage_path}`}
                    alt={event.name}
                    style={{
                      width: '100%',
                      height: '100px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      filter: 'grayscale(30%)'
                    }}
                  />
                )}
                <div>
                  <h4>{event.name}</h4>
                  <p style={{ fontSize: '14px', color: '#666' }}>
                    <ClientDate date={event.event_date} format="short" /> - {event.location}
                  </p>
                  <Link href={`/evenements/${event.slug}`} style={{ 
                    fontSize: '14px',
                    color: '#666',
                    textDecoration: 'underline'
                  }}>
                    Voir les détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun événement passé.</p>
        )}
      </section>
      </div>
    </Layout>
  )
}

export async function getServerSideProps() {
  try {
    const now = new Date().toISOString()

    // Événements à venir
    const { data: upcomingEvents } = await supabase
      .from('events')
      .select(`
        id, 
        slug, 
        name, 
        description, 
        location, 
        event_date
      `)
      .eq('status', 'published')
      .gte('event_date', now)
      .order('event_date', { ascending: true })

    // Charger photos de couverture pour chaque événement
    if (upcomingEvents && upcomingEvents.length > 0) {
      for (const event of upcomingEvents) {
        const { data: coverPhoto } = await supabase
          .from('event_photos')
          .select('storage_path')
          .eq('event_id', event.id)
          .eq('is_cover', true)
          .single()
        
        event.coverPhoto = coverPhoto
      }
    }

    // Événements passés (10 derniers)
    const { data: pastEvents } = await supabase
      .from('events')
      .select(`
        id, 
        slug, 
        name, 
        description, 
        location, 
        event_date
      `)
      .eq('status', 'published')
      .lt('event_date', now)
      .order('event_date', { ascending: false })
      .limit(10)

    // Charger photos de couverture pour les événements passés
    if (pastEvents && pastEvents.length > 0) {
      for (const event of pastEvents) {
        const { data: coverPhoto } = await supabase
          .from('event_photos')
          .select('storage_path')
          .eq('event_id', event.id)
          .eq('is_cover', true)
          .single()
        
        event.coverPhoto = coverPhoto
      }
    }

    return {
      props: {
        upcomingEvents: upcomingEvents || [],
        pastEvents: pastEvents || []
      }
    }
  } catch (error) {
    safeLog.error('Error:', error)
    return {
      props: {
        upcomingEvents: [],
        pastEvents: []
      }
    }
  }
}
