// pages/dons/evenement/[id].js
// Page dons spécifique à un événement

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../../../lib/supabaseClient'
import Layout from '../../../components/Layout'

export default function DonsEvenement({ event, donationCounter }) {
  const canvasRef = useRef(null)
  const baseUrl = process.env.NEXT_PUBLIC_DONATION_EVENT_BASE_URL || 'https://helloasso.com/assep?event='
  const donationUrl = `${baseUrl}${event ? event.slug : ''}`

  useEffect(() => {
    if (canvasRef.current && event) {
      QRCode.toCanvas(canvasRef.current, donationUrl, { width: 300 }, (error) => {
        if (error) console.error('QR Code error:', error)
      })
    }
  }, [donationUrl, event])

  if (!event) {
    return (
      <Layout>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <p>Événement non trouvé</p>
          <Link href="/dons">← Retour aux dons généraux</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h1>💝 Soutenir : {event.title}</h1>
        {event.theme && <p style={{ fontSize: '18px', color: '#666' }}>{event.theme}</p>}
      
      <p style={{ fontSize: '16px', marginTop: '20px', marginBottom: '40px' }}>
        Aidez-nous à financer cet événement et à le rendre encore plus beau pour nos enfants !
      </p>

      {donationCounter && donationCounter.amount_cents_total > 0 && (
        <div style={{ 
          padding: '20px',
          backgroundColor: '#f0f8f0',
          borderRadius: '8px',
          marginBottom: '40px'
        }}>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 10px 0' }}>
            Dons collectés pour cet événement :
          </p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#4CAF50', margin: 0 }}>
            {(donationCounter.amount_cents_total / 100).toFixed(2)} €
          </p>
        </div>
      )}

      <div style={{ marginBottom: '40px' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%' }}></canvas>
      </div>

      <p style={{ fontSize: '16px', color: '#666' }}>
        Scannez ce QR code avec votre téléphone<br />
        ou <a href={donationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4CAF50' }}>
          cliquez ici pour faire un don en ligne
        </a>
      </p>

      <div style={{ marginTop: '40px' }}>
        <Link href="/dons" style={{ color: '#4CAF50' }}>
          Voir tous les moyens de soutenir l&apos;ASSEP →
        </Link>
      </div>
      </div>
    </Layout>
  )
}

export async function getServerSideProps({ params }) {
  try {
    const { id } = params

    // Récupérer l'événement
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, slug, title, theme')
      .eq('id', id)
      .eq('status', 'published')
      .single()

    if (eventError || !event) {
      return { props: { event: null } }
    }

    // Récupérer le compteur de dons pour cet événement
    const { data: donationCounter } = await supabase
      .from('donation_counters')
      .select('amount_cents_total')
      .eq('event_id', event.id)
      .single()

    return {
      props: {
        event,
        donationCounter: donationCounter || null
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { props: { event: null } }
  }
}
