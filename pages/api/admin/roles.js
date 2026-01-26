// pages/api/admin/roles.js
// POST /api/admin/roles - Assigner/modifier le rôle d'un utilisateur (président/vice uniquement)

import { supabaseServer } from '../../../lib/supabaseServer'
import { supabase } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
      return res.status(403).json({ error: 'Seuls le président et vice-président peuvent modifier les rôles' })
    }

    // Récupérer les données
    const { user_id, role } = req.body

    if (!user_id || !role) {
      return res.status(400).json({ error: 'user_id et role requis' })
    }

    // Valider le rôle
    const validRoles = ['president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire', 'membre']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Rôle invalide. Rôles autorisés: ${validRoles.join(', ')}` })
    }

    // Empêcher de se retirer le rôle de president si on est le seul
    if (user_id === user.id && profile.role === 'president' && role !== 'president') {
      const { data: otherPresidents, error: checkError } = await supabaseServer
        .from('profiles')
        .select('id')
        .eq('role', 'president')
        .neq('id', user.id)

      if (checkError) {
        return res.status(500).json({ error: 'Erreur lors de la vérification' })
      }

      if (!otherPresidents || otherPresidents.length === 0) {
        return res.status(400).json({ error: 'Impossible de retirer votre rôle de président. Assignez d\'abord un autre président.' })
      }
    }

    // Mettre à jour le rôle (utiliser service role pour bypass RLS)
    const { data: updatedProfile, error: updateError } = await supabaseServer
      .from('profiles')
      .update({ role })
      .eq('id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating role:', updateError)
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du rôle' })
    }

    return res.status(200).json({ 
      message: 'Rôle mis à jour avec succès',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
