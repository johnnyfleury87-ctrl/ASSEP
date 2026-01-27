/**
 * API JETC: Créer un nouvel utilisateur
 * POST /api/admin/users/create
 */
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createAnonClient } from '../../../../lib/supabaseAnonServer';
import safeLog from '../../../../lib/logger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // 3. Charger le profil avec client ADMIN
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, is_jetc_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profile missing' });
    }

    if (!profile.is_jetc_admin && !['president', 'vice_president'].includes(profile.role)) {
      return res.status(403).json({ error: 'User not allowed' });
    }

    // 4. Récupérer les données
    const { email, firstName, lastName, role, phone } = req.body;

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

    const temporaryPassword = 'ASSEP1234!';

    // 5. Créer l'utilisateur dans Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    });

    if (createError) {
      return res.status(400).json({ 
        error: createError.message || 'Erreur lors de la création du compte' 
      });
    }

    if (!newUser || !newUser.user) {
      return res.status(500).json({ error: 'User créé mais données manquantes' });
    }

    // 6. Créer/Upsert le profil avec client ADMIN
    const { error: profileUpsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        email: email.toLowerCase().trim(),
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: role,
        is_jetc_admin: false,
        must_change_password: true,
        created_by: profile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id' 
      });

    if (profileUpsertError) {
      safeLog.error('Profile upsert error:', profileUpsertError.message);
      // Ne pas fail si profil existe déjà
    }

    // 7. Récupérer le profil complet
    const { data: completeProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', newUser.user.id)
      .single();

    safeLog.auth('User created successfully', { userId: newUser.user.id, email: newUser.user.email, role });

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
    safeLog.error('API create user error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
