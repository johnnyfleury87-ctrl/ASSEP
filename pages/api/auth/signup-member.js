// pages/api/auth/signup-member.js
// API pour inscription d'un nouveau membre avec consentement RGPD

import { supabase } from '../../../lib/supabaseAdmin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  try {
    const { email, password, firstName, lastName, phone, volunteerConsent } = req.body

    // Validation
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ 
        error: 'Tous les champs sont obligatoires (email, password, firstName, lastName, phone)' 
      })
    }

    if (!volunteerConsent) {
      return res.status(400).json({ 
        error: 'Le consentement RGPD est obligatoire' 
      })
    }

    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmer l'email (pas de vérification par email)
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ error: 'Cet email est déjà utilisé' })
      }
      
      return res.status(500).json({ error: authError.message })
    }

    // Créer le profil (normalement créé par trigger, mais on s'assure)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: 'membre',
        volunteer_consent_given: volunteerConsent,
        volunteer_consent_date: volunteerConsent ? new Date().toISOString() : null,
        must_change_password: false // Pas besoin de changer le mot de passe
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Essayer de supprimer l'utilisateur créé
      await supabase.auth.admin.deleteUser(authData.user.id)
      return res.status(500).json({ error: 'Erreur lors de la création du profil' })
    }

    return res.status(201).json({
      success: true,
      message: 'Compte membre créé avec succès',
      userId: authData.user.id
    })

  } catch (error) {
    console.error('Signup error:', error)
    return res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' })
  }
}
