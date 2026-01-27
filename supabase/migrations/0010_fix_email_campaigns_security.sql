-- ============================================================================
-- Migration 0010: Correction sécurité email_campaigns
-- ============================================================================
-- Description: Corriger la RLS policy pour permettre aux secrétaires d'accéder
--              aux campagnes email (actuellement bloqués)
-- Date: 2026-01-27
-- Urgence: CRITIQUE - Faille de sécurité + fonctionnalité bloquée
-- ============================================================================

-- ============================================================================
-- 1. CORRIGER LA RLS POLICY POUR INCLURE LES SECRÉTAIRES
-- ============================================================================

-- Supprimer l'ancienne policy (trop restrictive)
DROP POLICY IF EXISTS "email_campaigns_all_admin" ON public.email_campaigns;
DROP POLICY IF EXISTS "email_campaigns_all_comms" ON public.email_campaigns;

-- Créer la nouvelle policy incluant secrétaires et vice-secrétaires
CREATE POLICY "email_campaigns_all_comms"
  ON public.email_campaigns FOR ALL
  TO authenticated
  USING (
    public.is_jetc_admin() 
    OR public.is_president_or_vice()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaire', 'vice_secretaire')
    )
  )
  WITH CHECK (
    public.is_jetc_admin() 
    OR public.is_president_or_vice()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('secretaire', 'vice_secretaire')
    )
  );

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON POLICY "email_campaigns_all_comms" ON public.email_campaigns IS 
'Président, vice-président, secrétaire, vice-secrétaire et JETC admin peuvent gérer les campagnes email (RGPD opt-in)';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Pour vérifier que la policy fonctionne, exécuter en tant que secrétaire:
-- SELECT * FROM email_campaigns; (devrait fonctionner)

