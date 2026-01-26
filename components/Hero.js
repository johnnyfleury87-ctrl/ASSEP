// components/Hero.js
// Hero avec image de fond et overlay

import Button from './Button'
import { ASSEP, TRUST_POINTS } from '../lib/constants'

export default function Hero() {
  return (
    <section style={{
      position: 'relative',
      minHeight: '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundImage: `url(${ASSEP.heroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: '#2c3e50' // Fallback si pas d'image
    }}>
      {/* Overlay gradient pour lisibilité */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.85) 0%, rgba(44, 62, 80, 0.85) 100%)',
        zIndex: 1
      }} />

      {/* Contenu */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        color: 'white',
        padding: '60px 20px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 'bold',
          margin: '0 0 16px 0',
          textShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
          lineHeight: '1.2'
        }}>
          {ASSEP.title}
        </h1>

        <p style={{
          fontSize: 'clamp(18px, 3vw, 24px)',
          margin: '0 0 40px 0',
          opacity: 0.95,
          textShadow: '1px 1px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {ASSEP.subtitle}
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '50px'
        }}>
          <Button href="/evenements" variant="primary">
            📅 Voir les événements
          </Button>
          <Button href="/dons" variant="secondary">
            💝 Faire un don
          </Button>
        </div>

        {/* Trust points */}
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          fontSize: 'clamp(14px, 2vw, 16px)',
          opacity: 0.9
        }}>
          {TRUST_POINTS.map((point, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)'
              }}
            >
              {point}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          section {
            min-height: 400px;
          }
        }
      `}</style>
    </section>
  )
}
