// pages/dashboard/evenements/[id]/caisse.js
// Gestion de la caisse d'un événement (recettes)

import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function EventCashup() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [event, setEvent] = useState(null)
  const [cashup, setCashup] = useState({
    cashCents: 0,
    cardCents: 0,
    chequeCents: 0,
    otherCents: 0,
    notes: ''
  })
  const [message, setMessage] = useState(null)

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

    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileData || !['tresorier', 'vice_tresorier', 'president', 'vice_president'].includes(profileData.role)) {
      router.push('/dashboard')
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

    const { data: cashupData } = await supabase
      .from('event_cashups')
      .select('*')
      .eq('event_id', id)
      .single()

    if (cashupData) {
      setCashup({
        cashCents: cashupData.cash_cents,
        cardCents: cashupData.card_cents,
        chequeCents: cashupData.cheque_cents,
        otherCents: cashupData.other_cents,
        notes: cashupData.notes || ''
      })
    }

    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('event_cashups')
        .upsert({
          event_id: id,
          cash_cents: parseInt(cashup.cashCents) || 0,
          card_cents: parseInt(cashup.cardCents) || 0,
          cheque_cents: parseInt(cashup.chequeCents) || 0,
          other_cents: parseInt(cashup.otherCents) || 0,
          notes: cashup.notes,
          updated_by: user.id
        }, {
          onConflict: 'event_id'
        })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: 'Caisse enregistrée avec succès' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const totalCents = parseInt(cashup.cashCents) + parseInt(cashup.cardCents) + parseInt(cashup.chequeCents) + parseInt(cashup.otherCents)

  if (loading) {
    return <div style={{ padding: '20px' }}>Chargement...</div>
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/dashboard/evenements" style={{ color: '#4CAF50' }}>
          ← Retour aux événements
        </Link>
        <h1 style={{ marginTop: '20px' }}>Caisse - {event.title}</h1>
      </header>

      <form onSubmit={handleSave} style={{ 
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '30px',
        backgroundColor: '#f9f9f9'
      }}>
        {message && (
          <div style={{ 
            padding: '15px', 
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da', 
            color: message.type === 'success' ? '#155724' : '#721c24',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {message.text}
          </div>
        )}

        <h3>Recettes par moyen de paiement</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Saisir les montants en centimes (ex: 1550 pour 15,50 €)
        </p>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            💵 Espèces (centimes)
          </label>
          <input 
            type="number"
            value={cashup.cashCents}
            onChange={(e) => setCashup({ ...cashup, cashCents: e.target.value })}
            min="0"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            = {(cashup.cashCents / 100).toFixed(2)} €
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            💳 Carte bancaire (centimes)
          </label>
          <input 
            type="number"
            value={cashup.cardCents}
            onChange={(e) => setCashup({ ...cashup, cardCents: e.target.value })}
            min="0"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            = {(cashup.cardCents / 100).toFixed(2)} €
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            📝 Chèques (centimes)
          </label>
          <input 
            type="number"
            value={cashup.chequeCents}
            onChange={(e) => setCashup({ ...cashup, chequeCents: e.target.value })}
            min="0"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            = {(cashup.chequeCents / 100).toFixed(2)} €
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            💰 Autres (centimes)
          </label>
          <input 
            type="number"
            value={cashup.otherCents}
            onChange={(e) => setCashup({ ...cashup, otherCents: e.target.value })}
            min="0"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            = {(cashup.otherCents / 100).toFixed(2)} €
          </p>
        </div>

        <div style={{ 
          padding: '20px',
          backgroundColor: '#e8f5e9',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '16px', margin: '0 0 5px 0' }}>Total recettes</p>
          <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#4CAF50', margin: 0 }}>
            {(totalCents / 100).toFixed(2)} €
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Notes
          </label>
          <textarea 
            value={cashup.notes}
            onChange={(e) => setCashup({ ...cashup, notes: e.target.value })}
            rows="4"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button 
          type="submit"
          disabled={saving}
          style={{ 
            padding: '12px 30px',
            backgroundColor: saving ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la caisse'}
        </button>
      </form>
    </div>
  )
}
