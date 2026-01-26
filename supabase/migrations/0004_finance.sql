-- Migration 0004: Finance
-- Tables: event_cashups, ledger_entries

-- Table event_cashups (recettes par événement)
CREATE TABLE IF NOT EXISTS event_cashups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  cash_cents INTEGER NOT NULL DEFAULT 0,
  card_cents INTEGER NOT NULL DEFAULT 0,
  cheque_cents INTEGER NOT NULL DEFAULT 0,
  other_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index sur event_cashups
CREATE INDEX IF NOT EXISTS idx_cashups_event_id ON event_cashups(event_id);
CREATE INDEX IF NOT EXISTS idx_cashups_closed_at ON event_cashups(closed_at);

-- Trigger updated_at pour event_cashups
DROP TRIGGER IF EXISTS set_updated_at_cashups ON event_cashups;
CREATE TRIGGER set_updated_at_cashups
  BEFORE UPDATE ON event_cashups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table ledger_entries (trésorerie globale)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  label TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index sur ledger_entries
CREATE INDEX IF NOT EXISTS idx_ledger_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_event_id ON ledger_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_date ON ledger_entries(entry_date);

-- Trigger updated_at pour ledger_entries
DROP TRIGGER IF EXISTS set_updated_at_ledger ON ledger_entries;
CREATE TRIGGER set_updated_at_ledger
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
