// components/EventCard.js
// Carte événement responsive

import Link from 'next/link'
import ClientDate from './ClientDate'

export default function EventCard({ event }) {

  // Construire l'URL de la photo de couverture
  const coverImageUrl = event.cover_photo
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/event-photos/${event.cover_photo}`
    : null

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)'
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Photo de couverture */}
      {coverImageUrl ? (
        <div style={{
          width: '100%',
          height: '200px',
          overflow: 'hidden',
          backgroundColor: '#f0f0f0'
        }}>
          <img
            src={coverImageUrl}
            alt={event.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      ) : (
        <div style={{
          width: '100%',
          height: '200px',
          backgroundColor: '#e8f5e9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '64px'
        }}>
          🏃
        </div>
      )}

      {/* Contenu */}
      <div style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flex: 1
      }}>
        {/* Badge "Bénévoles recherchés" si applicable */}
        {event.volunteer_quota > 0 && event.volunteer_count < event.volunteer_quota && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            backgroundColor: '#fef3c7',
            color: '#92400e',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            alignSelf: 'flex-start',
            animation: 'pulse 2s infinite'
          }}>
            🙋 Bénévoles recherchés
          </div>
        )}
        {/* Titre */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          margin: 0,
          color: '#333'
        }}>
          {event.name}
        </h3>

        {/* Description */}
        {event.description && (
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0,
            lineHeight: '1.5',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {event.description}
          </p>
        )}

        {/* Texte engageant */}
        <div style={{
          fontSize: '14px',
          color: '#4CAF50',
          fontWeight: '600',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          ✨ On vous attend !
        </div>

        {/* Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#555'
        }}>
          <span>📅</span>
          <ClientDate date={event.event_date} format="full" />
        </div>

        {/* Lieu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#555'
        }}>
          <span>📍</span>
          <strong>{event.location}</strong>
        </div>

        {/* Bouton */}
        <Link
          href={`/evenements/${event.slug}`}
          style={{
            display: 'inline-flex',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            textAlign: 'center',
            minHeight: '48px',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.4)'
            const arrow = e.currentTarget.querySelector('.arrow-icon')
            if (arrow) arrow.style.transform = 'translateX(4px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)'
            const arrow = e.currentTarget.querySelector('.arrow-icon')
            if (arrow) arrow.style.transform = 'translateX(0)'
          }}
        >
          Voir les détails
          <span className="arrow-icon" style={{
            transition: 'transform 0.3s',
            display: 'inline-block'
          }}>→</span>
        </Link>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}
