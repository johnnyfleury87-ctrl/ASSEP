// pages/api/finance/transactions.js
// API pour la gestion des transactions financières (recettes/dépenses)

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

  // Vérifier les permissions : seuls les gestionnaires financiers
  const allowedRoles = ['tresorier', 'vice_tresorier', 'president', 'vice_president']
  if (!profile.is_jetc_admin && !allowedRoles.includes(profile.role)) {
    return res.status(403).json({ 
      error: 'Accès refusé. Réservé aux gestionnaires financiers.' 
    })
  }

  // ============================================================================
  // GET - Liste des transactions
  // ============================================================================
  
  if (method === 'GET') {
    try {
      let query = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          events:event_id(id, name),
          profiles:recorded_by(id, first_name, last_name, email)
        `)
        .order('transaction_date', { ascending: false })

      // Filtres optionnels via query params
      const { type, category, event_id, start_date, end_date } = req.query

      if (type && ['income', 'expense'].includes(type)) {
        query = query.eq('type', type)
      }

      if (category) {
        query = query.eq('category', category)
      }

      if (event_id) {
        query = query.eq('event_id', event_id)
      }

      if (start_date) {
        query = query.gte('transaction_date', start_date)
      }

      if (end_date) {
        query = query.lte('transaction_date', end_date)
      }

      const { data: transactions, error } = await query

      if (error) {
        safeLog.error('Fetch error:', error)
        return res.status(500).json({ error: 'Erreur lors de la récupération des transactions.' })
      }

      // Calculer le solde
      let balance = 0
      transactions.forEach(t => {
        if (t.type === 'income') {
          balance += parseFloat(t.amount)
        } else {
          balance -= parseFloat(t.amount)
        }
      })

      return res.status(200).json({ 
        transactions,
        balance: parseFloat(balance.toFixed(2)),
        count: transactions.length 
      })

    } catch (err) {
      safeLog.error('GET error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // POST - Créer une transaction
  // ============================================================================
  
  if (method === 'POST') {
    try {
      const { type, category, amount, description, transaction_date, event_id } = req.body

      // Validation
      if (!type || !['income', 'expense'].includes(type)) {
        return res.status(400).json({ 
          error: 'Le champ "type" est requis et doit être "income" ou "expense".' 
        })
      }

      if (!category || category.trim() === '') {
        return res.status(400).json({ error: 'Le champ "category" est requis.' })
      }

      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ 
          error: 'Le champ "amount" est requis et doit être un nombre positif.' 
        })
      }

      if (!description || description.trim() === '') {
        return res.status(400).json({ error: 'Le champ "description" est requis.' })
      }

      if (!transaction_date) {
        return res.status(400).json({ error: 'Le champ "transaction_date" est requis.' })
      }

      // Vérifier le format de la date (ISO 8601)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(transaction_date)) {
        return res.status(400).json({ 
          error: 'Le champ "transaction_date" doit être au format YYYY-MM-DD.' 
        })
      }

      // Créer la transaction
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .insert({
          type,
          category: category.trim(),
          amount: parseFloat(amount),
          description: description.trim(),
          transaction_date,
          event_id: event_id || null,
          recorded_by: user.id
        })
        .select()
        .single()

      if (error) {
        safeLog.error('Insert error:', error)
        return res.status(500).json({ error: 'Erreur lors de la création de la transaction.' })
      }

      // Transaction created successfully
      return res.status(201).json({ transaction })

    } catch (err) {
      safeLog.error('POST error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // PUT - Modifier une transaction
  // ============================================================================
  
  if (method === 'PUT') {
    try {
      const { id, type, category, amount, description, transaction_date, event_id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Le champ "id" est requis.' })
      }

      // Vérifier que la transaction existe
      const { data: existingTransaction, error: fetchError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !existingTransaction) {
        return res.status(404).json({ error: 'Transaction introuvable.' })
      }

      // Construire l'objet de mise à jour
      const updates = {}

      if (type && ['income', 'expense'].includes(type)) {
        updates.type = type
      }

      if (category !== undefined && category.trim() !== '') {
        updates.category = category.trim()
      }

      if (amount !== undefined && !isNaN(amount) && parseFloat(amount) > 0) {
        updates.amount = parseFloat(amount)
      }

      if (description !== undefined && description.trim() !== '') {
        updates.description = description.trim()
      }

      if (transaction_date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(transaction_date)) {
          return res.status(400).json({ 
            error: 'Le champ "transaction_date" doit être au format YYYY-MM-DD.' 
          })
        }
        updates.transaction_date = transaction_date
      }

      if (event_id !== undefined) {
        updates.event_id = event_id || null
      }

      // Si aucun champ à mettre à jour
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour.' })
      }

      // Mettre à jour
      const { data: transaction, error } = await supabaseAdmin
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        safeLog.error('Update error:', error)
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la transaction.' })
      }

      // Transaction updated successfully
      return res.status(200).json({ transaction })

    } catch (err) {
      safeLog.error('PUT error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // DELETE - Supprimer une transaction
  // ============================================================================
  
  if (method === 'DELETE') {
    try {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Le champ "id" est requis.' })
      }

      // Vérifier que la transaction existe
      const { data: existingTransaction, error: fetchError } = await supabaseAdmin
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !existingTransaction) {
        return res.status(404).json({ error: 'Transaction introuvable.' })
      }

      // Supprimer
      const { error } = await supabaseAdmin
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) {
        safeLog.error('Delete error:', error)
        return res.status(500).json({ error: 'Erreur lors de la suppression de la transaction.' })
      }

      // Transaction deleted successfully
      return res.status(200).json({ success: true })

    } catch (err) {
      safeLog.error('DELETE error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // Méthode non supportée
  // ============================================================================
  
  return res.status(405).json({ error: `Méthode ${method} non autorisée.` })
}
