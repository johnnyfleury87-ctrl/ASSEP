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

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
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
      {/* Titre */}
      <h3 style={{
        fontSize: '20px',
        fontWeight: 'bold',
        margin: 0,
        color: '#333'
      }}>
        {event.title}
      </h3>

      {/* Thème */}
      {event.theme && (
        <p style={{
          fontSize: '14px',
          color: '#666',
          margin: 0,
          fontStyle: 'italic'
        }}>
          {event.theme}
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
        <span>{formatDate(event.starts_at)}</span>
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
  )
}
