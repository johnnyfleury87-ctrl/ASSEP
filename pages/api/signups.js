// pages/api/signups.js
// POST /api/signups - Inscription bénévole avec email de confirmation

import { supabaseAdmin } from '../../lib/supabaseServer'
import { sendEmail, volunteerConfirmationEmail } from '../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      eventId, 
      shiftId, 
      firstName, 
      lastName, 
      email, 
      phone, 
      commsOptIn 
    } = req.body

    // Validation
    if (!eventId || !shiftId || !firstName || !lastName || !email) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Vérifier que l'événement et le créneau existent
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, name, status, signups_enabled')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (event.status !== 'published') {
      return res.status(400).json({ error: 'Event is not open for signups' })
    }

    if (!event.signups_enabled) {
      return res.status(400).json({ error: 'Signups are not enabled for this event' })
    }

    const { data: shift, error: shiftError } = await supabaseAdmin
      .from('event_shifts')
      .select('*, event_tasks(label)')
      .eq('id', shiftId)
      .single()

    if (shiftError || !shift) {
      return res.status(404).json({ error: 'Shift not found' })
    }

    // Insérer l'inscription (le trigger check_shift_capacity vérifie la capacité)
    const { data: signup, error: signupError } = await supabaseAdmin
      .from('volunteer_signups')
      .insert({
        event_id: eventId,
        shift_id: shiftId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        comms_opt_in: commsOptIn === true,
        status: 'confirmed'
      })
      .select()
      .single()

    if (signupError) {
      safeLog.error('Signup error:', signupError)
      
      // Gérer l'erreur de capacité
      if (signupError.message?.includes('complet')) {
        return res.status(400).json({ error: 'Ce créneau est complet' })
      }
      
      // Gérer l'erreur de doublon
      if (signupError.code === '23505') {
        return res.status(400).json({ error: 'Vous êtes déjà inscrit à ce créneau' })
      }
      
      return res.status(500).json({ error: 'Failed to create signup' })
    }

    // Préparer les détails du créneau pour l'email
    const shiftStart = new Date(shift.starts_at).toLocaleString('fr-FR')
    const shiftEnd = new Date(shift.ends_at).toLocaleString('fr-FR')
    const shiftDetails = `${shift.event_tasks.label}\n${shiftStart} - ${shiftEnd}`

    // Envoyer l'email de confirmation
    const emailTemplate = volunteerConfirmationEmail({
      firstName,
      lastName,
      eventTitle: event.name,
      shiftDetails
    })

    await sendEmail({
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    })

    return res.status(201).json({ 
      success: true, 
      signup,
      message: 'Inscription confirmée. Un email de confirmation vous a été envoyé.' 
    })

  } catch (error) {
    safeLog.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
