-- ============================================================================
-- Migration 0006: RLS Policies
-- ============================================================================
-- Description: Politiques de sécurité Row Level Security
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- ENABLE RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bureau_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Vérifie si l'utilisateur est JETC admin
CREATE OR REPLACE FUNCTION public.is_jetc_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_jetc_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifie si l'utilisateur est président ou vice-président
CREATE OR REPLACE FUNCTION public.is_president_or_vice()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND role IN ('president', 'vice_president')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifie si l'utilisateur peut gérer les finances
CREATE OR REPLACE FUNCTION public.can_manage_finance()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (
      is_jetc_admin = true
      OR role IN ('president', 'vice_president', 'tresorier', 'vice_tresorier')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifie si l'utilisateur peut créer/éditer des événements
CREATE OR REPLACE FUNCTION public.can_manage_events()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() 
    AND (
      is_jetc_admin = true
      OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Tout utilisateur authentifié peut voir les profils (pour afficher noms, etc.)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Un utilisateur peut modifier son propre profil (nom, téléphone, opt-in)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- JETC admin peut tout faire sur les profils
CREATE POLICY "profiles_all_jetc_admin"
  ON public.profiles FOR ALL
  TO authenticated
  USING (is_jetc_admin())
  WITH CHECK (is_jetc_admin());

-- Président/Vice peuvent voir et modifier les profils (pour gestion rôles)
CREATE POLICY "profiles_manage_president"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (is_president_or_vice())
  WITH CHECK (is_president_or_vice());

-- ============================================================================
-- BUREAU_MEMBERS POLICIES
-- ============================================================================

-- Public peut lire les membres du bureau actifs
CREATE POLICY "bureau_members_select_public"
  ON public.bureau_members FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- JETC admin et président/vice peuvent tout gérer
CREATE POLICY "bureau_members_all_admin"
  ON public.bureau_members FOR ALL
  TO authenticated
  USING (is_jetc_admin() OR is_president_or_vice())
  WITH CHECK (is_jetc_admin() OR is_president_or_vice());

-- ============================================================================
-- EVENTS POLICIES
-- ============================================================================

-- Public peut voir uniquement les événements publiés
CREATE POLICY "events_select_public"
  ON public.events FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Membres authentifiés peuvent voir tous les événements (pour dashboard)
CREATE POLICY "events_select_authenticated_all"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    is_jetc_admin() 
    OR is_president_or_vice()
    OR can_manage_events()
  );

-- Secrétaires/Vice peuvent créer des événements (status=pending_approval)
CREATE POLICY "events_insert_secretaire"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    can_manage_events()
    AND (status = 'draft' OR status = 'pending_approval')
  );

-- Secrétaires/Vice peuvent éditer leurs événements (status=draft ou pending_approval)
CREATE POLICY "events_update_secretaire"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    can_manage_events()
    AND created_by = auth.uid()
    AND status IN ('draft', 'pending_approval')
  )
  WITH CHECK (
    can_manage_events()
    AND created_by = auth.uid()
  );

-- Président/Vice peuvent tout faire sur les événements (y compris publier)
CREATE POLICY "events_all_president"
  ON public.events FOR ALL
  TO authenticated
  USING (is_jetc_admin() OR is_president_or_vice())
  WITH CHECK (is_jetc_admin() OR is_president_or_vice());

-- ============================================================================
-- EVENT_SHIFTS POLICIES
-- ============================================================================

-- Public peut voir les shifts des événements publiés
CREATE POLICY "event_shifts_select_public"
  ON public.event_shifts FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_shifts.event_id
      AND events.status = 'published'
    )
  );

-- Gestionnaires d'événements peuvent gérer les shifts
CREATE POLICY "event_shifts_all_managers"
  ON public.event_shifts FOR ALL
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- ============================================================================
-- EVENT_VOLUNTEERS POLICIES
-- ============================================================================

-- Membres peuvent voir les bénévoles des événements publiés
CREATE POLICY "event_volunteers_select_authenticated"
  ON public.event_volunteers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_volunteers.event_id
      AND events.status = 'published'
    )
  );

-- Gestionnaires d'événements peuvent gérer les bénévoles
CREATE POLICY "event_volunteers_all_managers"
  ON public.event_volunteers FOR ALL
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- ============================================================================
-- EVENT_TASKS POLICIES
-- ============================================================================

-- Un utilisateur peut voir ses propres tâches
CREATE POLICY "event_tasks_select_own"
  ON public.event_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Gestionnaires d'événements peuvent tout voir et gérer
CREATE POLICY "event_tasks_all_managers"
  ON public.event_tasks FOR ALL
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- ============================================================================
-- SIGNUPS POLICIES
-- ============================================================================

-- Public peut créer des inscriptions (formulaire public)
CREATE POLICY "signups_insert_public"
  ON public.signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Gestionnaires d'événements peuvent voir et gérer les inscriptions
CREATE POLICY "signups_select_managers"
  ON public.signups FOR SELECT
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

CREATE POLICY "signups_update_managers"
  ON public.signups FOR UPDATE
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- ============================================================================
-- TRANSACTIONS POLICIES
-- ============================================================================

-- Seuls les gestionnaires financiers peuvent voir les transactions
CREATE POLICY "transactions_select_finance"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (can_manage_finance());

-- Seuls les gestionnaires financiers peuvent créer/modifier les transactions
CREATE POLICY "transactions_all_finance"
  ON public.transactions FOR ALL
  TO authenticated
  USING (can_manage_finance())
  WITH CHECK (can_manage_finance());

-- ============================================================================
-- EMAIL_CAMPAIGNS POLICIES
-- ============================================================================

-- Seuls JETC admin et président/vice peuvent gérer les campagnes email
CREATE POLICY "email_campaigns_all_admin"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (is_jetc_admin() OR is_president_or_vice())
  WITH CHECK (is_jetc_admin() OR is_president_or_vice());

-- ============================================================================
-- DONATIONS POLICIES
-- ============================================================================

-- Public peut créer des donations (formulaire public)
CREATE POLICY "donations_insert_public"
  ON public.donations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Gestionnaires financiers et président/vice peuvent voir les donations
CREATE POLICY "donations_select_finance"
  ON public.donations FOR SELECT
  TO authenticated
  USING (can_manage_finance());

CREATE POLICY "donations_update_finance"
  ON public.donations FOR UPDATE
  TO authenticated
  USING (can_manage_finance())
  WITH CHECK (can_manage_finance());

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "events_select_public" ON public.events IS 'Public voit uniquement événements publiés';
COMMENT ON POLICY "events_all_president" ON public.events IS 'Président/Vice peuvent publier et approuver';
COMMENT ON FUNCTION public.is_jetc_admin() IS 'Vérifie si utilisateur est super-admin JETC';
