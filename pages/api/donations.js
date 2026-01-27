// pages/api/donations.js
// API pour la gestion des donations (lecture et modification)

import { supabaseAdmin } from '../../lib/supabaseAdmin'
import { createAnonClient } from '../../lib/supabaseAnonServer'

export default async function handler(req, res) {
  const { method } = req

  // ============================================================================
  // GET - Liste des donations (sans auth pour les stats publiques limitées)
  // Avec auth pour accès complet (gestionnaires financiers)
  // ============================================================================
  
  if (method === 'GET') {
    try {
      const authHeader = req.headers.authorization
      let isAuthenticated = false
      let profile = null

      // Vérifier si authentifié
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const anonClient = createAnonClient(token)
        const { data: { user }, error: authError } = await anonClient.auth.getUser()

        if (!authError && user) {
          const { data: profileData } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileData) {
            profile = profileData
            const allowedRoles = ['tresorier', 'vice_tresorier', 'president', 'vice_president']
            isAuthenticated = profile.is_jetc_admin || allowedRoles.includes(profile.role)
          }
        }
      }

      if (isAuthenticated) {
        // Accès complet pour gestionnaires financiers
        let query = supabaseAdmin
          .from('donations')
          .select(`
            *,
            events:event_id(id, title)
          `)
          .order('created_at', { ascending: false })

        // Filtres optionnels
        const { status, event_id, start_date, end_date } = req.query

        if (status) {
          query = query.eq('status', status)
        }

        if (event_id) {
          query = query.eq('event_id', event_id)
        }

        if (start_date) {
          query = query.gte('created_at', start_date)
        }

        if (end_date) {
          query = query.lte('created_at', end_date)
        }

        const { data: donations, error } = await query

        if (error) {
          safeLog.error('Fetch error:', error)
          return res.status(500).json({ error: 'Erreur lors de la récupération des donations.' })
        }

        // Calculer les statistiques
        let totalAmount = 0
        let completedAmount = 0
        let pendingAmount = 0
        let countByStatus = { pending: 0, completed: 0, failed: 0, refunded: 0 }

        donations.forEach(d => {
          totalAmount += parseFloat(d.amount)
          if (d.status === 'completed') {
            completedAmount += parseFloat(d.amount)
          } else if (d.status === 'pending') {
            pendingAmount += parseFloat(d.amount)
          }
          countByStatus[d.status] = (countByStatus[d.status] || 0) + 1
        })

        return res.status(200).json({
          donations,
          stats: {
            total: parseFloat(totalAmount.toFixed(2)),
            completed: parseFloat(completedAmount.toFixed(2)),
            pending: parseFloat(pendingAmount.toFixed(2)),
            count: donations.length,
            countByStatus
          }
        })

      } else {
        // Accès public : statistiques anonymisées uniquement
        const { data: completedDonations, error } = await supabaseAdmin
          .from('donations')
          .select('amount')
          .eq('status', 'completed')

        if (error) {
          return res.status(500).json({ error: 'Erreur serveur.' })
        }

        const totalCompleted = completedDonations.reduce((sum, d) => sum + parseFloat(d.amount), 0)

        return res.status(200).json({
          stats: {
            completed: parseFloat(totalCompleted.toFixed(2)),
            count: completedDonations.length
          }
        })
      }

    } catch (err) {
      safeLog.error('GET error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // POST - Créer une donation (public - formulaire de don)
  // ============================================================================
  
  if (method === 'POST') {
    try {
      const {
        donor_name,
        donor_email,
        donor_phone,
        amount,
        donation_type,
        event_id,
        payment_method,
        payment_reference,
        comms_opt_in
      } = req.body

      // Validation
      if (!donor_name || donor_name.trim() === '') {
        return res.status(400).json({ error: 'Le nom du donateur est requis.' })
      }

      if (!donor_email || donor_email.trim() === '') {
        return res.status(400).json({ error: 'L\'email du donateur est requis.' })
      }

      // Validation email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(donor_email)) {
        return res.status(400).json({ error: 'Format d\'email invalide.' })
      }

      if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Le montant doit être un nombre positif.' })
      }

      if (donation_type && !['one-time', 'monthly', 'annual'].includes(donation_type)) {
        return res.status(400).json({ error: 'Type de donation invalide.' })
      }

      // Créer la donation
      const { data: donation, error } = await supabaseAdmin
        .from('donations')
        .insert({
          donor_name: donor_name.trim(),
          donor_email: donor_email.trim().toLowerCase(),
          donor_phone: donor_phone || null,
          amount: parseFloat(amount),
          donation_type: donation_type || 'one-time',
          status: 'pending',
          event_id: event_id || null,
          payment_method: payment_method || null,
          payment_reference: payment_reference || null,
          comms_opt_in: comms_opt_in || false
        })
        .select()
        .single()

      if (error) {
        safeLog.error('Insert error:', error)
        return res.status(500).json({ error: 'Erreur lors de la création de la donation.' })
      }

      // Donation created successfully
      return res.status(201).json({ donation })

    } catch (err) {
      safeLog.error('POST error:', err)
      return res.status(500).json({ error: 'Erreur serveur.' })
    }
  }

  // ============================================================================
  // PUT - Modifier une donation (réservé gestionnaires financiers)
  // ============================================================================
  
  if (method === 'PUT') {
    try {
      // Authentification requise
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Non authentifié. Token Bearer requis.' })
      }

      const token = authHeader.replace('Bearer ', '')
      const anonClient = createAnonClient(token)
      const { data: { user }, error: authError } = await anonClient.auth.getUser()

      if (authError || !user) {
        return res.status(401).json({ error: 'Token invalide ou expiré.' })
      }

      // Vérifier profil et permissions
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const allowedRoles = ['tresorier', 'vice_tresorier', 'president', 'vice_president']
      if (!profile.is_jetc_admin && !allowedRoles.includes(profile.role)) {
        return res.status(403).json({ error: 'Accès refusé. Réservé aux gestionnaires financiers.' })
      }

      const { id, status, payment_method, payment_reference } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Le champ "id" est requis.' })
      }

      // Vérifier que la donation existe
      const { data: existingDonation, error: fetchError } = await supabaseAdmin
        .from('donations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !existingDonation) {
        return res.status(404).json({ error: 'Donation introuvable.' })
      }

      // Construire l'objet de mise à jour
      const updates = {}

      if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
        updates.status = status
      }

      if (payment_method !== undefined) {
        updates.payment_method = payment_method || null
      }

      if (payment_reference !== undefined) {
        updates.payment_reference = payment_reference || null
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour.' })
      }

      // Mettre à jour
      const { data: donation, error } = await supabaseAdmin
        .from('donations')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        safeLog.error('Update error:', error)
        return res.status(500).json({ error: 'Erreur lors de la mise à jour de la donation.' })
      }

      // Donation updated successfully
      return res.status(200).json({ donation })

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
