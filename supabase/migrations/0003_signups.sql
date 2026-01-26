-- ============================================================================
-- Migration 0003: Inscriptions
-- ============================================================================
-- Description: Gestion des inscriptions aux événements
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- SIGNUPS TABLE
-- ============================================================================
-- Inscriptions des participants aux événements

CREATE TABLE IF NOT EXISTS public.signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Informations participant
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  
  -- Informations complémentaires
  emergency_contact TEXT,
  emergency_phone TEXT,
  medical_info TEXT,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'attended')
  ),
  
  -- Paiement
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'paid', 'refunded')
  ),
  payment_amount DECIMAL(10,2),
  payment_method TEXT,
  
  -- Communication
  comms_opt_in BOOLEAN NOT NULL DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_signups_event_id ON public.signups(event_id);
CREATE INDEX idx_signups_email ON public.signups(email);
CREATE INDEX idx_signups_status ON public.signups(status);
CREATE INDEX idx_signups_payment_status ON public.signups(payment_status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER set_signups_updated_at
  BEFORE UPDATE ON public.signups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.signups IS 'Inscriptions des participants aux événements';
