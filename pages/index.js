// pages/index.js
// Page d'accueil refonte mobile-first

import Layout from '../components/Layout'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { HELP_SECTIONS } from '../lib/constants'

export default function Home({ events, bureau }) {
  return (
    <Layout>
      {/* Hero Section */}
      <Hero />

      {/* Section: Prochains événements */}
      <section style={{
        padding: '60px 20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#333'
          }}>
            📅 Prochains événements
          </h2>

          {events && events.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px'
            }}>
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <p style={{
                fontSize: '18px',
                color: '#666',
                marginBottom: '20px'
              }}>
                Aucun événement prévu pour le moment.
              </p>
              <p style={{
                fontSize: '16px',
                color: '#888',
                marginBottom: '30px'
              }}>
                Revenez bientôt pour découvrir nos prochaines activités ! 🎉
              </p>
              <Link
                href="/evenements"
                style={{
                  display: 'inline-block',
                  padding: '12px 30px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '15px'
                }}
              >
                Voir tous les événements
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Section: Comment aider */}
      <section style={{
        padding: '60px 20px',
        backgroundColor: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#333'
          }}>
            Comment aider l&apos;ASSEP ?
          </h2>
          <p style={{
            textAlign: 'center',
            fontSize: '16px',
            color: '#666',
            marginBottom: '50px',
            maxWidth: '600px',
            margin: '0 auto 50px'
          }}>
            Plusieurs façons de soutenir notre association et participer à la vie de l&apos;école
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {HELP_SECTIONS.map((section, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  padding: '30px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ fontSize: '48px' }}>
                  {section.emoji}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  margin: 0,
                  color: '#333'
                }}>
                  {section.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {section.description}
                </p>
                <Link
                  href={section.link}
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    marginTop: 'auto',
                    minHeight: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
                >
                  En savoir plus →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section: Le Bureau */}
      <section style={{
        padding: '60px 20px',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 4vw, 32px)',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '40px',
            color: '#333'
          }}>
            👥 Le Bureau de l&apos;ASSEP
          </h2>

          {bureau && bureau.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              {bureau.map((member, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '24px',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#4CAF50',
                    margin: '0 auto 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    {member.first_name?.charAt(0) || '?'}
                  </div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    margin: '0 0 4px 0',
                    color: '#333'
                  }}>
                    {member.first_name} {member.last_name}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#4CAF50',
                    fontWeight: '600',
                    margin: 0
                  }}>
                    {member.role_label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              <p style={{
                fontSize: '16px',
                color: '#666'
              }}>
                Les membres du bureau seront présentés prochainement.
              </p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}

// Server-side data fetching
export async function getServerSideProps() {
  try {
    // Récupérer les événements à venir
    const { data: events } = await supabase
      .from('events')
      .select('id, slug, title, theme, location, starts_at, status')
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(3)

    // Récupérer les membres du bureau
    const { data: bureau } = await supabase
      .from('bureau_members')
      .select('*')
      .order('display_order', { ascending: true })

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
