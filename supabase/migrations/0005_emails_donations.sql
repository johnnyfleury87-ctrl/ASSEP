-- ============================================================================
-- Migration 0005: Emails et Donations
-- ============================================================================
-- Description: Gestion des campagnes email et donations
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- EMAIL_CAMPAIGNS TABLE
-- ============================================================================
-- Campagnes d'emails envoyées par l'association

CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations de la campagne
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Audience
  recipient_type TEXT NOT NULL CHECK (
    recipient_type IN ('all', 'members', 'custom')
  ),
  recipient_emails TEXT[], -- Liste d'emails si custom
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'failed')
  ),
  
  -- Statistiques
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ,
  
  -- Traçabilité
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX idx_email_campaigns_created_by ON public.email_campaigns(created_by);

-- ============================================================================
-- DONATIONS TABLE
-- ============================================================================
-- Donations reçues par l'association

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations donateur
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  
  -- Montant
  amount DECIMAL(10,2) NOT NULL,
  
  -- Type et statut
  donation_type TEXT NOT NULL DEFAULT 'one-time' CHECK (
    donation_type IN ('one-time', 'monthly', 'annual')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  ),
  
  -- Lien événement (don pour un événement spécifique)
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Paiement
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Communication
  comms_opt_in BOOLEAN NOT NULL DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_donations_event_id ON public.donations(event_id);
CREATE INDEX idx_donations_donor_email ON public.donations(donor_email);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER set_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_donations_updated_at
  BEFORE UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.email_campaigns IS 'Campagnes email envoyées aux membres';
COMMENT ON TABLE public.donations IS 'Donations reçues (one-time, monthly, annual)';
