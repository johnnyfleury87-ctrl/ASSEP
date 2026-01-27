import { supabaseAdmin } from '../../../lib/supabaseServer';
import safeLog from '../../../lib/logger';

/**
 * API Admin: Réinitialiser le mot de passe d'un utilisateur
 * POST /api/admin/reset-password
 * 
 * Body: {
 *   userId: string
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Vérifier que l'utilisateur est JETC admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_jetc_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !profile.is_jetc_admin) {
      return res.status(403).json({ error: 'Seul JETC admin peut réinitialiser les mots de passe' });
    }

    // Récupérer userId
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // IMPORTANT: Password temporaire par défaut
    const temporaryPassword = 'ASSEP1234!';

    // Réinitialiser le password dans auth.users
    const { data: updatedUser, error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: temporaryPassword }
    );

    if (resetError) {
      safeLog.error('Erreur reset password:', resetError);
      return res.status(400).json({ 
        error: resetError.message || 'Erreur lors de la réinitialisation' 
      });
    }

    // Mettre à jour le profil pour forcer le changement de mot de passe
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        must_change_password: true,
        password_changed_at: null
      })
      .eq('id', userId);

    if (updateError) {
      safeLog.error('Erreur mise à jour profil:', updateError);
    }

    safeLog.auth('Password reset', { userId });

    return res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Un email a été envoyé à l\'utilisateur.'
    });

  } catch (error) {
    safeLog.error('Erreur API reset password:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
