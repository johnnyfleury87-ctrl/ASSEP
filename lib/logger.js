/**
 * Helper de logging sécurisé
 * Masque automatiquement les données sensibles avant tout log
 */

const SENSITIVE_KEYS = [
  'password',
  'temporaryPassword',
  'access_token',
  'refresh_token',
  'token',
  'authorization',
  'apiKey',
  'secret',
  'privateKey',
  'sessionToken'
];

/**
 * Vérifie si une clé contient un terme sensible
 */
function isSensitiveKey(key) {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive.toLowerCase()));
}

/**
 * Masque récursivement les valeurs sensibles dans un objet
 */
function sanitizeObject(obj, depth = 0) {
  // Éviter la récursion infinie
  if (depth > 10) return '[DEPTH_LIMIT]';
  
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si c'est une primitive, retourner tel quel
  if (typeof obj !== 'object') {
    return obj;
  }

  // Si c'est un tableau
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  // Si c'est un objet
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Sanitize arguments pour le logging
 */
function sanitizeArgs(...args) {
  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      return sanitizeObject(arg);
    }
    return arg;
  });
}

/**
 * Logger sécurisé - ne log rien en production par défaut
 */
const safeLog = {
  /**
   * Log de debug (désactivé en production)
   */
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[DEBUG]', ...sanitizeArgs(...args));
    }
  },

  /**
   * Log d'information (désactivé en production sauf si NEXT_PUBLIC_DEBUG_MODE=true)
   */
  info: (...args) => {
    if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.info('[INFO]', ...sanitizeArgs(...args));
    }
  },

  /**
   * Avertissement (toujours actif mais sanitizé)
   */
  warn: (...args) => {
    console.warn('[WARN]', ...sanitizeArgs(...args));
  },

  /**
   * Erreur (toujours actif mais sanitizé)
   */
  error: (...args) => {
    console.error('[ERROR]', ...sanitizeArgs(...args));
  },

  /**
   * Log API pour tracer les requêtes (désactivé en production)
   */
  api: (method, endpoint, status, metadata = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[API]',
        method,
        endpoint,
        status,
        sanitizeObject(metadata)
      );
    }
  },

  /**
   * Log Auth pour tracer l'authentification (toujours sanitizé)
   */
  auth: (action, metadata = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        '[AUTH]',
        action,
        sanitizeObject(metadata)
      );
    }
  }
};

export default safeLog;
export { sanitizeObject, isSensitiveKey };
