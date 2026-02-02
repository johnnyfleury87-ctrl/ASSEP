// lib/treasuryBalance.js
// Helper client pour récupérer le solde de trésorerie de manière cohérente
// SOURCE OF TRUTH : API centralisée /api/treasury/balance

import safeLog from './logger'

/**
 * Récupère le solde de trésorerie depuis l'API centralisée
 * 
 * Retourne un objet avec :
 * - startingBalance : solde de départ
 * - transactionsTotal : somme des transactions (+ recettes, - dépenses)
 * - currentBalance : solde actuel (startingBalance + transactionsTotal)
 * - startingBalanceDate : date du solde de départ (optionnel)
 * - meta : informations supplémentaires (nombre transactions, date calcul)
 * 
 * @returns {Promise<Object>}
 */
export async function getTreasuryBalance() {
  try {
    const response = await fetch('/api/treasury/balance')
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      startingBalance: data.startingBalance || 0,
      startingBalanceDate: data.startingBalanceDate || null,
      transactionsTotal: data.transactionsTotal || 0,
      currentBalance: data.currentBalance || 0,
      meta: data.meta || {}
    }
  } catch (error) {
    safeLog.error('Error fetching treasury balance:', error)
    
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      startingBalance: 0,
      startingBalanceDate: null,
      transactionsTotal: 0,
      currentBalance: 0,
      meta: {
        error: error.message,
        transactionsCount: 0
      }
    }
  }
}

/**
 * Récupère uniquement le solde actuel (nombre simple)
 * 
 * @returns {Promise<number>}
 */
export async function getCurrentBalance() {
  const data = await getTreasuryBalance()
  return data.currentBalance
}
