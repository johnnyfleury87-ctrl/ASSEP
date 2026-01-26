-- Migration 0003: Volunteer Signups
-- Table: volunteer_signups
-- Contraintes: anti-doublon, vérification capacité créneau

-- Table volunteer_signups
CREATE TABLE IF NOT EXISTS volunteer_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES event_shifts(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  comms_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shift_id, email)
);

-- Index sur volunteer_signups
CREATE INDEX IF NOT EXISTS idx_signups_event_id ON volunteer_signups(event_id);
CREATE INDEX IF NOT EXISTS idx_signups_shift_id ON volunteer_signups(shift_id);
CREATE INDEX IF NOT EXISTS idx_signups_email ON volunteer_signups(email);
CREATE INDEX IF NOT EXISTS idx_signups_status ON volunteer_signups(status);

-- Fonction pour vérifier la capacité du créneau
CREATE OR REPLACE FUNCTION check_shift_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- Compter les inscriptions confirmées pour ce créneau
  SELECT COUNT(*) INTO current_count
  FROM volunteer_signups
  WHERE shift_id = NEW.shift_id AND status = 'confirmed';

  -- Récupérer la capacité maximale
  SELECT required_count INTO max_count
  FROM event_shifts
  WHERE id = NEW.shift_id;

  -- Vérifier si le créneau est plein
  IF current_count >= max_count THEN
    RAISE EXCEPTION 'Ce créneau est complet (% / % places)', current_count, max_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier la capacité avant insertion
DROP TRIGGER IF EXISTS check_shift_capacity_before_insert ON volunteer_signups;
CREATE TRIGGER check_shift_capacity_before_insert
  BEFORE INSERT ON volunteer_signups
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION check_shift_capacity();

-- Trigger pour vérifier la capacité avant update (si on passe de cancelled à confirmed)
DROP TRIGGER IF EXISTS check_shift_capacity_before_update ON volunteer_signups;
CREATE TRIGGER check_shift_capacity_before_update
  BEFORE UPDATE ON volunteer_signups
  FOR EACH ROW
  WHEN (OLD.status != 'confirmed' AND NEW.status = 'confirmed')
  EXECUTE FUNCTION check_shift_capacity();
