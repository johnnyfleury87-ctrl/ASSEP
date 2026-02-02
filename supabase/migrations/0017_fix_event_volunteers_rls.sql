-- Migration: Fix event_volunteers RLS for bureau members
-- Date: 2026-02-02
-- Description: Permettre aux membres du bureau de voir les bénévoles inscrits avec leurs données profiles

BEGIN;

-- ============================================================================
-- FIX: Ajouter policy pour que le bureau puisse voir les bénévoles
-- ============================================================================

-- Les membres du bureau peuvent voir tous les bénévoles
CREATE POLICY "event_volunteers_select_bureau"
  ON public.event_volunteers FOR SELECT
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

-- Les bénévoles peuvent voir leurs propres inscriptions
CREATE POLICY "event_volunteers_select_own"
  ON public.event_volunteers FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'event_volunteers';
