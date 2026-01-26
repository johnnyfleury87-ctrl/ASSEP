// pages/index.js
// Page d'accueil publique

import { supabase } from '../lib/supabaseClient'
import Link from 'next/link'

export default function Home({ events, bureau }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>ASSEP - Association École Hubert Reeves</h1>
        <p>Champagnole - Soutenir et animer notre école</p>
      </header>

      {/* Section présentation */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Bienvenue</h2>
        <p>
          L'ASSEP (Association de Soutien et d'Entraide Parents) accompagne l'école Hubert Reeves 
          dans l'organisation d'événements et d'activités pour enrichir la vie scolaire de nos enfants.
        </p>
      </section>

      {/* Prochains événements */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Prochains événements</h2>
        {events && events.length > 0 ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            {events.map(event => (
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
                  Voir les détails et s'inscrire
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p>Aucun événement à venir pour le moment. Revenez bientôt !</p>
        )}
        <div style={{ marginTop: '20px' }}>
          <Link href="/evenements">
            Voir tous les événements →
          </Link>
        </div>
      </section>

      {/* CTA Dons */}
      <section style={{ 
        backgroundColor: '#4CAF50', 
        color: 'white', 
        padding: '30px', 
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '40px'
      }}>
        <h2>Soutenez l'ASSEP</h2>
        <p>Vos dons nous aident à financer des projets éducatifs et des sorties scolaires.</p>
        <Link href="/dons" style={{ 
          display: 'inline-block',
          marginTop: '10px',
          padding: '12px 30px',
          backgroundColor: 'white',
          color: '#4CAF50',
          textDecoration: 'none',
          borderRadius: '4px',
          fontWeight: 'bold'
        }}>
          Faire un don
        </Link>
      </section>

      {/* Le Bureau */}
      {bureau && bureau.length > 0 && (
        <section style={{ marginBottom: '40px' }}>
          <h2>Le Bureau</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {bureau.map(member => (
              <div key={member.id} style={{ textAlign: 'center' }}>
                {member.photo_url && (
                  <img 
                    src={member.photo_url} 
                    alt={member.name || member.title}
                    style={{ 
                      width: '120px', 
                      height: '120px', 
                      borderRadius: '50%', 
                      objectFit: 'cover',
                      marginBottom: '10px'
                    }}
                  />
                )}
                <h4 style={{ margin: '5px 0' }}>{member.title}</h4>
                {member.name && <p style={{ margin: '5px 0', color: '#666' }}>{member.name}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ textAlign: 'center', marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #ddd', color: '#666' }}>
        <p>&copy; {new Date().getFullYear()} ASSEP - École Hubert Reeves, Champagnole</p>
        <p>
          <Link href="/login">Espace membres</Link>
        </p>
      </footer>
    </div>
  )
}

export async function getServerSideProps() {
  try {
    // Récupérer les 3 prochains événements publiés
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, slug, title, theme, location, starts_at')
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3)

    // Récupérer les membres du bureau visibles
    const { data: bureau, error: bureauError } = await supabase
      .from('bureau_members')
      .select('id, title, name, photo_url')
      .eq('is_visible', true)
      .order('sort_order', { ascending: true })

    return {
      props: {
        events: events || [],
        bureau: bureau || []
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error)
    return {
      props: {
        events: [],
        bureau: []
      }
    }
  }
}
