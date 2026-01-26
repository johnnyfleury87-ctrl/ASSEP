-- Migration 0002: Events
-- Tables: events, event_buvette_items, event_payment_methods, event_tasks, event_shifts

-- Table events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  theme TEXT,
  location TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  has_buvette BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index sur events
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events(starts_at);

-- Trigger updated_at pour events
DROP TRIGGER IF EXISTS set_updated_at_events ON events;
CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table event_buvette_items
CREATE TABLE IF NOT EXISTS event_buvette_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur event_buvette_items
CREATE INDEX IF NOT EXISTS idx_buvette_items_event_id ON event_buvette_items(event_id);
CREATE INDEX IF NOT EXISTS idx_buvette_items_active ON event_buvette_items(is_active);

-- Trigger updated_at pour event_buvette_items
DROP TRIGGER IF EXISTS set_updated_at_buvette_items ON event_buvette_items;
CREATE TRIGGER set_updated_at_buvette_items
  BEFORE UPDATE ON event_buvette_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table event_payment_methods
CREATE TABLE IF NOT EXISTS event_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('cash', 'card', 'cheque', 'twint', 'other')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, method)
);

-- Index sur event_payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_event_id ON event_payment_methods(event_id);

-- Table event_tasks
CREATE TABLE IF NOT EXISTS event_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur event_tasks
CREATE INDEX IF NOT EXISTS idx_event_tasks_event_id ON event_tasks(event_id);

-- Trigger updated_at pour event_tasks
DROP TRIGGER IF EXISTS set_updated_at_event_tasks ON event_tasks;
CREATE TRIGGER set_updated_at_event_tasks
  BEFORE UPDATE ON event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table event_shifts
CREATE TABLE IF NOT EXISTS event_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_task_id UUID NOT NULL REFERENCES event_tasks(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  required_count INTEGER NOT NULL CHECK (required_count >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur event_shifts
CREATE INDEX IF NOT EXISTS idx_event_shifts_task_id ON event_shifts(event_task_id);

-- Trigger updated_at pour event_shifts
DROP TRIGGER IF EXISTS set_updated_at_event_shifts ON event_shifts;
CREATE TRIGGER set_updated_at_event_shifts
  BEFORE UPDATE ON event_shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
