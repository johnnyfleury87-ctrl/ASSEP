// components/EventCard.js
// Carte événement responsive

import Link from 'next/link'

export default function EventCard({ event }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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

        {/* Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#555'
        }}>
          <span>📅</span>
          <span>{formatDate(event.event_date)}</span>
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
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '15px',
            textAlign: 'center',
            minHeight: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          Voir les détails →
        </Link>
      </div>
    </div>
  )
}
