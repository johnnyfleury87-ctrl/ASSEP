// components/Hero.js
// Section hero de la page d'accueil

import Link from 'next/link'
import { SITE_NAME, SITE_TAGLINE, TRUST_POINTS } from '../lib/constants'

export default function Hero() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      color: 'white',
      padding: '60px 20px',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Titre */}
        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 42px)',
          fontWeight: 'bold',
          margin: '0 0 20px 0',
          lineHeight: '1.2'
        }}>
          {SITE_NAME}
        </h1>

        {/* Sous-titre */}
        <p style={{
          fontSize: 'clamp(16px, 3vw, 20px)',
          margin: '0 0 40px 0',
          opacity: 0.95,
          lineHeight: '1.5'
        }}>
          {SITE_TAGLINE}
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '50px',
          alignItems: 'center'
        }}>
          <Link
            href="/evenements"
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              backgroundColor: 'white',
              color: '#4CAF50',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              minHeight: '56px',
              minWidth: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            📅 Voir les événements
          </Link>

          <Link
            href="/dons"
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px',
              minHeight: '56px',
              minWidth: '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.color = '#4CAF50'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
              e.currentTarget.style.color = 'white'
            }}
          >
            💝 Faire un don
          </Link>
        </div>

        {/* Trust points */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center'
        }}>
          {TRUST_POINTS.map((point, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                opacity: 0.95
              }}
            >
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 768px) {
          section > div > div:nth-child(3) {
            flex-direction: row !important;
            justify-content: center;
          }
          section > div > div:nth-child(4) {
            flex-direction: row !important;
            justify-content: center;
            gap: 30px !important;
          }
        }
      `}</style>
    </section>
  )
}
