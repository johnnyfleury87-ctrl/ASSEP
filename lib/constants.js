// Constantes du site ASSEP

export const SITE_NAME = 'ASSEP - Association École Hubert Reeves'
export const SITE_TAGLINE = 'On anime l\'école, on aide les projets, on crée des moments.'
export const SCHOOL_NAME = 'École Hubert Reeves'
export const CITY = 'Champagnole'

// Contact JETC Solution
export const JETC_EMAIL = 'contact@jetc-solution.fr'
export const JETC_NAME = 'JETC Solution'
export const JETC_LOCATION = 'Sapois'

// Année courante
export const CURRENT_YEAR = new Date().getFullYear()

// Valeurs de confiance
export const TRUST_POINTS = [
  '🎪 Événements scolaires',
  '🍹 Buvette et activités',
  '🤝 Bénévoles bienvenus'
]

// Sections "Comment aider"
export const HELP_SECTIONS = [
  {
    emoji: '👋',
    title: 'Je donne un coup de main',
    description: 'Rejoignez nos bénévoles lors des événements',
    link: '/evenements'
  },
  {
    emoji: '💝',
    title: 'Je fais un don',
    description: 'Soutenez les projets de l\'école',
    link: '/dons'
  },
  {
    emoji: '📝',
    title: 'Je rejoins l\'asso',
    description: 'Devenez membre de l\'ASSEP',
    link: '/login'
  }
]
