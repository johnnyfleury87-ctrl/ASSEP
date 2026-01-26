-- ============================================================================
-- Migration 0009: JETC Roles & Admin Management
-- ============================================================================
-- Description: Helpers et RLS pour la gestion des rôles et utilisateurs JETC
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- FUNCTION: is_jetc_admin
-- ============================================================================
-- Vérifie si l'utilisateur connecté est JETC admin
-- Utilisé dans les RLS policies et les vérifications de sécurité

CREATE OR REPLACE FUNCTION public.is_jetc_admin()
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_jetc_admin INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC: change_user_role
-- ============================================================================
-- Permet à un JETC admin de changer le rôle d'un utilisateur
-- Sécurité: vérifie que l'appelant est JETC admin

CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_updated_profile RECORD;
  v_valid_roles TEXT[] := ARRAY['president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire', 'membre'];
BEGIN
  -- Vérifier que l'appelant est JETC admin
  SELECT is_jetc_admin INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Permission refusée: seuls les JETC admin peuvent changer les rôles';
  END IF;
  
  -- Valider le rôle
  IF NOT (new_role = ANY(v_valid_roles)) THEN
    RAISE EXCEPTION 'Rôle invalide: %', new_role;
  END IF;
  
  -- Mettre à jour le rôle
  UPDATE public.profiles
  SET 
    role = new_role,
    updated_at = NOW()
  WHERE id = target_user_id
  RETURNING * INTO v_updated_profile;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', target_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_updated_profile.id,
    'email', v_updated_profile.email,
    'role', v_updated_profile.role
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RPC: set_must_change_password
-- ============================================================================
-- Force un utilisateur à changer son mot de passe à la prochaine connexion
-- Sécurité: vérifie que l'appelant est JETC admin

CREATE OR REPLACE FUNCTION public.set_must_change_password(
  target_user_id UUID,
  flag BOOLEAN
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_is_admin BOOLEAN;
  v_updated_profile RECORD;
BEGIN
  -- Vérifier que l'appelant est JETC admin
  SELECT is_jetc_admin INTO v_caller_is_admin
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF NOT COALESCE(v_caller_is_admin, false) THEN
    RAISE EXCEPTION 'Permission refusée: seuls les JETC admin peuvent forcer le changement de mot de passe';
  END IF;
  
  -- Mettre à jour le flag
  UPDATE public.profiles
  SET 
    must_change_password = flag,
    updated_at = NOW()
  WHERE id = target_user_id
  RETURNING * INTO v_updated_profile;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur non trouvé: %', target_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_updated_profile.id,
    'email', v_updated_profile.email,
    'must_change_password', v_updated_profile.must_change_password
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS POLICIES: profiles
-- ============================================================================
-- Mettre à jour les policies pour permettre aux JETC admin de gérer les users

-- Supprimer les anciennes policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "JETC admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "JETC admins can update all profiles" ON public.profiles;

-- Recréer les policies
-- 1. SELECT: Un utilisateur peut voir son propre profil
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 2. SELECT: Un JETC admin peut voir tous les profils
CREATE POLICY "JETC admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_jetc_admin());

-- 3. UPDATE: Un utilisateur peut mettre à jour son propre profil (sauf certains champs)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND is_jetc_admin = (SELECT is_jetc_admin FROM public.profiles WHERE id = auth.uid())
);

-- 4. UPDATE: Un JETC admin peut mettre à jour tous les profils
CREATE POLICY "JETC admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_jetc_admin())
WITH CHECK (public.is_jetc_admin());

-- ============================================================================
-- GRANTS
-- ============================================================================
-- S'assurer que les fonctions sont accessibles aux utilisateurs authentifiés

GRANT EXECUTE ON FUNCTION public.is_jetc_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_must_change_password(UUID, BOOLEAN) TO authenticated;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION public.is_jetc_admin() IS 
'Vérifie si l''utilisateur connecté est JETC admin. Utilisé dans les RLS policies.';

COMMENT ON FUNCTION public.change_user_role(UUID, TEXT) IS 
'Permet à un JETC admin de changer le rôle d''un utilisateur. Valide le rôle avant mise à jour.';

COMMENT ON FUNCTION public.set_must_change_password(UUID, BOOLEAN) IS 
'Force un utilisateur à changer son mot de passe à la prochaine connexion. Accessible aux JETC admin uniquement.';
