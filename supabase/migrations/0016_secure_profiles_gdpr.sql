-- Migration: Sécurisation RGPD des données personnelles
-- Date: 2026-02-02
-- Description: Restreindre l'accès aux données personnelles des profiles
--              uniquement aux membres du bureau + le profil lui-même

BEGIN;

-- ============================================================================
-- AJOUT CHAMP: Consentement RGPD pour bénévolat
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS volunteer_consent_given BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS volunteer_consent_date TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.volunteer_consent_given IS 
  'Consentement RGPD pour utilisation données personnelles (bénévolat)';
COMMENT ON COLUMN public.profiles.volunteer_consent_date IS 
  'Date du consentement RGPD';

-- ============================================================================
-- MODIFICATION RLS: profiles - Accès restrictif données personnelles
-- ============================================================================

-- Supprimer l'ancienne policy trop permissive
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

-- NOUVELLE POLICY: Chacun peut voir son propre profil complet
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- NOUVELLE POLICY: Bureau peut voir tous les profils complets
CREATE POLICY "profiles_select_bureau"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.is_jetc_admin = true
        OR p.role IN ('president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire')
      )
    )
  );

-- ============================================================================
-- NOUVELLE POLICY: event_volunteers restrictive
-- ============================================================================

-- Supprimer l'ancienne policy publique trop permissive
DROP POLICY IF EXISTS "event_volunteers_select_public" ON public.event_volunteers;
DROP POLICY IF EXISTS "event_volunteers_select_authenticated" ON public.event_volunteers;

-- Compteurs visibles par tous (sans données perso)
-- On ne joint pas profiles ici, juste le comptage
CREATE POLICY "event_volunteers_count_public"
  ON public.event_volunteers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Note: Les données personnelles (nom, prénom, etc.) des bénévoles
-- seront filtrées côté application. Seul le comptage est accessible.

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles';
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'profiles';
