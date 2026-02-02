-- Migration: Autoriser secrétaires à éditer tous les événements
-- Date: 2026-02-02
-- Description: Supprime la restriction qui empêchait les secrétaires/vice-secrétaires
--              d'éditer les événements publiés ou créés par d'autres utilisateurs

BEGIN;

-- ============================================================================
-- ÉVÉNEMENTS : Autoriser secrétaires à éditer tous les événements
-- ============================================================================

-- Supprimer l'ancienne policy restrictive pour les secrétaires
DROP POLICY IF EXISTS "events_update_secretaire" ON public.events;

-- Créer une nouvelle policy pour les gestionnaires d'événements (incluant secrétaires)
-- Ils peuvent maintenant éditer TOUS les événements, pas seulement les leurs en draft
CREATE POLICY "events_update_managers"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    can_manage_events()
  )
  WITH CHECK (
    can_manage_events()
  );

-- Note: La policy "events_all_president" reste inchangée pour les présidents
-- qui gardent tous les droits (ALL) incluant la suppression

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'events' 
-- ORDER BY policyname;
