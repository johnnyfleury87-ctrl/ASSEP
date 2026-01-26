// pages/api/campaigns/send.js
// POST /api/campaigns/send - Envoyer une campagne email aux opt-in

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { sendEmail } from '../../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
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
      .from('volunteer_signups')
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
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    return res.status(200).json({
      success: true,
      sentCount,
      failedCount,
      totalRecipients: allRecipients.size
    })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
