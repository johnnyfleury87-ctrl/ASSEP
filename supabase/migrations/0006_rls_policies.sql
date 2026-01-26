-- Migration 0006: RLS Policies
-- Active RLS sur toutes les tables + définit les policies

-- ============================================================================
-- FONCTIONS HELPER POUR RLS
-- ============================================================================

-- Récupère le rôle de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Vérifie si l'utilisateur est membre du bureau
CREATE OR REPLACE FUNCTION is_bureau()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Vérifie si l'utilisateur peut gérer les événements
CREATE OR REPLACE FUNCTION can_manage_events()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('secretaire', 'vice_secretaire', 'president', 'vice_president')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Vérifie si l'utilisateur peut gérer les finances
CREATE OR REPLACE FUNCTION can_manage_finance()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('tresorier', 'vice_tresorier', 'president', 'vice_president')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Vérifie si l'utilisateur est président ou vice-président
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('president', 'vice_president')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- RLS: PROFILES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire son propre profil
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Tout le monde peut modifier son propre profil (email, full_name, phone, comms_opt_in)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Président/Vice peuvent lire tous les profils
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Président/Vice peuvent modifier les rôles
DROP POLICY IF EXISTS "Admins can update roles" ON profiles;
CREATE POLICY "Admins can update roles"
  ON profiles FOR UPDATE
  USING (is_admin());

-- ============================================================================
-- RLS: BUREAU_MEMBERS
-- ============================================================================

ALTER TABLE bureau_members ENABLE ROW LEVEL SECURITY;

-- Public peut lire les membres du bureau visibles
DROP POLICY IF EXISTS "Public can read visible bureau members" ON bureau_members;
CREATE POLICY "Public can read visible bureau members"
  ON bureau_members FOR SELECT
  USING (is_visible = true);

-- Président/Vice peuvent tout voir
DROP POLICY IF EXISTS "Admins can read all bureau members" ON bureau_members;
CREATE POLICY "Admins can read all bureau members"
  ON bureau_members FOR SELECT
  USING (is_admin());

-- Président/Vice peuvent créer/modifier/supprimer
DROP POLICY IF EXISTS "Admins can manage bureau members" ON bureau_members;
CREATE POLICY "Admins can manage bureau members"
  ON bureau_members FOR ALL
  USING (is_admin());

-- ============================================================================
-- RLS: EVENTS
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Public peut lire les événements publiés
DROP POLICY IF EXISTS "Public can read published events" ON events;
CREATE POLICY "Public can read published events"
  ON events FOR SELECT
  USING (status = 'published');

-- Bureau peut lire tous les événements
DROP POLICY IF EXISTS "Bureau can read all events" ON events;
CREATE POLICY "Bureau can read all events"
  ON events FOR SELECT
  USING (is_bureau());

-- Secrétaire/Vice/Président/Vice peuvent créer/modifier
DROP POLICY IF EXISTS "Managers can manage events" ON events;
CREATE POLICY "Managers can manage events"
  ON events FOR ALL
  USING (can_manage_events());

-- ============================================================================
-- RLS: EVENT_BUVETTE_ITEMS
-- ============================================================================

ALTER TABLE event_buvette_items ENABLE ROW LEVEL SECURITY;

-- Public peut lire les items des événements publiés
DROP POLICY IF EXISTS "Public can read buvette items of published events" ON event_buvette_items;
CREATE POLICY "Public can read buvette items of published events"
  ON event_buvette_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_buvette_items.event_id
      AND events.status = 'published'
    )
  );

-- Bureau peut lire tous les items
DROP POLICY IF EXISTS "Bureau can read all buvette items" ON event_buvette_items;
CREATE POLICY "Bureau can read all buvette items"
  ON event_buvette_items FOR SELECT
  USING (is_bureau());

-- Gestionnaires événements peuvent créer/modifier
DROP POLICY IF EXISTS "Managers can manage buvette items" ON event_buvette_items;
CREATE POLICY "Managers can manage buvette items"
  ON event_buvette_items FOR ALL
  USING (can_manage_events());

-- ============================================================================
-- RLS: EVENT_PAYMENT_METHODS
-- ============================================================================

ALTER TABLE event_payment_methods ENABLE ROW LEVEL SECURITY;

-- Public peut lire les moyens de paiement des événements publiés
DROP POLICY IF EXISTS "Public can read payment methods of published events" ON event_payment_methods;
CREATE POLICY "Public can read payment methods of published events"
  ON event_payment_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_payment_methods.event_id
      AND events.status = 'published'
    )
  );

-- Bureau peut lire tous les moyens de paiement
DROP POLICY IF EXISTS "Bureau can read all payment methods" ON event_payment_methods;
CREATE POLICY "Bureau can read all payment methods"
  ON event_payment_methods FOR SELECT
  USING (is_bureau());

-- Gestionnaires événements peuvent créer/modifier
DROP POLICY IF EXISTS "Managers can manage payment methods" ON event_payment_methods;
CREATE POLICY "Managers can manage payment methods"
  ON event_payment_methods FOR ALL
  USING (can_manage_events());

-- ============================================================================
-- RLS: EVENT_TASKS
-- ============================================================================

ALTER TABLE event_tasks ENABLE ROW LEVEL SECURITY;

-- Public peut lire les tâches des événements publiés
DROP POLICY IF EXISTS "Public can read tasks of published events" ON event_tasks;
CREATE POLICY "Public can read tasks of published events"
  ON event_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_tasks.event_id
      AND events.status = 'published'
    )
  );

-- Bureau peut lire toutes les tâches
DROP POLICY IF EXISTS "Bureau can read all tasks" ON event_tasks;
CREATE POLICY "Bureau can read all tasks"
  ON event_tasks FOR SELECT
  USING (is_bureau());

-- Gestionnaires événements peuvent créer/modifier
DROP POLICY IF EXISTS "Managers can manage tasks" ON event_tasks;
CREATE POLICY "Managers can manage tasks"
  ON event_tasks FOR ALL
  USING (can_manage_events());

-- ============================================================================
-- RLS: EVENT_SHIFTS
-- ============================================================================

ALTER TABLE event_shifts ENABLE ROW LEVEL SECURITY;

-- Public peut lire les créneaux des événements publiés
DROP POLICY IF EXISTS "Public can read shifts of published events" ON event_shifts;
CREATE POLICY "Public can read shifts of published events"
  ON event_shifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_tasks
      JOIN events ON events.id = event_tasks.event_id
      WHERE event_tasks.id = event_shifts.event_task_id
      AND events.status = 'published'
    )
  );

-- Bureau peut lire tous les créneaux
DROP POLICY IF EXISTS "Bureau can read all shifts" ON event_shifts;
CREATE POLICY "Bureau can read all shifts"
  ON event_shifts FOR SELECT
  USING (is_bureau());

-- Gestionnaires événements peuvent créer/modifier
DROP POLICY IF EXISTS "Managers can manage shifts" ON event_shifts;
CREATE POLICY "Managers can manage shifts"
  ON event_shifts FOR ALL
  USING (can_manage_events());

-- ============================================================================
-- RLS: VOLUNTEER_SIGNUPS
-- ============================================================================

ALTER TABLE volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Public peut s'inscrire (INSERT)
DROP POLICY IF EXISTS "Public can signup as volunteer" ON volunteer_signups;
CREATE POLICY "Public can signup as volunteer"
  ON volunteer_signups FOR INSERT
  WITH CHECK (true);

-- Bureau peut lire toutes les inscriptions
DROP POLICY IF EXISTS "Bureau can read all signups" ON volunteer_signups;
CREATE POLICY "Bureau can read all signups"
  ON volunteer_signups FOR SELECT
  USING (is_bureau());

-- Bureau peut modifier les inscriptions (ex: annulation)
DROP POLICY IF EXISTS "Bureau can update signups" ON volunteer_signups;
CREATE POLICY "Bureau can update signups"
  ON volunteer_signups FOR UPDATE
  USING (is_bureau());

-- ============================================================================
-- RLS: EVENT_CASHUPS
-- ============================================================================

ALTER TABLE event_cashups ENABLE ROW LEVEL SECURITY;

-- Bureau peut lire toutes les caisses
DROP POLICY IF EXISTS "Bureau can read all cashups" ON event_cashups;
CREATE POLICY "Bureau can read all cashups"
  ON event_cashups FOR SELECT
  USING (is_bureau());

-- Gestionnaires finance peuvent créer/modifier
DROP POLICY IF EXISTS "Finance managers can manage cashups" ON event_cashups;
CREATE POLICY "Finance managers can manage cashups"
  ON event_cashups FOR ALL
  USING (can_manage_finance());

-- ============================================================================
-- RLS: LEDGER_ENTRIES
-- ============================================================================

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- Bureau peut lire toutes les écritures
DROP POLICY IF EXISTS "Bureau can read all ledger entries" ON ledger_entries;
CREATE POLICY "Bureau can read all ledger entries"
  ON ledger_entries FOR SELECT
  USING (is_bureau());

-- Gestionnaires finance peuvent créer/modifier
DROP POLICY IF EXISTS "Finance managers can manage ledger entries" ON ledger_entries;
CREATE POLICY "Finance managers can manage ledger entries"
  ON ledger_entries FOR ALL
  USING (can_manage_finance());

-- ============================================================================
-- RLS: EMAIL_CAMPAIGNS
-- ============================================================================

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

-- Bureau peut lire toutes les campagnes
DROP POLICY IF EXISTS "Bureau can read all campaigns" ON email_campaigns;
CREATE POLICY "Bureau can read all campaigns"
  ON email_campaigns FOR SELECT
  USING (is_bureau());

-- Président/Vice/Secrétaire/Vice peuvent créer/modifier
DROP POLICY IF EXISTS "Comms managers can manage campaigns" ON email_campaigns;
CREATE POLICY "Comms managers can manage campaigns"
  ON email_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
    )
  );

-- ============================================================================
-- RLS: EMAIL_LOGS
-- ============================================================================

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Bureau peut lire tous les logs
DROP POLICY IF EXISTS "Bureau can read all email logs" ON email_logs;
CREATE POLICY "Bureau can read all email logs"
  ON email_logs FOR SELECT
  USING (is_bureau());

-- Système peut créer des logs (via service role)
DROP POLICY IF EXISTS "Service can create email logs" ON email_logs;
CREATE POLICY "Service can create email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- RLS: DONATION_COUNTERS
-- ============================================================================

ALTER TABLE donation_counters ENABLE ROW LEVEL SECURITY;

-- Public peut lire les compteurs
DROP POLICY IF EXISTS "Public can read donation counters" ON donation_counters;
CREATE POLICY "Public can read donation counters"
  ON donation_counters FOR SELECT
  USING (true);

-- Gestionnaires finance peuvent modifier
DROP POLICY IF EXISTS "Finance managers can update donation counters" ON donation_counters;
CREATE POLICY "Finance managers can update donation counters"
  ON donation_counters FOR UPDATE
  USING (can_manage_finance());
