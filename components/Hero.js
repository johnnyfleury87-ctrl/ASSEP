// components/Hero.js
// Hero avec carrousel de photos en background et overlay

import Button from './Button'
import { ASSEP, TRUST_POINTS, HERO_IMAGES } from '../lib/constants'
import { useState, useEffect } from 'react'

export default function Hero({ balance }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length)
        setIsTransitioning(false)
      }, 500)
    }, 5000) // Change toutes les 5 secondes

    return () => clearInterval(interval)
  }, [])

  return (
    <section style={{
      position: 'relative',
      minHeight: '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      backgroundColor: '#2c3e50' // Fallback
    }}>      
      {/* Carrousel de photos en background */}
      {HERO_IMAGES.map((image, index) => (
        <div
          key={image}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: index === currentImageIndex ? (isTransitioning ? 0 : 1) : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: 0
          }}
        />
      ))}
      {/* Overlay gradient pour lisibilité */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(147, 197, 253, 0.85) 100%)',
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
        {/* Logo ASSEP */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          animation: 'logoFloat 3s ease-in-out infinite'
        }}>
          <div style={{
            width: 'clamp(60px, 10vw, 80px)',
            height: 'clamp(60px, 10vw, 80px)',
            backgroundColor: 'white',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(32px, 6vw, 48px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
          }}>
            🏫
          </div>
        </div>

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
          
          {/* Afficher le solde si disponible */}
          {balance !== undefined && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                fontWeight: 'bold'
              }}
            >
              💰 Solde trésorerie: {balance.toFixed(2)} €
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @media (max-width: 640px) {
          section {
            min-height: 400px;
          }
        }
      `}</style>
    </section>
  )
}
