// lib/email.js
// Service d'envoi d'emails avec Resend + logging

import { Resend } from 'resend'
import { supabaseAdmin } from './supabaseServer'
import safeLog from './logger'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const emailFrom = process.env.EMAIL_FROM || 'ASSEP <noreply@example.com>'

/**
 * Envoie un email et log dans email_logs
 * @param {Object} params
 * @param {string} params.to - Email destinataire
 * @param {string} params.subject - Sujet de l'email
 * @param {string} params.html - Corps HTML de l'email
 * @param {string} [params.campaignId] - ID de la campagne (optionnel)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendEmail({ to, subject, html, campaignId = null }) {
  if (!resend) {
    safeLog.error('Resend API key not configured')
    await logEmail({ to, campaignId, status: 'failed', error: 'Resend API key not configured' })
    return { success: false, error: 'Email service not configured' }
  }

  if (!supabaseAdmin) {
    safeLog.error('Supabase admin client not configured')
    return { success: false, error: 'Database logging not available' }
  }

  try {
    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [to],
      subject,
      html
    })

    if (error) {
      safeLog.error('Resend error:', error)
      await logEmail({ to, campaignId, status: 'failed', error: error.message })
      return { success: false, error: error.message }
    }

    // Logger le succès
    await logEmail({ 
      to, 
      campaignId, 
      status: 'sent', 
      providerMessageId: data?.id 
    })

    return { success: true }
  } catch (error) {
    safeLog.error('Send email error:', error)
    await logEmail({ to, campaignId, status: 'failed', error: error.message })
    return { success: false, error: error.message }
  }
}

/**
 * Enregistre un log d'envoi d'email
 * @param {Object} params
 */
async function logEmail({ to, campaignId, status, error = null, providerMessageId = null }) {
  if (!supabaseAdmin) return

  try {
    await supabaseAdmin
      .from('email_logs')
      .insert({
        campaign_id: campaignId,
        to_email: to,
        status,
        error_message: error,
        provider_message_id: providerMessageId,
        sent_at: status === 'sent' ? new Date().toISOString() : null
      })
  } catch (err) {
    safeLog.error('Failed to log email:', err)
  }
}

/**
 * Template email de confirmation d'inscription bénévole
 */
export function volunteerConfirmationEmail({ firstName, lastName, eventTitle, shiftDetails }) {
  const subject = `Confirmation d'inscription - ${eventTitle}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .shift-info { background-color: #fff; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Merci pour votre engagement !</h1>
          </div>
          <div class="content">
            <p>Bonjour ${firstName} ${lastName},</p>
            
            <p>Nous vous confirmons votre inscription en tant que bénévole pour l'événement :</p>
            
            <div class="shift-info">
              <strong>${eventTitle}</strong><br>
              ${shiftDetails}
            </div>
            
            <p>Nous vous remercions pour votre précieuse aide et votre soutien à l'ASSEP.</p>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <p>À bientôt !<br>
            <strong>L'équipe ASSEP</strong></p>
          </div>
          <div class="footer">
            <p>École Hubert Reeves - Champagnole<br>
            Association ASSEP</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  return { subject, html }
}
