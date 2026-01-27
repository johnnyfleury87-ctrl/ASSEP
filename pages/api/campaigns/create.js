// pages/api/campaigns/create.js
// POST /api/campaigns/create - Créer une nouvelle campagne email (brouillon)

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { createAnonClient } from '../../../lib/supabaseAnonServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ========================================================================
    // SÉCURITÉ: Vérifier l'authentification et les permissions
    // ========================================================================
    
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const token = authHeader.replace('Bearer ', '')
    const anonClient = createAnonClient(token)
    const { data: { user }, error: authError } = await anonClient.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, is_jetc_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profil introuvable' })
    }

    // Vérifier les permissions (président, vice, secrétaire, vice-secrétaire, JETC)
    const allowedRoles = ['president', 'vice_president', 'secretaire', 'vice_secretaire']
    if (!profile.is_jetc_admin && !allowedRoles.includes(profile.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé. Seuls président, vice, secrétaire et vice-secrétaire peuvent créer des campagnes.' 
      })
    }

    console.log('✅ Auth OK - Creating campaign for:', profile.email)

    // ========================================================================
    // VALIDATION DES DONNÉES
    // ========================================================================

    const { name, subject, content, recipient_type, recipient_emails } = req.body

    // Champs requis
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Le nom de la campagne est requis' })
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Le sujet de l\'email est requis' })
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Le contenu de l\'email est requis' })
    }

    // Validation recipient_type
    const validTypes = ['all', 'members', 'custom']
    const finalRecipientType = recipient_type || 'all'
    
    if (!validTypes.includes(finalRecipientType)) {
      return res.status(400).json({ 
        error: `Type de destinataires invalide. Valeurs autorisées: ${validTypes.join(', ')}` 
      })
    }

    // Si custom, vérifier que recipient_emails est fourni
    if (finalRecipientType === 'custom') {
      if (!recipient_emails || !Array.isArray(recipient_emails) || recipient_emails.length === 0) {
        return res.status(400).json({ 
          error: 'Une liste d\'emails est requise pour le type "custom"' 
        })
      }

      // Valider les emails
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = recipient_emails.filter(email => !emailRegex.test(email))
      if (invalidEmails.length > 0) {
        return res.status(400).json({ 
          error: `Emails invalides: ${invalidEmails.join(', ')}` 
        })
      }
    }

    // ========================================================================
    // CRÉATION DE LA CAMPAGNE
    // ========================================================================

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const { data: campaign, error: createError } = await supabaseAdmin
      .from('email_campaigns')
      .insert({
        name: name.trim(),
        subject: subject.trim(),
        content: content.trim(),
        recipient_type: finalRecipientType,
        recipient_emails: finalRecipientType === 'custom' ? recipient_emails : null,
        status: 'draft',
        sent_count: 0,
        failed_count: 0,
        created_by: profile.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating campaign:', createError)
      return res.status(500).json({ error: 'Erreur lors de la création de la campagne' })
    }

    console.log('✅ Campaign created - ID:', campaign.id, 'Name:', campaign.name)

    return res.status(201).json({ 
      success: true,
      campaign 
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
