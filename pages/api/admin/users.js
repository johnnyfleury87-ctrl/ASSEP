/**
 * API Admin: Gestion des utilisateurs
 * GET /api/admin/users - Liste tous les utilisateurs
 * PUT /api/admin/users - Mettre à jour un utilisateur
 * DELETE /api/admin/users - Supprimer un utilisateur
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // CLIENT 1: Vérifier le token avec client ANON (ne touche pas au RLS)
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Token invalide' });
    }

    console.log('✅ User authenticated:', user.id, user.email);

    // CLIENT 2: Utiliser SERVICE ROLE pour bypass RLS (client complètement séparé)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Charger le profil du requester avec service role (bypass RLS)
    const { data: me, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role, is_jetc_admin')
      .eq('id', user.id)
      .single();

    console.log('📋 Profile query:', { me, profileError });

    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return res.status(403).json({ 
        error: 'Profile missing for auth user id: ' + user.id,
        details: profileError.message 
      });
    }

    if (!me) {
      return res.status(403).json({ 
        error: 'Profile missing for auth user id: ' + user.id 
      });
    }

    // Vérifier que l'utilisateur est JETC admin
    const isAdmin = me.is_jetc_admin || ['president', 'vice_president'].includes(me.role);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Forbidden (not JETC admin)' });
    }

    console.log('✅ Admin verified:', me.email, me.role);

    // ========================================================================
    // GET: Liste des utilisateurs
    // ========================================================================
    if (req.method === 'GET') {
      const { data: allProfiles, error: listError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, first_name, last_name, phone, role, is_jetc_admin, must_change_password, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('❌ List error:', listError);
        return res.status(500).json({ error: listError.message });
      }

      console.log('✅ Loaded', allProfiles?.length || 0, 'profiles');
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

      // Champs autorisés à mettre à jour
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

      // Si changement de rôle, ajouter traçabilité
      if (updates.role) {
        filteredUpdates.role_approved_by = me.id;
        filteredUpdates.role_approved_at = new Date().toISOString();
      }

      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(filteredUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Profil mis à jour',
        profile: updatedProfile
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

      // Vérifier qu'on ne supprime pas le dernier JETC admin
      if (profile.is_jetc_admin) {
        const { data: jetcAdmins } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('is_jetc_admin', true);

        if (jetcAdmins && jetcAdmins.length === 1 && jetcAdmins[0].id === userId) {
          return res.status(400).json({ 
            error: 'Impossible de supprimer le dernier admin JETC' 
          });
        }
      }

      // Supprimer le user dans auth.users (le profil sera supprimé via CASCADE)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        return res.status(400).json({ error: deleteError.message });
      }

      return res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Erreur API users:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
