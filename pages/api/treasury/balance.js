// pages/api/treasury/balance.js
// API CENTRALISÉE pour le calcul du solde de trésorerie
// SOURCE OF TRUTH : Solde actuel = solde de départ + somme des transactions

import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import safeLog from '../../../lib/logger'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // ============================================================================
    // 1. RÉCUPÉRER LE SOLDE DE DÉPART
    // ============================================================================
    
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('treasury_settings')
      .select('starting_balance, starting_balance_date')
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      // PGRST116 = pas de ligne trouvée, c'est OK (solde = 0)
      safeLog.error('Settings error:', settingsError)
      return res.status(500).json({ error: 'Erreur lors de la récupération du solde de départ' })
    }

    const startingBalance = parseFloat(settings?.starting_balance || 0)
    const startingBalanceDate = settings?.starting_balance_date || null

    // ============================================================================
    // 2. CALCULER LA SOMME DES TRANSACTIONS
    // ============================================================================
    
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('transactions')
      .select('type, amount')

    if (transactionsError) {
      safeLog.error('Transactions error:', transactionsError)
      return res.status(500).json({ error: 'Erreur lors de la récupération des transactions' })
    }

    let transactionsTotal = 0
    if (transactions && transactions.length > 0) {
      transactions.forEach(t => {
        const amount = parseFloat(t.amount)
        if (t.type === 'income') {
          transactionsTotal += amount
        } else if (t.type === 'expense') {
          transactionsTotal -= amount
        }
      })
    }

    // ============================================================================
    // 3. CALCULER LE SOLDE ACTUEL (RÈGLE MÉTIER)
    // ============================================================================
    
    const currentBalance = startingBalance + transactionsTotal

    // ============================================================================
    // 4. RETOURNER LA RÉPONSE STRUCTURÉE
    // ============================================================================
    
    return res.status(200).json({
      startingBalance: parseFloat(startingBalance.toFixed(2)),
      startingBalanceDate,
      transactionsTotal: parseFloat(transactionsTotal.toFixed(2)),
      currentBalance: parseFloat(currentBalance.toFixed(2)),
      // Informations supplémentaires utiles
      meta: {
        transactionsCount: transactions?.length || 0,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (err) {
    safeLog.error('Balance API error:', err)
    return res.status(500).json({ error: 'Erreur serveur lors du calcul du solde' })
  }
}
