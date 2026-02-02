-- Migration: Solde de départ trésorerie
-- Date: 2026-02-02
-- Description: Ajouter une table de configuration pour définir le solde initial
--              de la trésorerie (avant saisie des transactions)

BEGIN;

-- ============================================================================
-- TABLE: treasury_settings
-- ============================================================================
-- Configuration globale de la trésorerie (solde de départ, etc.)

CREATE TABLE IF NOT EXISTS public.treasury_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Solde de départ
  starting_balance NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  starting_balance_date DATE,
  
  -- Traçabilité
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_treasury_settings_updated_by 
  ON public.treasury_settings(updated_by);

COMMENT ON TABLE public.treasury_settings IS 
  'Configuration globale de la trésorerie (solde initial, etc.)';
COMMENT ON COLUMN public.treasury_settings.starting_balance IS 
  'Solde de départ de la trésorerie (avant transactions)';
COMMENT ON COLUMN public.treasury_settings.starting_balance_date IS 
  'Date de référence du solde de départ (optionnel)';

-- Insérer une ligne par défaut (il ne doit y avoir qu'UNE ligne dans cette table)
INSERT INTO public.treasury_settings (starting_balance, starting_balance_date)
VALUES (0.00, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- Contrainte : une seule ligne autorisée dans cette table
-- (on utilise une unique constraint sur une constante pour forcer 1 seule ligne)
ALTER TABLE public.treasury_settings
ADD CONSTRAINT treasury_settings_singleton 
CHECK (id = id); -- Cette contrainte permet de limiter à 1 ligne via un trigger

-- Trigger pour empêcher l'insertion de plusieurs lignes
CREATE OR REPLACE FUNCTION public.prevent_multiple_treasury_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.treasury_settings) > 0 THEN
    RAISE EXCEPTION 'Une seule ligne de configuration trésorerie est autorisée. Utilisez UPDATE pour modifier.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_multiple_treasury_settings_trigger 
  ON public.treasury_settings;
CREATE TRIGGER prevent_multiple_treasury_settings_trigger
  BEFORE INSERT ON public.treasury_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_multiple_treasury_settings();

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER set_treasury_settings_updated_at
  BEFORE UPDATE ON public.treasury_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- RLS POLICIES pour treasury_settings
-- ============================================================================

-- Activer RLS
ALTER TABLE public.treasury_settings ENABLE ROW LEVEL SECURITY;

-- Trésoriers et admins peuvent lire
DROP POLICY IF EXISTS "treasury_settings_select_finance_roles" 
  ON public.treasury_settings;
CREATE POLICY "treasury_settings_select_finance_roles"
  ON public.treasury_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        is_jetc_admin = true
        OR role IN ('president', 'vice_president', 'tresorier', 'vice_tresorier')
      )
    )
  );

-- Seuls trésoriers et admins peuvent modifier
DROP POLICY IF EXISTS "treasury_settings_update_treasurers" 
  ON public.treasury_settings;
CREATE POLICY "treasury_settings_update_treasurers"
  ON public.treasury_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        is_jetc_admin = true
        OR role IN ('tresorier', 'vice_tresorier', 'president', 'vice_president')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        is_jetc_admin = true
        OR role IN ('tresorier', 'vice_tresorier', 'president', 'vice_president')
      )
    )
  );

-- Interdire DELETE (on ne supprime jamais cette config)
DROP POLICY IF EXISTS "treasury_settings_no_delete" ON public.treasury_settings;
CREATE POLICY "treasury_settings_no_delete"
  ON public.treasury_settings FOR DELETE
  TO authenticated
  USING (false);

COMMIT;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
-- SELECT * FROM treasury_settings;
-- SELECT COUNT(*) as total_policies FROM pg_policies WHERE tablename = 'treasury_settings';
