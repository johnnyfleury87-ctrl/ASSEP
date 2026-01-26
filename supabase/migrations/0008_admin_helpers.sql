-- ============================================================================
-- Migration 0008: Admin Helpers
-- ============================================================================
-- Description: Fonctions helper pour faciliter l'admin JETC
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- FUNCTION: approve_event
-- ============================================================================
-- Permet à un président ou vice-président d'approuver et publier un événement

CREATE OR REPLACE FUNCTION public.approve_event(
  p_event_id UUID,
  p_approved_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_approver_role TEXT;
BEGIN
  -- Vérifie que l'approbateur est président ou vice-président
  SELECT role INTO v_approver_role
  FROM public.profiles
  WHERE id = p_approved_by;
  
  IF v_approver_role NOT IN ('president', 'vice_president') THEN
    RAISE EXCEPTION 'Seul le président ou vice-président peut approuver un événement';
  END IF;
  
  -- Met à jour l'événement
  UPDATE public.events
  SET 
    status = 'published',
    approved_by = p_approved_by,
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Événement non trouvé: %', p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: reject_event
-- ============================================================================
-- Permet à un président ou vice-président de rejeter un événement (retour draft)

CREATE OR REPLACE FUNCTION public.reject_event(
  p_event_id UUID,
  p_rejected_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_rejecter_role TEXT;
BEGIN
  -- Vérifie que le rejeteur est président ou vice-président
  SELECT role INTO v_rejecter_role
  FROM public.profiles
  WHERE id = p_rejected_by;
  
  IF v_rejecter_role NOT IN ('president', 'vice_president') THEN
    RAISE EXCEPTION 'Seul le président ou vice-président peut rejeter un événement';
  END IF;
  
  -- Retour au statut draft
  UPDATE public.events
  SET 
    status = 'draft',
    approved_by = NULL,
    approved_at = NULL,
    updated_at = NOW()
  WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Événement non trouvé: %', p_event_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: change_user_role
-- ============================================================================
-- Change le rôle d'un utilisateur (avec traçabilité)

CREATE OR REPLACE FUNCTION public.change_user_role(
  p_user_id UUID,
  p_new_role TEXT,
  p_changed_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_changer_admin BOOLEAN;
  v_changer_role TEXT;
BEGIN
  -- Vérifie que le changeur a les droits
  SELECT is_jetc_admin, role INTO v_changer_admin, v_changer_role
  FROM public.profiles
  WHERE id = p_changed_by;
  
  IF v_changer_admin = false AND v_changer_role NOT IN ('president', 'vice_president') THEN
    RAISE EXCEPTION 'Vous n''avez pas les droits pour changer les rôles';
  END IF;
  
  -- Vérifie que le nouveau rôle est valide
  IF p_new_role NOT IN ('president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire', 'membre') THEN
    RAISE EXCEPTION 'Rôle invalide: %', p_new_role;
  END IF;
  
  -- Met à jour le rôle avec traçabilité
  UPDATE public.profiles
  SET 
    role = p_new_role,
    role_requested = NULL,
    role_approved_by = p_changed_by,
    role_approved_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: reset_user_password
-- ============================================================================
-- Force un utilisateur à changer son mot de passe (remise à ASSEP1234!)

CREATE OR REPLACE FUNCTION public.reset_user_password(
  p_user_id UUID,
  p_reset_by UUID
)
RETURNS VOID AS $$
DECLARE
  v_resetter_admin BOOLEAN;
BEGIN
  -- Vérifie que le resetter est JETC admin
  SELECT is_jetc_admin INTO v_resetter_admin
  FROM public.profiles
  WHERE id = p_reset_by;
  
  IF v_resetter_admin = false THEN
    RAISE EXCEPTION 'Seul JETC admin peut réinitialiser les mots de passe';
  END IF;
  
  -- Force le changement de mot de passe
  UPDATE public.profiles
  SET 
    must_change_password = true,
    password_changed_at = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', p_user_id;
  END IF;
  
  -- Note: Le changement effectif du password dans auth.users 
  -- doit être fait côté serveur via Supabase Admin API
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_pending_approvals
-- ============================================================================
-- Retourne les événements en attente d'approbation

CREATE OR REPLACE FUNCTION public.get_pending_approvals()
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    COALESCE(p.first_name || ' ' || p.last_name, p.email),
    e.created_at
  FROM public.events e
  LEFT JOIN public.profiles p ON e.created_by = p.id
  WHERE e.status = 'pending_approval'
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_stats_dashboard
-- ============================================================================
-- Retourne des statistiques pour le dashboard admin

CREATE OR REPLACE FUNCTION public.get_stats_dashboard()
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_members', (SELECT COUNT(*) FROM public.profiles),
    'total_events', (SELECT COUNT(*) FROM public.events),
    'published_events', (SELECT COUNT(*) FROM public.events WHERE status = 'published'),
    'pending_events', (SELECT COUNT(*) FROM public.events WHERE status = 'pending_approval'),
    'total_signups', (SELECT COUNT(*) FROM public.signups),
    'total_donations', (SELECT COALESCE(SUM(amount), 0) FROM public.donations WHERE status = 'completed')
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.approve_event IS 'Approuve et publie un événement (président/vice uniquement)';
COMMENT ON FUNCTION public.change_user_role IS 'Change le rôle d''un utilisateur avec traçabilité';
COMMENT ON FUNCTION public.reset_user_password IS 'Force un utilisateur à changer son mot de passe';
COMMENT ON FUNCTION public.get_pending_approvals IS 'Liste des événements en attente d''approbation';
