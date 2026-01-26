// pages/dons/index.js
// Page dons généraux avec QR code

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { supabase } from '../../lib/supabaseClient'

export default function DonsGeneraux({ donationCounter }) {
  const canvasRef = useRef(null)
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_GENERAL_URL || 'https://helloasso.com/assep'

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, donationUrl, { width: 300 }, (error) => {
        if (error) console.error('QR Code error:', error)
      })
    }
  }, [donationUrl])

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
      <header style={{ marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#4CAF50' }}>
          ← Retour à l'accueil
        </Link>
      </header>

      <h1>💝 Faire un don à l'ASSEP</h1>
      <p style={{ fontSize: '18px', marginBottom: '40px' }}>
        Votre générosité nous permet de financer des projets pédagogiques, 
        des sorties scolaires et du matériel pour nos enfants.
      </p>

      {donationCounter && donationCounter.amount_cents_total > 0 && (
        <div style={{ 
          padding: '20px',
          backgroundColor: '#f0f8f0',
          borderRadius: '8px',
          marginBottom: '40px'
        }}>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 10px 0' }}>
            Total des dons collectés :
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

      <div style={{ 
        marginTop: '60px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        textAlign: 'left'
      }}>
        <h2>Pourquoi donner ?</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>Financer des sorties éducatives et culturelles</li>
          <li>Acheter du matériel pédagogique et sportif</li>
          <li>Organiser des événements conviviaux pour l'école</li>
          <li>Soutenir des projets innovants pour nos enfants</li>
        </ul>
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          L'ASSEP est une association à but non lucratif. Tous les dons sont utilisés 
          exclusivement pour le bénéfice des élèves de l'école Hubert Reeves.
        </p>
      </div>
    </div>
  )
}

export async function getServerSideProps() {
  try {
    // Récupérer le compteur général (event_id NULL)
    const { data: donationCounter } = await supabase
      .from('donation_counters')
      .select('amount_cents_total')
      .is('event_id', null)
      .single()

    return {
      props: {
        donationCounter: donationCounter || null
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      props: {
        donationCounter: null
      }
    }
  }
}
