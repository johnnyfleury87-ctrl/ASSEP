-- ============================================================================
-- Migration 0007: Auth & Profiles Helper Functions
-- ============================================================================
-- Description: Fonctions helper pour la gestion des profils utilisateurs
-- Date: 2026-01-26
-- ============================================================================
-- ⚠️  NOTE IMPORTANTE: Supabase ne permet PAS de créer des triggers directs
-- sur auth.users (table système protégée). À la place, on utilise:
-- 1. Création explicite du profil dans l'API lors de createUser()
-- 2. Fonction de synchronisation pour réparer les profils manquants
-- ============================================================================

-- ============================================================================
-- FUNCTION: create_profile_for_user
-- ============================================================================
-- Crée un profil pour un user existant (si pas déjà créé)
-- Utilisé par l'API et pour la synchronisation

CREATE OR REPLACE FUNCTION public.create_profile_for_user(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_role TEXT DEFAULT 'membre',
  p_must_change_password BOOLEAN DEFAULT true,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Insérer ou mettre à jour le profil
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    comms_opt_in,
    is_jetc_admin,
    must_change_password,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_role,
    false,
    false,
    p_must_change_password,
    p_created_by,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = NOW()
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: sync_auth_users_to_profiles
-- ============================================================================
-- Synchronise tous les users auth.users vers profiles
-- À exécuter périodiquement ou après création manuelle de users

CREATE OR REPLACE FUNCTION public.sync_auth_users_to_profiles()
RETURNS TABLE (
  synced_count INTEGER,
  missing_profiles TEXT[]
)
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_synced_count INTEGER := 0;
  v_missing_profiles TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Parcourir tous les users qui n'ont pas de profil
  FOR v_user IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Créer le profil
    PERFORM public.create_profile_for_user(
      v_user.id,
      v_user.email,
      v_user.raw_user_meta_data->>'first_name',
      v_user.raw_user_meta_data->>'last_name',
      COALESCE(v_user.raw_user_meta_data->>'role', 'membre'),
      true,
      NULL
    );
    
    v_synced_count := v_synced_count + 1;
    v_missing_profiles := array_append(v_missing_profiles, v_user.email);
  END LOOP;
  
  RETURN QUERY SELECT v_synced_count, v_missing_profiles;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: update_password_changed_at
-- ============================================================================
-- Met à jour password_changed_at quand must_change_password passe à false

CREATE OR REPLACE FUNCTION public.update_password_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Si must_change_password passe de true à false
  IF OLD.must_change_password = true AND NEW.must_change_password = false THEN
    NEW.password_changed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_password_changed_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_password_changed_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.create_profile_for_user IS 'Crée un profil pour un user (utilisé par API et sync)';
COMMENT ON FUNCTION public.sync_auth_users_to_profiles IS 'Synchronise tous les users auth.users vers profiles';
COMMENT ON FUNCTION public.update_password_changed_at IS 'Met à jour password_changed_at automatiquement';
