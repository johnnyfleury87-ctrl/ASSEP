// pages/api/finance/starting-balance.js
// API pour gérer le solde de départ de la trésorerie

import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import safeLog from '../../../lib/logger'

export default async function handler(req, res) {
  const { method } = req

  // ============================================================================
  // AUTHENTICATION - Toutes les méthodes nécessitent une authentification
  // ============================================================================
  
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié. Token Bearer requis.' })
  }

  const token = authHeader.replace('Bearer ', '')
  
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    safeLog.error('❌ Auth error:', authError?.message || 'No user')
    return res.status(401).json({ error: 'Token invalide ou expiré.' })
  }

  // Charger le profil de l'utilisateur
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    safeLog.error('Profile error:', profileError)
    return res.status(403).json({ error: 'Profil introuvable.' })
  }

  // Vérifier les permissions : trésoriers et admins
  const allowedRoles = ['tresorier', 'vice_tresorier', 'president', 'vice_president']
  if (!profile.is_jetc_admin && !allowedRoles.includes(profile.role)) {
    return res.status(403).json({ 
      error: 'Accès refusé. Réservé aux gestionnaires financiers.' 
    })
  }

  // ============================================================================
  // GET - Récupérer le solde de départ
  // ============================================================================
  
  if (method === 'GET') {
    try {
      const { data: settings, error } = await supabaseAdmin
        .from('treasury_settings')
        .select('*')
        .single()

      if (error) {
        safeLog.error('Fetch error:', error)
        return res.status(500).json({ error: 'Erreur lors de la récupération du solde de départ.' })
      }

      return res.status(200).json({ 
        starting_balance: parseFloat(settings?.starting_balance || 0),
        starting_balance_date: settings?.starting_balance_date || null,
        updated_at: settings?.updated_at || null
      })

    } catch (err) {
      safeLog.error('GET error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // PUT - Mettre à jour le solde de départ
  // ============================================================================
  
  if (method === 'PUT') {
    try {
      const { starting_balance, starting_balance_date } = req.body

      // Validation
      if (starting_balance === undefined || starting_balance === null) {
        return res.status(400).json({ 
          error: 'Le champ "starting_balance" est requis.' 
        })
      }

      const balanceValue = parseFloat(starting_balance)
      if (isNaN(balanceValue)) {
        return res.status(400).json({ 
          error: 'Le solde de départ doit être un nombre valide.' 
        })
      }

      // Récupérer la config existante
      const { data: existingSettings } = await supabaseAdmin
        .from('treasury_settings')
        .select('id')
        .single()

      if (!existingSettings) {
        return res.status(500).json({ error: 'Configuration trésorerie introuvable.' })
      }

      // Mettre à jour
      const { data: settings, error } = await supabaseAdmin
        .from('treasury_settings')
        .update({
          starting_balance: balanceValue,
          starting_balance_date: starting_balance_date || null,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id)
        .select()
        .single()

      if (error) {
        safeLog.error('Update error:', error)
        return res.status(500).json({ error: 'Erreur lors de la mise à jour du solde de départ.' })
      }

      safeLog.info('✅ Solde de départ mis à jour:', {
        balance: balanceValue,
        by: user.email
      })

      return res.status(200).json({ 
        message: 'Solde de départ mis à jour avec succès',
        starting_balance: parseFloat(settings.starting_balance),
        starting_balance_date: settings.starting_balance_date
      })

    } catch (err) {
      safeLog.error('PUT error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // Méthode non supportée
  // ============================================================================
  
  return res.status(405).json({ error: `Méthode ${method} non autorisée.` })
}
