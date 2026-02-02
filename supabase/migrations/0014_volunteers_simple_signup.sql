-- Migration: Système d'inscription bénévoles simplifié
-- Date: 2026-02-02
-- Description: Ajouter un champ volunteer_target sur events et permettre
--              l'inscription simplifiée des bénévoles sans créneaux

BEGIN;

-- ============================================================================
-- AJOUT CHAMP volunteer_target SUR events
-- ============================================================================

-- Ajouter le champ pour définir l'objectif de bénévoles
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS volunteer_target INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.events.volunteer_target IS 
  'Nombre de bénévoles souhaités pour cet événement (0 = pas de recrutement)';

-- ============================================================================
-- MODIFICATION event_volunteers : rendre shift_id optionnel
-- ============================================================================

-- Le shift_id devient optionnel pour permettre inscription générale
ALTER TABLE public.event_volunteers
ALTER COLUMN shift_id DROP NOT NULL;

-- Ajouter contrainte unique pour éviter double inscription générale
-- (un user ne peut s'inscrire qu'une fois par événement en mode général)
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_volunteers_unique_event_profile
  ON public.event_volunteers(event_id, profile_id)
  WHERE shift_id IS NULL;

COMMENT ON INDEX public.idx_event_volunteers_unique_event_profile IS 
  'Un bénévole ne peut s''inscrire qu''une fois par événement en mode général';

-- ============================================================================
-- FONCTION: Vérifier limite de bénévoles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_volunteer_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_target INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Récupérer l'objectif de l'événement
  SELECT volunteer_target INTO v_target
  FROM public.events
  WHERE id = NEW.event_id;
  
  -- Si pas de limite (target = 0), autoriser
  IF v_target = 0 THEN
    RETURN NEW;
  END IF;
  
  -- Compter les bénévoles confirmés (inscription générale uniquement)
  SELECT COUNT(*) INTO v_current_count
  FROM public.event_volunteers
  WHERE event_id = NEW.event_id
    AND shift_id IS NULL
    AND status = 'confirmed';
  
  -- Vérifier si on atteint la limite
  IF v_current_count >= v_target THEN
    RAISE EXCEPTION 'Limite atteinte : % bénévole(s) déjà inscrit(s) sur un objectif de %', v_current_count, v_target;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer trigger BEFORE INSERT
DROP TRIGGER IF EXISTS check_volunteer_limit_before_insert ON public.event_volunteers;
CREATE TRIGGER check_volunteer_limit_before_insert
  BEFORE INSERT ON public.event_volunteers
  FOR EACH ROW
  WHEN (NEW.shift_id IS NULL AND NEW.status = 'confirmed')
  EXECUTE FUNCTION public.check_volunteer_limit();

-- ============================================================================
-- RLS POLICIES pour event_volunteers
-- ============================================================================

-- Tout le monde peut voir les compteurs (lecture publique)
DROP POLICY IF EXISTS "event_volunteers_select_public" ON public.event_volunteers;
CREATE POLICY "event_volunteers_select_public"
  ON public.event_volunteers FOR SELECT
  TO anon, authenticated
  USING (true);

-- Un user connecté peut s'inscrire
DROP POLICY IF EXISTS "event_volunteers_insert_authenticated" ON public.event_volunteers;
CREATE POLICY "event_volunteers_insert_authenticated"
  ON public.event_volunteers FOR INSERT
  TO authenticated
  WITH CHECK (
    profile_id = auth.uid()
  );

-- Un user peut se désinscrire (update vers cancelled)
DROP POLICY IF EXISTS "event_volunteers_update_own" ON public.event_volunteers;
CREATE POLICY "event_volunteers_update_own"
  ON public.event_volunteers FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Gestionnaires d'événements peuvent gérer toutes les inscriptions
DROP POLICY IF EXISTS "event_volunteers_all_managers" ON public.event_volunteers;
CREATE POLICY "event_volunteers_all_managers"
  ON public.event_volunteers FOR ALL
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- SELECT id, name, volunteer_target FROM events LIMIT 5;
-- SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'event_volunteers';
