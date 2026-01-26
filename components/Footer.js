// components/Footer.js
// Footer avec branding JETC Solution

import { JETC, CURRENT_YEAR } from '../lib/constants'

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '40px 20px 20px',
      marginTop: 'auto'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'center'
      }}>
        {/* Logo JETC */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          <img 
            src={JETC.logoPath} 
            alt={`Logo ${JETC.name}`}
            style={{
              height: '50px',
              width: 'auto'
            }}
            onError={(e) => {
              // Fallback: afficher un div avec initiales
              const fallback = document.createElement('div')
              fallback.style.cssText = 'width: 50px; height: 50px; background: #4CAF50; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;'
              fallback.textContent = 'JT'
              e.target.replaceWith(fallback)
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <p style={{ 
              margin: 0,
              fontSize: '14px',
              color: '#ecf0f1'
            }}>
              Site développé et géré par
            </p>
            <a 
              href={JETC.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px',
                textDecoration: 'none',
                margin: 0,
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = '#3498db'}
              onMouseOut={(e) => e.target.style.color = 'white'}
            >
              {JETC.name}
            </a>
            <p style={{ 
              margin: 0,
              fontSize: '13px',
              color: '#bdc3c7'
            }}>
              {JETC.location}
            </p>
          </div>
        </div>

        {/* Contact JETC */}
        <div>
          <a 
            href={`mailto:${JETC.email}`}
            style={{
              color: '#3498db',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.color = '#5dade2'}
            onMouseOut={(e) => e.target.style.color = '#3498db'}
          >
            ✉️ {JETC.email}
          </a>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%',
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          margin: '10px 0'
        }} />

        {/* Copyright */}
        <p style={{
          fontSize: '13px',
          color: '#95a5a6',
          margin: 0
        }}>
          © {CURRENT_YEAR} ASSEP. Tous droits réservés.
        </p>
      </div>
    </footer>
  )
}
