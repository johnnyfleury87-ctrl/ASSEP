/**
 * API: Approuver un événement
 * POST /api/events/approve
 * 
 * Body: {
 *   eventId: string
 * }
 * 
 * Accessible uniquement aux président et vice-président
 */
import { supabaseAdmin } from '../../../lib/supabaseServer';

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

    // Vérifier que l'utilisateur est président ou vice-président
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profil non trouvé' });
    }

    if (!['president', 'vice_president'].includes(profile.role)) {
      return res.status(403).json({ 
        error: 'Seul le président ou vice-président peut approuver des événements' 
      });
    }

    // Récupérer l'ID de l'événement
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId requis' });
    }

    // Mettre à jour l'événement
    const { data: updatedEvent, error: updateError } = await supabaseAdmin
      .from('events')
      .update({
        status: 'published',
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur approbation:', updateError);
      return res.status(400).json({ 
        error: updateError.message || 'Erreur lors de l\'approbation' 
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Événement approuvé et publié',
      event: updatedEvent
    });

  } catch (error) {
    console.error('Erreur API approve:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
