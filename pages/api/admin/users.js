/**
 * API Admin: Gestion des utilisateurs
 * GET /api/admin/users - Liste tous les utilisateurs
 * PUT /api/admin/users - Mettre à jour un utilisateur
 * DELETE /api/admin/users - Supprimer un utilisateur
 */
import { supabaseAdmin } from '../../../lib/supabaseServer';

export default async function handler(req, res) {
  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier le token ET récupérer l'utilisateur
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Utiliser supabaseAdmin avec service role pour contourner RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_jetc_admin, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return res.status(403).json({ error: 'Profil non trouvé: ' + profileError.message });
    }

    if (!profile) {
      return res.status(403).json({ error: 'Profil non trouvé - aucune donnée retournée' });
    }

    const isAdmin = profile.is_jetc_admin || ['president', 'vice_president'].includes(profile.role);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // ========================================================================
    // GET: Liste des utilisateurs
    // ========================================================================
    if (req.method === 'GET') {
      const { data: profiles, error: listError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) {
        return res.status(500).json({ error: listError.message });
      }

      return res.status(200).json({ users: profiles });
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
        filteredUpdates.role_approved_by = user.id;
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
