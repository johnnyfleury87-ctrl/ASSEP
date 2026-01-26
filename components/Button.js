// components/Button.js
// Composant bouton animé avec variantes

import Link from 'next/link'

export default function Button({ 
  children, 
  variant = 'primary', 
  href, 
  onClick, 
  disabled = false,
  type = 'button',
  fullWidth = false,
  className = ''
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    minHeight: '48px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none'
  }

  const variants = {
    primary: {
      backgroundColor: 'white',
      color: '#1f2937',
      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
    },
    secondary: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: '2px solid #3b82f6',
      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#3b82f6',
      border: 'none',
      boxShadow: 'none'
    }
  }

  const style = {
    ...baseStyles,
    ...variants[variant],
    ...(className ? {} : {})
  }

  // Si c'est un lien
  if (href && !disabled) {
    return (
      <>
        <Link href={href} style={style} className={`btn btn-${variant} ${className}`}>
          {children}
        </Link>
        <style jsx>{`
          .btn {
            transform: scale(1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .btn:hover:not(:disabled) {
            transform: scale(1.05) translateY(-2px);
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5) !important;
            animation: pulse-blue 1.5s infinite;
          }
          @keyframes pulse-blue {
            0%, 100% {
              box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
            }
            50% {
              box-shadow: 0 8px 32px rgba(147, 197, 253, 0.7);
            }
          }
          .btn-primary:hover:not(:disabled) {
            background-color: #eff6ff;
            color: #1e40af;
          }
          .btn-secondary:hover:not(:disabled) {
            background-color: #2563eb;
            border-color: #2563eb;
          }
          .btn-ghost:hover:not(:disabled) {
            background-color: rgba(59, 130, 246, 0.1);
          }
          .btn:active:not(:disabled) {
            transform: scale(0.98) translateY(0);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
          }
          .btn:focus-visible {
            outline: 3px solid #3b82f6;
            outline-offset: 2px;
          }
        `}</style>
      </>
    )
  }

  // Si c'est un bouton
  return (
    <>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        style={style}
        className={`btn btn-${variant} ${className}`}
      >
        {children}
      </button>
      <style jsx>{`
        .btn {
          transform: scale(1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn:hover:not(:disabled) {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5) !important;
          animation: pulse-blue 1.5s infinite;
        }
        @keyframes pulse-blue {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 8px 32px rgba(147, 197, 253, 0.7);
          }
        }
        .btn-primary:hover:not(:disabled) {
          background-color: #eff6ff;
          color: #1e40af;
        }
        .btn-secondary:hover:not(:disabled) {
          background-color: #2563eb;
          border-color: #2563eb;
        }
        .btn-ghost:hover:not(:disabled) {
          background-color: rgba(59, 130, 246, 0.1);
        }
        .btn:active:not(:disabled) {
          transform: scale(0.98) translateY(0);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3) !important;
        }
        .btn:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </>
  )
}
