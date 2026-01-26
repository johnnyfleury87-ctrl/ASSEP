-- Migration 0005: Emails & Donations
-- Tables: email_campaigns, email_logs, donation_counters

-- Table email_campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index sur email_campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON email_campaigns(created_by);

-- Trigger updated_at pour email_campaigns
DROP TRIGGER IF EXISTS set_updated_at_campaigns ON email_campaigns;
CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Table email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index sur email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Table donation_counters (compteurs manuels simples)
CREATE TABLE IF NOT EXISTS donation_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  amount_cents_total INTEGER NOT NULL DEFAULT 0 CHECK (amount_cents_total >= 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (event_id)
);

-- Index sur donation_counters
CREATE INDEX IF NOT EXISTS idx_donation_counters_event_id ON donation_counters(event_id);

-- Trigger updated_at pour donation_counters
DROP TRIGGER IF EXISTS set_updated_at_donation_counters ON donation_counters;
CREATE TRIGGER set_updated_at_donation_counters
  BEFORE UPDATE ON donation_counters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Compteur général (event_id NULL)
INSERT INTO donation_counters (id, event_id, amount_cents_total, notes)
VALUES (gen_random_uuid(), NULL, 0, 'Compteur général de dons')
ON CONFLICT (event_id) DO NOTHING;
