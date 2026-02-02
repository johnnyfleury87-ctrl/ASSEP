// components/Navbar.js
// Barre de navigation responsive avec vrais boutons

import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/evenements', label: 'Événements' },
    { href: '/dons', label: 'Dons' },
    { href: '/login', label: 'Espace membres' }
  ]

  return (
    <nav style={{
      backgroundColor: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo/Titre */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#4CAF50',
          textDecoration: 'none',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#4CAF50',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'white',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
          }}>
            🏫
          </div>
          ASSEP
        </Link>

        {/* Menu Desktop */}
        <div style={{
          display: 'none',
          gap: '10px',
          '@media (min-width: 768px)': { display: 'flex' }
        }} className="desktop-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '10px 20px',
                backgroundColor: link.href === '/' ? '#4CAF50' : '#f0f0f0',
                color: link.href === '/' ? 'white' : '#333',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (link.href !== '/') {
                  e.target.style.backgroundColor = '#e0e0e0'
                }
              }}
              onMouseLeave={(e) => {
                if (link.href !== '/') {
                  e.target.style.backgroundColor = '#f0f0f0'
                }
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Menu Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'block',
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          className="mobile-menu-btn"
        >
          {mobileMenuOpen ? '✕ Fermer' : '☰ Menu'}
        </button>
      </div>

      {/* Menu Mobile */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: 'white',
          borderTop: '1px solid #e5e5e5',
          padding: '10px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }} className="mobile-nav">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '12px 20px',
                backgroundColor: link.href === '/' ? '#4CAF50' : '#f0f0f0',
                color: link.href === '/' ? 'white' : '#333',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '15px',
                textAlign: 'center',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      <style jsx>{`
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
          .desktop-nav {
            display: flex !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  )
}
