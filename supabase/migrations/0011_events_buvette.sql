-- ============================================================================
-- Migration 0011: Buvette et Inscriptions
-- ============================================================================
-- Description: Ajout fonctionnalités buvette et flag inscriptions pour événements
-- Date: 2026-01-27
-- Auteur: Système ASSEP
-- ============================================================================

-- ============================================================================
-- AJOUT COLONNES DANS EVENTS
-- ============================================================================

-- Activation buvette par événement
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS buvette_active BOOLEAN NOT NULL DEFAULT false;

-- Activation inscriptions participants par événement
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS signups_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.events.buvette_active IS 'Active la buvette pour cet événement';
COMMENT ON COLUMN public.events.signups_enabled IS 'Active les inscriptions publiques pour cet événement';

-- ============================================================================
-- TABLE: event_products
-- ============================================================================
-- Produits vendus à la buvette d'un événement

CREATE TABLE IF NOT EXISTS public.event_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien événement
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Informations produit
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  category TEXT,
  
  -- Gestion stock (optionnel)
  stock INTEGER CHECK (stock IS NULL OR stock >= 0),
  
  -- Activation/désactivation (sans supprimer)
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_event_products_event_id ON public.event_products(event_id);
CREATE INDEX IF NOT EXISTS idx_event_products_category ON public.event_products(category);
CREATE INDEX IF NOT EXISTS idx_event_products_is_active ON public.event_products(is_active);

-- Trigger updated_at
CREATE TRIGGER set_event_products_updated_at
  BEFORE UPDATE ON public.event_products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.event_products IS 'Produits vendus à la buvette d''un événement';
COMMENT ON COLUMN public.event_products.is_active IS 'Permet de désactiver un produit sans le supprimer';

-- ============================================================================
-- FONCTION: Empêcher modification produits si événement publié
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_product_modification_if_published()
RETURNS TRIGGER AS $$
DECLARE
  v_event_status TEXT;
BEGIN
  -- Récupérer le statut de l'événement
  SELECT status INTO v_event_status
  FROM public.events
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  -- Bloquer si événement publié
  IF v_event_status = 'published' THEN
    RAISE EXCEPTION 'Impossible de modifier les produits d''un événement publié. Repassez l''événement en brouillon.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur INSERT/UPDATE/DELETE
CREATE TRIGGER check_event_status_before_product_modification
  BEFORE INSERT OR UPDATE OR DELETE ON public.event_products
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_product_modification_if_published();

-- ============================================================================
-- RLS POLICIES: event_products
-- ============================================================================

ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;

-- Public peut voir les produits des événements publiés avec buvette active
DROP POLICY IF EXISTS "event_products_select_public" ON public.event_products;
CREATE POLICY "event_products_select_public"
  ON public.event_products FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_products.event_id
      AND events.status = 'published'
      AND events.buvette_active = true
    )
  );

-- Gestionnaires d'événements peuvent tout voir
DROP POLICY IF EXISTS "event_products_select_managers" ON public.event_products;
CREATE POLICY "event_products_select_managers"
  ON public.event_products FOR SELECT
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- Gestionnaires d'événements peuvent créer/modifier/supprimer
-- (Le trigger bloque si événement publié)
DROP POLICY IF EXISTS "event_products_all_managers" ON public.event_products;
CREATE POLICY "event_products_all_managers"
  ON public.event_products FOR ALL
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- ============================================================================
-- RLS POLICIES: Mise à jour signups (conditionnées par signups_enabled)
-- ============================================================================

-- Mettre à jour la policy INSERT pour vérifier signups_enabled
DROP POLICY IF EXISTS "signups_insert_public" ON public.signups;
CREATE POLICY "signups_insert_public"
  ON public.signups FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_id
      AND events.status = 'published'
      AND events.signups_enabled = true
    )
  );

COMMENT ON POLICY "signups_insert_public" ON public.signups IS 
  'Permet les inscriptions UNIQUEMENT si événement publié ET signups_enabled = true';

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier ajout colonnes events
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events' 
  AND column_name IN ('buvette_active', 'signups_enabled');

-- Vérifier table event_products
SELECT 
  table_name, 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'event_products') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'event_products';

-- Vérifier policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('event_products', 'signups')
ORDER BY tablename, policyname;

-- Vérifier trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'event_products'
  AND trigger_name = 'check_event_status_before_product_modification';

-- ============================================================================
-- FIN MIGRATION 0011
-- ============================================================================
