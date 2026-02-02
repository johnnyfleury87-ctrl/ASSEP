// components/ClientDate.js
// Composant pour afficher les dates uniquement côté client (évite les erreurs d'hydration SSR)

import { useState, useEffect } from 'react'

export default function ClientDate({ date, format = 'full' }) {
  const [formattedDate, setFormattedDate] = useState('')

  useEffect(() => {
    if (!date) return

    const d = new Date(date)
    
    let formatted = ''
    switch (format) {
      case 'full':
        // Format complet : "samedi 7 février 2026 à 17:00"
        formatted = d.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        break
      
      case 'short':
        // Format court : "07/02/2026"
        formatted = d.toLocaleDateString('fr-FR')
        break
      
      case 'time':
        // Heure seulement : "17:00"
        formatted = d.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        break
      
      case 'datetime':
        // Date + heure : "07/02/2026 17:00"
        formatted = `${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`
        break
      
      default:
        formatted = d.toLocaleString('fr-FR')
    }
    
    setFormattedDate(formatted)
  }, [date, format])

  // Pendant le chargement (SSR), afficher un placeholder
  if (!formattedDate) {
    return <span suppressHydrationWarning>Chargement...</span>
  }

  return <span suppressHydrationWarning>{formattedDate}</span>
}
