// pages/api/admin/bureau.js
// GET, POST, PUT, DELETE /api/admin/bureau - Gérer les membres du bureau

import { supabaseAdmin } from '../../../lib/supabaseServer'
import { createServerSupabaseClient } from '../../../lib/supabaseServer'

async function checkAdmin(req, res) {
  const supabase = createServerSupabaseClient({ req, res })
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false, userId: null }
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['president', 'vice_president'].includes(profile.role)) {
    return { authorized: false, userId: user.id }
  }

  return { authorized: true, userId: user.id }
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
      const { title, name, photoUrl, sortOrder, isVisible } = req.body

      if (!title) {
        return res.status(400).json({ error: 'Missing title' })
      }

      const { data, error } = await supabaseAdmin
        .from('bureau_members')
        .insert({
          title,
          name: name || null,
          photo_url: photoUrl || null,
          sort_order: sortOrder || 100,
          is_visible: isVisible !== false,
          created_by: userId
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
      const { id, title, name, photoUrl, sortOrder, isVisible } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Missing id' })
      }

      const { data, error } = await supabaseAdmin
        .from('bureau_members')
        .update({
          title: title || undefined,
          name: name !== undefined ? name : undefined,
          photo_url: photoUrl !== undefined ? photoUrl : undefined,
          sort_order: sortOrder !== undefined ? sortOrder : undefined,
          is_visible: isVisible !== undefined ? isVisible : undefined,
          updated_by: userId,
          updated_at: new Date().toISOString()
        })
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
