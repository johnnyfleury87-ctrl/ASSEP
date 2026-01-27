// pages/evenements/[slug].js
// Détail d'un événement + formulaire inscription bénévole

import { supabase } from '../../lib/supabaseClient'
import { useState } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'

export default function EventDetail({ event, buvette, paymentMethods, tasksWithShifts, donationCounter }) {
  const [formData, setFormData] = useState({
    shiftId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    commsOptIn: false
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          shiftId: formData.shiftId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          commsOptIn: formData.commsOptIn
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue')
      } else {
        setMessage(data.message || 'Inscription réussie !')
        setFormData({
          shiftId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          commsOptIn: false
        })
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  if (!event) {
    return (
      <Layout>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
          <p>Événement non trouvé</p>
          <Link href="/evenements">← Retour aux événements</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <h1>{event.name}</h1>
        {event.description && <p style={{ fontSize: '18px', color: '#666' }}>{event.description}</p>}
      
      <div style={{ margin: '20px 0' }}>
        <p><strong>📍 Lieu :</strong> {event.location}</p>
        <p><strong>📅 Date :</strong> {new Date(event.event_date).toLocaleDateString('fr-FR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}</p>
      </div>

      {/* Buvette */}
      {event.has_buvette && buvette && buvette.length > 0 && (
        <section style={{ margin: '40px 0' }}>
          <h2>🍹 Buvette</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {buvette.map(item => (
              <div key={item.id} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '8px', 
                padding: '15px',
                backgroundColor: '#f9f9f9'
              }}>
                <h4>{item.name}</h4>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                  {(item.price_cents / 100).toFixed(2)} {item.currency}
                </p>
              </div>
            ))}
          </div>
          
          {paymentMethods && paymentMethods.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p><strong>Moyens de paiement acceptés :</strong></p>
              <p>{paymentMethods.map(pm => {
                const labels = {
                  cash: '💵 Espèces',
                  card: '💳 Carte bancaire',
                  cheque: '📝 Chèque',
                  twint: '📱 Twint',
                  other: 'Autre'
                }
                return labels[pm.method] || pm.method
              }).join(', ')}</p>
            </div>
          )}
        </section>
      )}

      {/* Besoins bénévoles */}
      {tasksWithShifts && tasksWithShifts.length > 0 && (
        <section style={{ margin: '40px 0' }}>
          <h2>🙋 Nous avons besoin de bénévoles !</h2>
          <p>Rejoignez-nous pour faire de cet événement une réussite !</p>

          <form onSubmit={handleSubmit} style={{ 
            marginTop: '30px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '30px',
            backgroundColor: '#f9f9f9'
          }}>
            <h3>Formulaire d'inscription</h3>

            {message && (
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#d4edda', 
                color: '#155724',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8d7da', 
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Choisir un créneau *
              </label>
              <select 
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">-- Sélectionner --</option>
                {tasksWithShifts.map(task => (
                  <optgroup key={task.id} label={task.label}>
                    {task.shifts.map(shift => {
                      const placesLeft = shift.required_count - shift.signups_count
                      return (
                        <option 
                          key={shift.id} 
                          value={shift.id}
                          disabled={placesLeft <= 0}
                        >
                          {new Date(shift.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(shift.ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {' '}
                          ({placesLeft > 0 ? `${placesLeft} place(s) restante(s)` : 'Complet'})
                        </option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Prénom *
                </label>
                <input 
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Nom *
                </label>
                <input 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Email *
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Téléphone
              </label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input 
                  type="checkbox"
                  checked={formData.commsOptIn}
                  onChange={(e) => setFormData({ ...formData, commsOptIn: e.target.checked })}
                  style={{ marginRight: '10px' }}
                />
                <span>J'accepte de recevoir les communications de l'ASSEP (événements, actualités)</span>
              </label>
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ 
                padding: '12px 30px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </form>
        </section>
      )}

      {/* Dons */}
      <section style={{ 
        margin: '40px 0',
        padding: '30px',
        backgroundColor: '#4CAF50',
        color: 'white',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <h2>💝 Soutenez cet événement</h2>
        {donationCounter && donationCounter.amount_cents_total > 0 && (
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {(donationCounter.amount_cents_total / 100).toFixed(2)} € déjà collectés
          </p>
        )}
        <Link href={`/dons/evenement/${event.id}`} style={{ 
          display: 'inline-block',
          marginTop: '15px',
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
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const { slug } = params

    // Récupérer l'événement
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (eventError || !event) {
      return { props: { event: null } }
    }

    // Récupérer la buvette
    const { data: buvette } = await supabase
      .from('event_buvette_items')
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .order('name')

    // Récupérer les moyens de paiement
    const { data: paymentMethods } = await supabase
      .from('event_payment_methods')
      .select('*')
      .eq('event_id', event.id)

    // Récupérer les tâches et créneaux avec compteur d'inscriptions
    const { data: tasks } = await supabase
      .from('event_tasks')
      .select('id, label, description')
      .eq('event_id', event.id)

    const tasksWithShifts = []
    if (tasks) {
      for (const task of tasks) {
        const { data: shifts } = await supabase
          .from('event_shifts')
          .select('id, starts_at, ends_at, required_count')
          .eq('event_task_id', task.id)
          .order('starts_at')

        if (shifts) {
          for (const shift of shifts) {
            const { count } = await supabase
              .from('volunteer_signups')
              .select('id', { count: 'exact', head: true })
              .eq('shift_id', shift.id)
              .eq('status', 'confirmed')
            
            shift.signups_count = count || 0
          }
          tasksWithShifts.push({ ...task, shifts })
        }
      }
    }

    // Récupérer le compteur de dons
    const { data: donationCounter } = await supabase
      .from('donation_counters')
      .select('amount_cents_total')
      .eq('event_id', event.id)
      .single()

    return {
      props: {
        event,
        buvette: buvette || [],
        paymentMethods: paymentMethods || [],
        tasksWithShifts: tasksWithShifts || [],
        donationCounter: donationCounter || null
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { props: { event: null } }
  }
}
