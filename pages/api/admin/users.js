/**
 * API Admin: Gestion des utilisateurs
 * GET /api/admin/users - Liste tous les utilisateurs
 * PUT /api/admin/users - Mettre à jour un utilisateur
 * DELETE /api/admin/users - Supprimer un utilisateur
 */
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { createAnonClient } from '../../../lib/supabaseAnonServer';

export default async function handler(req, res) {
  try {
    // 1. Extraire le token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Vérifier le token avec client ANON
    const anonClient = createAnonClient(token);
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    console.log('✅ auth ok userId=', user.id);

    // 3. Charger le profil avec client ADMIN (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, is_jetc_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ 
        error: 'Profile missing for user ' + user.id 
      });
    }

    console.log('✅ profile loaded role=', profile.role, 'is_jetc_admin=', profile.is_jetc_admin);

    // 4. Vérifier l'autorisation
    if (!profile.is_jetc_admin && !['president', 'vice_president'].includes(profile.role)) {
      return res.status(403).json({ error: 'User not allowed' });
    }

    // ========================================================================
    // GET: Liste des utilisateurs
    // ========================================================================
    if (req.method === 'GET') {
      const { data: allProfiles, error: listError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, last_name, phone, role, is_jetc_admin, must_change_password, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (listError) {
        return res.status(500).json({ error: listError.message });
      }

      console.log('✅ admin action=list_users ok count=', allProfiles?.length || 0);
      return res.status(200).json({ users: allProfiles || [] });
    }

    // ========================================================================
    // PUT: Mettre à jour un utilisateur
    // ========================================================================
    if (req.method === 'PUT') {
      const { userId, updates } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId requis' });
      }

      const allowedFields = [
        'first_name',
        'last_name',
        'phone',
        'role',
        'comms_opt_in',
        'must_change_password'
      ];

      const filteredUpdates = {};
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      if (updates.role) {
        filteredUpdates.role_approved_by = profile.id;
        filteredUpdates.role_approved_at = new Date().toISOString();
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      console.log('✅ admin action=update_user ok userId=', userId);
      return res.status(200).json({
        success: true,
        message: 'Profil mis à jour',
        profile: updated
      });
    }

    // ========================================================================
    // DELETE: Supprimer un utilisateur
    // ========================================================================
    if (req.method === 'DELETE') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId requis' });
      }

      const { error: deleteProfileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteProfileError) {
        return res.status(500).json({ error: deleteProfileError.message });
      }

      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteAuthError) {
        return res.status(500).json({ error: deleteAuthError.message });
      }

      console.log('✅ admin action=delete_user ok userId=', userId);
      return res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('❌ API error:', error.message);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
