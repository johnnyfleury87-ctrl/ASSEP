// Constantes du site ASSEP

// Informations JETC Solution (développeur du site)
export const JETC = {
  name: "JETC Solution",
  location: "Sapois",
  website: "https://www.jetc-immo.ch",
  email: "contact@jetc-immo.ch",
  logoPath: "/assets/brand/jetc-logo.png"
}

// Informations ASSEP
export const ASSEP = {
  title: "ASSEP – Association École Hubert Reeves",
  subtitle: "Champagnole – Soutenir et animer notre école",
  heroImage: "/photos/home/hero/hero.png"
}

// Images du carrousel hero (ordre alphabétique, préfixe numérique recommandé)
export const HERO_IMAGES = [
  '/photos/home/hero/hero.png',
  // TODO: Ajouter plus de photos dans /public/photos/home/hero/
  // Nommage : 01-fete-ecole.jpg, 02-kermesse.jpg, etc.
  // Voir : /public/photos/home/hero/README.md
]

export const SITE_NAME = 'ASSEP - Association École Hubert Reeves'
export const SITE_TAGLINE = 'On anime l\'école, on aide les projets, on crée des moments.'
export const SCHOOL_NAME = 'École Hubert Reeves'
export const CITY = 'Champagnole'

// Contact JETC Solution (rétro-compatibilité)
export const JETC_EMAIL = JETC.email
export const JETC_NAME = JETC.name
export const JETC_LOCATION = JETC.location

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
