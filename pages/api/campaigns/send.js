// pages/api/campaigns/send.js
// POST /api/campaigns/send - Envoyer une campagne email aux opt-in

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { createAnonClient } from '../../../lib/supabaseAnonServer'
import { sendEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // ========================================================================
    // SÉCURITÉ: Vérifier l'authentification et les permissions
    // ========================================================================
    
    // 1. Extraire le token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    const token = authHeader.replace('Bearer ', '')

    // 2. Vérifier le token avec client ANON
    const anonClient = createAnonClient(token)
    const { data: { user }, error: authError } = await anonClient.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' })
    }

    // 3. Charger le profil avec client ADMIN (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, is_jetc_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profil introuvable' })
    }

    // 4. Vérifier que l'utilisateur a le droit d'envoyer des campagnes
    const allowedRoles = ['president', 'vice_president', 'secretaire', 'vice_secretaire']
    if (!profile.is_jetc_admin && !allowedRoles.includes(profile.role)) {
      return res.status(403).json({ 
        error: 'Accès refusé. Seuls président, vice, secrétaire et vice-secrétaire peuvent envoyer des campagnes.' 
      })
    }

    // Auth successful - role verified

    // ========================================================================
    // LOGIQUE D'ENVOI
    // ========================================================================

    const { campaignId } = req.body

    if (!campaignId) {
      return res.status(400).json({ error: 'Missing campaignId' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Vérifier la campagne
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Campaign already sent' })
    }

    // Récupérer tous les utilisateurs qui ont opt-in
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('comms_opt_in', true)

    if (profilesError) {
      return res.status(500).json({ error: 'Failed to fetch recipients' })
    }

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ error: 'No recipients with opt-in' })
    }

    // Récupérer les bénévoles qui ont opt-in (inscrits aux événements)
    const { data: volunteers, error: volunteersError } = await supabaseAdmin
      .from('signups')
      .select('email, first_name, last_name')
      .eq('comms_opt_in', true)
      .eq('status', 'confirmed')

    // Combiner et dédupliquer les emails
    const allRecipients = new Map()
    
    profiles.forEach(p => {
      if (p.email) allRecipients.set(p.email, p.full_name || p.email)
    })
    
    if (!volunteersError && volunteers) {
      volunteers.forEach(v => {
        if (v.email && !allRecipients.has(v.email)) {
          allRecipients.set(v.email, `${v.first_name} ${v.last_name}`)
        }
      })
    }

    // Envoyer les emails
    let sentCount = 0
    let failedCount = 0

    for (const [email, name] of allRecipients.entries()) {
      const result = await sendEmail({
        to: email,
        subject: campaign.subject,
        html: campaign.body_html,
        campaignId: campaign.id
      })

      if (result.success) {
        sentCount++
      } else {
        failedCount++
      }
    }

    // Marquer la campagne comme envoyée
    await supabaseAdmin
      .from('email_campaigns')
      .update({
        status: 'sent',
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    // Campaign sent successfully

    return res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      totalRecipients: allRecipients.size
    })

  } catch (error) {
    safeLog.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
