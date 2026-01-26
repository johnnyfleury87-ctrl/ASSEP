/**
 * API JETC: Créer un nouvel utilisateur
 * POST /api/admin/users/create
 * 
 * Body: {
 *   email: string,
 *   firstName: string,
 *   lastName: string,
 *   role: string,
 *   phone?: string
 * }
 */
import { supabaseAdmin } from '../../../../lib/supabaseServer';

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
      .select('is_jetc_admin, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profil non trouvé' });
    }

    if (!profile.is_jetc_admin && !['president', 'vice_president'].includes(profile.role)) {
      return res.status(403).json({ error: 'Accès refusé - JETC admin requis' });
    }

    // Récupérer les données du body
    const { email, firstName, lastName, role, phone } = req.body;

    // Validation
    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        error: 'Champs requis: email, firstName, lastName, role' 
      });
    }

    const validRoles = [
      'president',
      'vice_president',
      'tresorier',
      'vice_tresorier',
      'secretaire',
      'vice_secretaire',
      'membre'
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: `Rôle invalide. Valeurs acceptées: ${validRoles.join(', ')}` 
      });
    }

    // IMPORTANT: Password temporaire par défaut
    const temporaryPassword = 'ASSEP1234!';

    // Créer l'utilisateur dans auth.users avec auto-confirm
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: temporaryPassword,
      email_confirm: true, // AUTO-CONFIRM - pas de vérification email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    });

    if (createError) {
      console.error('Erreur création user:', createError);
      return res.status(400).json({ 
        error: createError.message || 'Erreur lors de la création du compte' 
      });
    }

    if (!newUser || !newUser.user) {
      return res.status(500).json({ error: 'User créé mais données manquantes' });
    }

    // Créer le profil explicitement (pas de trigger automatique sur auth.users)
    const { data: profileData, error: rpcError } = await supabaseAdmin.rpc(
      'create_profile_for_user',
      {
        p_user_id: newUser.user.id,
        p_email: email.toLowerCase().trim(),
        p_first_name: firstName,
        p_last_name: lastName,
        p_role: role,
        p_must_change_password: true,
        p_created_by: user.id
      }
    );

    if (rpcError) {
      console.error('Erreur création profil:', rpcError);
      // Fallback: essayer de créer via insert direct
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email.toLowerCase().trim(),
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          role: role,
          must_change_password: true,
          created_by: user.id
        });
      
      if (insertError && insertError.code !== '23505') { // Ignore si profil existe déjà
        console.error('Erreur insert profil:', insertError);
      }
    }

    // Mettre à jour avec le téléphone si fourni
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ phone: phone || null })
      .eq('id', newUser.user.id);

    if (updateError) {
      console.error('Erreur mise à jour profil:', updateError);
    }

    // Récupérer le profil complet
    const { data: completeProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single();

    return res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        profile: completeProfile
      }
    });

  } catch (error) {
    console.error('Erreur API create user:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
