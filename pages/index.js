// pages/index.js
// Page d'accueil refonte mobile-first

import Layout from '../components/Layout'
import Hero from '../components/Hero'
import EventCard from '../components/EventCard'
import Button from '../components/Button'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { HELP_SECTIONS } from '../lib/constants'

export default function Home({ events, bureau, balance }) {
  return (
    <Layout>
      {/* Hero Section */}
      <Hero balance={balance} />

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
              <Button href="/evenements" variant="primary">
                Voir tous les événements
              </Button>
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
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '30px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(76, 175, 80, 0.15)'
                  e.currentTarget.style.borderColor = '#4CAF50'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)'
                  e.currentTarget.style.borderColor = '#e5e7eb'
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
                <Button href={section.link} variant="primary" fullWidth>
                  En savoir plus →
                </Button>
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
              {bureau.map((member) => {
                const roleLabels = {
                  'president': 'Président',
                  'vice_president': 'Vice-Président',
                  'tresorier': 'Trésorier',
                  'vice_tresorier': 'Vice-Trésorier',
                  'secretaire': 'Secrétaire',
                  'vice_secretaire': 'Vice-Secrétaire'
                };
                
                return (
                  <div
                    key={member.id}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          margin: '0 auto 16px',
                          display: 'block'
                        }}
                      />
                    ) : (
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
                        {member.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      margin: '0 0 4px 0',
                      color: '#333'
                    }}>
                      {member.name}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#4CAF50',
                      fontWeight: '600',
                      margin: member.bio ? '0 0 8px 0' : '0'
                    }}>
                      {roleLabels[member.role] || member.role}
                    </p>
                    {member.bio && (
                      <p style={{
                        fontSize: '13px',
                        color: '#666',
                        margin: 0,
                        lineHeight: '1.4'
                      }}>
                        {member.bio}
                      </p>
                    )}
                  </div>
                );
              })}
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
      .select('id, slug, name, description, location, event_date, status')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString())
      .order('event_date', { ascending: true })
      .limit(3)

    // Récupérer les membres du bureau actifs
    const { data: bureau } = await supabase
      .from('bureau_members')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // Calculer le solde de la trésorerie (avec supabaseAdmin pour bypasser RLS)
    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('type, amount')
    
    let balance = 0
    if (transactions) {
      transactions.forEach(t => {
        if (t.type === 'income') {
          balance += parseFloat(t.amount)
        } else {
          balance -= parseFloat(t.amount)
        }
      })
    }

    return {
      props: {
        events: events || [],
        bureau: bureau || [],
        balance: parseFloat(balance.toFixed(2))
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
