// pages/api/admin/users/create.js
// POST /api/admin/users/create - Créer un nouvel utilisateur (JETC admin only)

import { supabaseServer } from '../../../../lib/supabaseServer'
import { supabase } from '../../../../lib/supabaseClient'
import { secureError } from '../../../../lib/security'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Vérifier l'auth
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé' })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Non autorisé' })
    }

    // Vérifier que l'user est JETC admin
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('is_jetc_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !profile.is_jetc_admin) {
      return res.status(403).json({ error: 'Accès refusé. Seuls les admins JETC peuvent créer des utilisateurs.' })
    }

    // Récupérer les données
    const { email, first_name, last_name, role } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email requis' })
    }

    // Valider le rôle
    const validRoles = ['president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire', 'membre']
    const userRole = role && validRoles.includes(role) ? role : 'membre'

    // Créer le user dans auth.users via Admin API
    const { data: newUser, error: createError } = await supabaseServer.auth.admin.createUser({
      email,
      password: 'ASSEP1234!', // Mot de passe temporaire
      email_confirm: true, // Auto-confirmer l'email
      user_metadata: {
        first_name: first_name || '',
        last_name: last_name || '',
        must_change_password: true
      }
    })

    if (createError) {
      secureError('Error creating user:', createError)
      return res.status(500).json({ 
        error: 'Erreur lors de la création du user',
        details: createError.message
      })
    }

    if (!newUser.user) {
      return res.status(500).json({ error: 'User créé mais pas de données retournées' })
    }

    // Créer le profile correspondant (ou assurer son existence)
    const { error: profileCreateError } = await supabaseServer
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        first_name: first_name || null,
        last_name: last_name || null,
        full_name: first_name && last_name ? `${first_name} ${last_name}` : null,
        role: userRole,
        is_jetc_admin: false,
        comms_opt_in: false,
        must_change_password: true
      })

    if (profileCreateError) {
      // Si le profile existe déjà (conflit), on met à jour
      if (profileCreateError.code === '23505') {
        await supabaseServer
          .from('profiles')
          .update({
            first_name: first_name || null,
            last_name: last_name || null,
            full_name: first_name && last_name ? `${first_name} ${last_name}` : null,
            role: userRole,
            must_change_password: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', newUser.user.id)
      } else {
        secureError('Error creating profile:', profileCreateError)
      }
    }

    // ⚠️ NE JAMAIS renvoyer le password dans la réponse
    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.user.id,
        email,
        first_name,
        last_name,
        role: userRole,
        must_change_password: true
      }
    })
  } catch (error) {
    secureError('Unexpected error:', error)
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: error.message
    })
  }
}
