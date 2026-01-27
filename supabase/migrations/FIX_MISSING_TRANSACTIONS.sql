-- ============================================================================
-- SCRIPT COMPLET : Exécuter TOUTES les migrations manquantes
-- ============================================================================
-- ATTENTION : Ce script regroupe TOUTES les migrations qui n'ont pas été exécutées
-- Exécuter dans Supabase SQL Editor
-- ============================================================================

-- Vérifier d'abord quelles tables existent déjà avec :
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================================================
-- Si la table transactions N'EXISTE PAS, exécuter ceci :
-- ============================================================================

-- Migration 0004 : Finance (transactions)
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
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON public.transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_recorded_by ON public.transactions(recorded_by);

-- Trigger
DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_finance" ON public.transactions;
DROP POLICY IF EXISTS "transactions_all_finance" ON public.transactions;

CREATE POLICY "transactions_select_finance"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (can_manage_finance());

CREATE POLICY "transactions_all_finance"
  ON public.transactions FOR ALL
  TO authenticated
  USING (can_manage_finance())
  WITH CHECK (can_manage_finance());

COMMENT ON TABLE public.transactions IS 'Transactions financières (recettes/dépenses)';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Vérifier que la table existe
SELECT 
  table_name, 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'transactions') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'transactions';

-- Vérifier les policies RLS
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'transactions';
