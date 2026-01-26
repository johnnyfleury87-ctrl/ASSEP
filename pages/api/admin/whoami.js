/**
 * API Debug: Qui suis-je ?
 * GET /api/admin/whoami
 */
import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { createAnonClient } from '../../../lib/supabaseAnonServer';

export default async function handler(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Vérifier le token
    const anonClient = createAnonClient(token);
    const { data: { user }, error: authError } = await anonClient.auth.getUser();

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Charger le profil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, first_name, last_name, role, is_jetc_admin, must_change_password')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ 
        userId: user.id,
        email: user.email,
        error: 'Profile not found'
      });
    }

    return res.status(200).json({
      userId: user.id,
      email: profile.email,
      name: `${profile.first_name} ${profile.last_name}`,
      role: profile.role,
      is_jetc_admin: profile.is_jetc_admin,
      must_change_password: profile.must_change_password
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
