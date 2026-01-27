// pages/api/admin/bureau.js
// GET, POST, PUT, DELETE /api/admin/bureau - Gérer les membres du bureau

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { createServerSupabaseClient } from '../../../lib/supabaseServer'

async function checkAdmin(req, res) {
  // Récupérer le token depuis l'Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader) {
    console.error('❌ No authorization header')
    return { authorized: false, userId: null }
  }

  const token = authHeader.replace('Bearer ', '')
  
  // Utiliser supabaseAdmin pour vérifier le token
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    console.error('❌ Auth error:', authError?.message || 'No user')
    return { authorized: false, userId: null }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role, is_jetc_admin')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('❌ Profile error:', profileError.message)
    return { authorized: false, userId: user.id }
  }

  if (!profile) {
    console.error('❌ No profile found for user:', user.id)
    return { authorized: false, userId: user.id }
  }

  console.log('✅ User profile:', { userId: user.id, role: profile.role, isJetcAdmin: profile.is_jetc_admin })

  // Autoriser les présidents, vice-présidents ET JETC admins
  const isAuthorized = profile.is_jetc_admin || ['president', 'vice_president'].includes(profile.role)
  
  if (!isAuthorized) {
    console.error('❌ User not authorized. Role:', profile.role, 'isJetcAdmin:', profile.is_jetc_admin)
  }

  return { authorized: isAuthorized, userId: user.id }
}

export default async function handler(req, res) {
  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    // GET - Lire tous les membres du bureau
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('bureau_members')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) {
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
        console.error('Insert error:', error)
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
        console.error('Update error:', error)
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
        console.error('Delete error:', error)
        return res.status(500).json({ error: 'Failed to delete bureau member' })
      }

      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })

  } catch (error) {
    console.error('API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
