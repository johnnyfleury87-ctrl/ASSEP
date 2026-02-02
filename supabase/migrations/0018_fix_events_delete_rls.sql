-- Migration: Fix events DELETE RLS for bureau members
-- Date: 2026-02-02
-- Description: Permettre aux membres du bureau (président, vice-président, secrétaire, vice-secrétaire) de supprimer des événements

BEGIN;

-- ============================================================================
-- FIX: Ajouter policy DELETE explicite pour le bureau
-- ============================================================================
-- Note: La policy "events_all_president" existe déjà mais on ajoute une policy DELETE explicite pour plus de clarté

-- Les membres du bureau peuvent supprimer des événements
DROP POLICY IF EXISTS "events_delete_bureau" ON public.events;
CREATE POLICY "events_delete_bureau"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.is_jetc_admin = true
        OR p.role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
      )
    )
  );

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'events' AND cmd = 'DELETE';
