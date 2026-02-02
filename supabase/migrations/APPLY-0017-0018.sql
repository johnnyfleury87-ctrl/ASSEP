-- ============================================================================
-- MIGRATIONS 0017 + 0018 - Application groupée
-- Date: 2026-02-02
-- Description: Appliquer les corrections RLS pour bénévoles et suppression événements
-- ============================================================================

-- À exécuter dans Supabase Dashboard > SQL Editor

-- ============================================================================
-- MIGRATION 0017: Fix event_volunteers RLS for bureau members
-- ============================================================================

BEGIN;

-- Les membres du bureau peuvent voir tous les bénévoles
DROP POLICY IF EXISTS "event_volunteers_select_bureau" ON public.event_volunteers;
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
DROP POLICY IF EXISTS "event_volunteers_select_own" ON public.event_volunteers;
CREATE POLICY "event_volunteers_select_own"
  ON public.event_volunteers FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

COMMIT;

-- ============================================================================
-- MIGRATION 0018: Fix events DELETE RLS for bureau members
-- ============================================================================

BEGIN;

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

-- Vérifier les policies event_volunteers
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'event_volunteers'
ORDER BY policyname;

-- Vérifier les policies events (DELETE)
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'events' AND cmd = 'DELETE'
ORDER BY policyname;

-- Vérifier les policies profiles
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'SELECT'
ORDER BY policyname;

-- ✅ Résultat attendu:
-- - event_volunteers: policies "event_volunteers_select_bureau" et "event_volunteers_select_own"
-- - events: policy "events_delete_bureau" 
-- - profiles: policies "profiles_select_own" et "profiles_select_bureau"
