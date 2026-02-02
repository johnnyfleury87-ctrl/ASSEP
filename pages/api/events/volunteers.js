// pages/api/events/volunteers.js
// API pour l'inscription et la gestion des bénévoles

import { supabase } from '../../../lib/supabaseClient'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import safeLog from '../../../lib/logger'

export default async function handler(req, res) {
  const { method } = req

  // ============================================================================
  // GET - Récupérer les inscriptions bénévoles d'un événement
  // ============================================================================
  
  if (method === 'GET') {
    const { eventId } = req.query

    if (!eventId) {
      return res.status(400).json({ error: 'eventId requis' })
    }

    try {
      // Compter les bénévoles inscrits
      const { count: volunteersCount, error: countError } = await supabase
        .from('event_volunteers')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .is('shift_id', null)
        .eq('status', 'confirmed')

      if (countError) {
        safeLog.error('Count error:', countError)
        return res.status(500).json({ error: 'Erreur lors du comptage' })
      }

      // Récupérer l'objectif depuis la table events
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('volunteer_target')
        .eq('id', eventId)
        .single()

      if (eventError) {
        safeLog.error('Event error:', eventError)
        return res.status(500).json({ error: 'Événement introuvable' })
      }

      return res.status(200).json({
        current: volunteersCount || 0,
        target: event?.volunteer_target || 0,
        remaining: Math.max((event?.volunteer_target || 0) - (volunteersCount || 0), 0)
      })

    } catch (err) {
      safeLog.error('GET error:', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // ============================================================================
  // POST - S'inscrire comme bénévole
  // ============================================================================
  
  if (method === 'POST') {
    try {
      const { eventId } = req.body

      if (!eventId) {
        return res.status(400).json({ error: 'eventId requis' })
      }

      // Vérifier authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        req.headers.authorization?.replace('Bearer ', '')
      )

      if (authError || !user) {
        return res.status(401).json({ error: 'Non authentifié' })
      }

      // Vérifier qu'il existe un profil
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        return res.status(403).json({ error: 'Profil introuvable' })
      }

      // Vérifier qu'il n'est pas déjà inscrit
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('event_volunteers')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('profile_id', user.id)
        .is('shift_id', null)
        .single()

      if (existing && existing.status === 'confirmed') {
        return res.status(400).json({ error: 'Vous êtes déjà inscrit comme bénévole' })
      }

      // Si déjà inscrit mais annulé, réactiver
      if (existing && existing.status === 'cancelled') {
        const { error: updateError } = await supabaseAdmin
          .from('event_volunteers')
          .update({ status: 'confirmed' })
          .eq('id', existing.id)

        if (updateError) {
          safeLog.error('Update error:', updateError)
          return res.status(500).json({ error: updateError.message })
        }

        return res.status(200).json({ 
          message: 'Inscription réactivée avec succès !',
          volunteerId: existing.id
        })
      }

      // Créer la nouvelle inscription
      const { data: volunteer, error: insertError } = await supabaseAdmin
        .from('event_volunteers')
        .insert({
          event_id: eventId,
          profile_id: user.id,
          shift_id: null, // Inscription générale
          status: 'confirmed'
        })
        .select()
        .single()

      if (insertError) {
        safeLog.error('Insert error:', insertError)
        
        // Gérer l'erreur de limite atteinte
        if (insertError.message.includes('Limite atteinte')) {
          return res.status(400).json({ error: 'Désolé, l\'objectif de bénévoles est atteint' })
        }
        
        return res.status(500).json({ error: insertError.message })
      }

      return res.status(201).json({ 
        message: 'Inscription réussie ! Merci pour votre aide 🎉',
        volunteerId: volunteer.id
      })

    } catch (err) {
      safeLog.error('POST error:', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  // ============================================================================
  // DELETE - Se désinscrire
  // ============================================================================
  
  if (method === 'DELETE') {
    try {
      const { eventId } = req.body

      if (!eventId) {
        return res.status(400).json({ error: 'eventId requis' })
      }

      // Vérifier authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        req.headers.authorization?.replace('Bearer ', '')
      )

      if (authError || !user) {
        return res.status(401).json({ error: 'Non authentifié' })
      }

      // Trouver l'inscription
      const { data: volunteer, error: findError } = await supabaseAdmin
        .from('event_volunteers')
        .select('id')
        .eq('event_id', eventId)
        .eq('profile_id', user.id)
        .is('shift_id', null)
        .eq('status', 'confirmed')
        .single()

      if (findError || !volunteer) {
        return res.status(404).json({ error: 'Inscription introuvable' })
      }

      // Marquer comme annulée
      const { error: updateError } = await supabaseAdmin
        .from('event_volunteers')
        .update({ status: 'cancelled' })
        .eq('id', volunteer.id)

      if (updateError) {
        safeLog.error('Update error:', updateError)
        return res.status(500).json({ error: updateError.message })
      }

      return res.status(200).json({ message: 'Désinscription réussie' })

    } catch (err) {
      safeLog.error('DELETE error:', err)
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  }

  return res.status(405).json({ error: `Méthode ${method} non autorisée` })
}
