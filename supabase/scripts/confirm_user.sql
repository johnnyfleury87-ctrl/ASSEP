-- ============================================================================
-- Confirm User
-- ============================================================================
-- Description: Force la confirmation d'un user (si créé sans auto-confirm)
-- Usage: Remplacer 'email@example.com' par l'email du user à confirmer
-- ============================================================================

-- IMPORTANT: Normalement, tous les users créés par JETC sont auto-confirm
-- Ce script n'est utile que pour dépannage

UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  updated_at = NOW()
WHERE email = 'contact@jetc-immo.ch'; -- REMPLACER PAR L'EMAIL RÉEL

-- Vérification
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'contact@jetc-immo.ch';
