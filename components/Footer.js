// components/Footer.js
// Footer avec logo JETC + contact

import { JETC_EMAIL, JETC_NAME, JETC_LOCATION, CURRENT_YEAR, SITE_NAME } from '../lib/constants'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #e5e5e5',
      marginTop: '80px',
      padding: '40px 20px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Logo JETC - À remplacer par vraie image si disponible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#4CAF50',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            JT
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
            Site développé et géré par <strong>{JETC_NAME}</strong>, {JETC_LOCATION}
          </p>
          <a 
            href={`mailto:${JETC_EMAIL}`}
            style={{
              color: '#4CAF50',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {JETC_EMAIL}
          </a>
        </div>

        {/* Copyright */}
        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
          © {CURRENT_YEAR} {SITE_NAME.split(' - ')[0]} - École Hubert Reeves, Champagnole
        </p>
      </div>
    </footer>
  )
}
