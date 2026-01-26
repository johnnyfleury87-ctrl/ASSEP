-- ============================================================================
-- Migration 0004: Finance
-- ============================================================================
-- Description: Gestion financière (transactions, dons)
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
-- Transactions financières de l'association

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type et catégorie
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  
  -- Montant et description
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  
  -- Date
  transaction_date DATE NOT NULL,
  
  -- Lien événement (optionnel)
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Traçabilité
  recorded_by UUID REFERENCES public.profiles(id) NOT NULL,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_category ON public.transactions(category);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_event_id ON public.transactions(event_id);
CREATE INDEX idx_transactions_recorded_by ON public.transactions(recorded_by);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.transactions IS 'Transactions financières (recettes/dépenses)';
