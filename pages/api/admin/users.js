// pages/api/admin/users.js
// Liste tous les utilisateurs (profiles) - admin only

import { supabaseServer } from '../../../lib/supabaseServer'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier l'auth du user
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Non autorisé' })
    }

    // Vérifier que l'user est president ou vice_president
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    if (!['president', 'vice_president'].includes(profile.role)) {
      return res.status(403).json({ error: 'Seuls le président et vice-président peuvent accéder à cette ressource' })
    }

    // Récupérer tous les profiles
    const { data: users, error } = await supabaseServer
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return res.status(500).json({ error: 'Erreur serveur' })
    }

    return res.status(200).json({ users })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
