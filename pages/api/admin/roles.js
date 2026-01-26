// pages/api/admin/roles.js
// PUT /api/admin/roles - Modifier le rôle d'un utilisateur (président/vice uniquement)

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { createServerSupabaseClient } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, role } = req.body

    if (!userId || !role) {
      return res.status(400).json({ error: 'Missing userId or role' })
    }

    const validRoles = ['president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire', 'membre']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Vérifier l'authentification de l'utilisateur qui fait la requête
    const supabase = createServerSupabaseClient({ req, res })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Vérifier que l'utilisateur est président ou vice-président
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (!['president', 'vice_president'].includes(profile.role)) {
      return res.status(403).json({ error: 'Only president or vice-president can modify roles' })
    }

    // Mettre à jour le rôle
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return res.status(500).json({ error: 'Failed to update role' })
    }

    return res.status(200).json({ success: true, profile: updatedProfile })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
