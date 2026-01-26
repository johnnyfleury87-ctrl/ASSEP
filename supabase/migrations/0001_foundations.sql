-- ============================================================================
-- Migration 0001: Fondations - Tables de base
-- ============================================================================
-- Description: Création des tables fondamentales (profiles, bureau_members)
-- Date: 2026-01-26
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Table centrale pour tous les utilisateurs (membres ASSEP + bureau)
-- Liée à auth.users via trigger automatique

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- Rôle dans l'association (président, trésorier, membre, etc.)
  role TEXT NOT NULL DEFAULT 'membre' CHECK (
    role IN (
      'president', 
      'vice_president', 
      'tresorier', 
      'vice_tresorier', 
      'secretaire', 
      'vice_secretaire', 
      'membre'
    )
  ),
  
  -- Statut et permissions
  is_jetc_admin BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  password_changed_at TIMESTAMPTZ,
  
  -- Traçabilité de création (qui a créé ce compte?)
  created_by UUID REFERENCES public.profiles(id),
  
  -- Workflow de changement de rôle (demande/approbation)
  role_requested TEXT,
  role_approved_by UUID REFERENCES public.profiles(id),
  role_approved_at TIMESTAMPTZ,
  
  -- Communication
  comms_opt_in BOOLEAN NOT NULL DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_jetc_admin ON public.profiles(is_jetc_admin);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- BUREAU_MEMBERS TABLE
-- ============================================================================
-- Informations publiques sur les membres du bureau (affichage site)

CREATE TABLE IF NOT EXISTS public.bureau_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Informations publiques
  role TEXT NOT NULL CHECK (
    role IN (
      'president', 
      'vice_president', 
      'tresorier', 
      'vice_tresorier', 
      'secretaire', 
      'vice_secretaire'
    )
  ),
  name TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  
  -- Ordre d'affichage
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Visibilité
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_bureau_members_role ON public.bureau_members(role);
CREATE INDEX idx_bureau_members_active ON public.bureau_members(is_active);
CREATE INDEX idx_bureau_members_order ON public.bureau_members(display_order);

-- ============================================================================
-- TRIGGERS: updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_bureau_members_updated_at
  BEFORE UPDATE ON public.bureau_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'Profils utilisateurs liés à auth.users via trigger';
COMMENT ON COLUMN public.profiles.is_jetc_admin IS 'Super-admin JETC avec accès total';
COMMENT ON COLUMN public.profiles.must_change_password IS 'Force changement du mot de passe temporaire';
COMMENT ON COLUMN public.profiles.created_by IS 'UUID du user qui a créé ce compte (JETC)';

COMMENT ON TABLE public.bureau_members IS 'Informations publiques des membres du bureau';
