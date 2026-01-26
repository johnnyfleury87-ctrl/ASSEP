/**
 * Utilitaires de sécurité pour masquer les données sensibles
 */

/**
 * Masque les valeurs sensibles dans un objet pour les logs
 * @param {Object} obj - Objet à masquer
 * @param {Array<string>} sensitiveKeys - Clés à masquer (défaut: password, token, etc.)
 * @returns {Object} Objet avec valeurs masquées
 */
export function maskSensitive(obj, sensitiveKeys = ['password', 'token', 'access_token', 'refresh_token', 'api_key', 'secret']) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  const masked = { ...obj }

  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase()
    
    // Vérifier si la clé contient un mot sensible
    const isSensitive = sensitiveKeys.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey.toLowerCase())
    )

    if (isSensitive) {
      if (typeof masked[key] === 'string' && masked[key].length > 0) {
        // Masquer en gardant les 2 premiers et 2 derniers caractères
        const value = masked[key]
        if (value.length <= 4) {
          masked[key] = '***'
        } else {
          masked[key] = value.slice(0, 2) + '***' + value.slice(-2)
        }
      } else {
        masked[key] = '***'
      }
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      // Récursif pour les objets imbriqués
      masked[key] = maskSensitive(masked[key], sensitiveKeys)
    }
  }

  return masked
}

/**
 * Log sécurisé qui masque automatiquement les données sensibles
 * @param {string} message - Message de log
 * @param {Object} data - Données à logger (seront masquées)
 */
export function secureLog(message, data = null) {
  if (data) {
    console.log(message, maskSensitive(data))
  } else {
    console.log(message)
  }
}

/**
 * Log d'erreur sécurisé
 * @param {string} message - Message d'erreur
 * @param {Error|Object} error - Erreur ou objet d'erreur
 */
export function secureError(message, error = null) {
  if (error) {
    const errorData = error instanceof Error 
      ? { message: error.message, name: error.name }
      : error
    console.error(message, maskSensitive(errorData))
  } else {
    console.error(message)
  }
}
