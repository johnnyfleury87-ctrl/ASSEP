// pages/api/events/[id]/volunteers.js
// API pour récupérer les bénévoles d'un événement (avec admin pour bypass RLS)

import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { supabase } from '../../../../lib/supabaseClient'
import safeLog from '../../../../lib/logger'

export default async function handler(req, res) {
  const { method } = req
  const { id } = req.query // event_id

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    // Vérifier que l'utilisateur est membre du bureau
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, is_jetc_admin')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return res.status(403).json({ error: 'Profil non trouvé' })
    }

    const isBureau = profile.is_jetc_admin || 
      ['president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire'].includes(profile.role)

    if (!isBureau) {
      return res.status(403).json({ error: 'Accès réservé au bureau' })
    }

    // Récupérer les bénévoles avec supabaseAdmin (bypass RLS)
    const { data: volunteers, error: volunteersError } = await supabaseAdmin
      .from('event_volunteers')
      .select(`
        id,
        event_id,
        profile_id,
        shift_id,
        status,
        notes,
        created_at,
        profiles!inner (
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('event_id', id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })

    if (volunteersError) {
      safeLog.error('Error fetching volunteers:', volunteersError)
      return res.status(500).json({ error: volunteersError.message })
    }

    return res.status(200).json({
      volunteers: volunteers || [],
      count: volunteers?.length || 0
    })

  } catch (error) {
    safeLog.error('API Error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
