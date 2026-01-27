// pages/api/admin/bureau.js
// GET, POST, PUT, DELETE /api/admin/bureau - Gérer les membres du bureau

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { createServerSupabaseClient } from '../../../lib/supabaseServer'
import safeLog from '../../../lib/logger'

async function checkAdmin(req, res) {
  // Récupérer le token depuis l'Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader) {
    safeLog.error('No authorization header')
    return { authorized: false, userId: null }
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Utiliser supabaseAdmin pour vérifier le token
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    safeLog.auth('Auth error', { error: authError?.message || 'No user' })
    return { authorized: false, userId: null }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, is_jetc_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    safeLog.error('Profile error:', profileError.message)
    return { authorized: false, userId: user.id }
  }

  if (!profile) {
    safeLog.error('No profile found for user')
    return { authorized: false, userId: user.id }
  }

  safeLog.auth('User profile loaded', { userId: user.id, role: profile.role, isJetcAdmin: profile.is_jetc_admin })

  // Autoriser les présidents, vice-présidents ET JETC admins
  const isAuthorized = profile.is_jetc_admin || ['president', 'vice_president'].includes(profile.role)
  
  if (!isAuthorized) {
    safeLog.error('User not authorized', { role: profile.role })
  }

  return { authorized: isAuthorized, userId: user.id }
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // GET - Lire tous les membres du bureau (public)
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('bureau_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        safeLog.error('Failed to fetch bureau members:', error.message)
        return res.status(500).json({ error: 'Failed to fetch bureau members' })
      }

      return res.status(200).json({ members: data })
    }

    // Pour POST, PUT, DELETE: vérifier les permissions admin
    const { authorized, userId } = await checkAdmin(req, res)
    if (!authorized) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    // POST - Créer un membre du bureau
    if (req.method === 'POST') {
      const { role, name, photoUrl, bio, email, phone, displayOrder, isActive } = req.body

      if (!role || !name) {
        return res.status(400).json({ error: 'Missing required fields: role and name' })
      }

      const { data, error } = await supabaseAdmin
        .from('bureau_members')
        .insert({
          role,
          name,
          photo_url: photoUrl || null,
          bio: bio || null,
          email: email || null,
          phone: phone || null,
          display_order: displayOrder || 0,
          is_active: isActive !== false
        })
        .select()
        .single()

      if (error) {
        safeLog.error('Insert error:', error)
        return res.status(500).json({ error: 'Failed to create bureau member' })
      }

      return res.status(201).json({ member: data })
    }

    // PUT - Mettre à jour un membre du bureau
    if (req.method === 'PUT') {
      const { id, role, name, photoUrl, bio, email, phone, displayOrder, isActive } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing id' })
      }

      const updateData = {}
      if (role !== undefined) updateData.role = role
      if (name !== undefined) updateData.name = name
      if (photoUrl !== undefined) updateData.photo_url = photoUrl
      if (bio !== undefined) updateData.bio = bio
      if (email !== undefined) updateData.email = email
      if (phone !== undefined) updateData.phone = phone
      if (displayOrder !== undefined) updateData.display_order = displayOrder
      if (isActive !== undefined) updateData.is_active = isActive
      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabaseAdmin
        .from('bureau_members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        safeLog.error('Update error:', error)
        return res.status(500).json({ error: 'Failed to update bureau member' })
      }

      return res.status(200).json({ member: data })
    }

    // DELETE - Supprimer un membre du bureau
    if (req.method === 'DELETE') {
      const { id } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing id' })
      }

      const { error } = await supabaseAdmin
        .from('bureau_members')
        .delete()
        .eq('id', id)

      if (error) {
        safeLog.error('Delete error:', error)
        return res.status(500).json({ error: 'Failed to delete bureau member' })
      }

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    safeLog.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
