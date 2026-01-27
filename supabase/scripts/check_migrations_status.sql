-- ============================================================================
-- Vérification de l'état des migrations
-- ============================================================================
-- Ce script vérifie quelles migrations ont été appliquées et leur état
-- Date: 2026-01-27
-- ============================================================================

\echo '╔════════════════════════════════════════════════════════════════════════╗'
\echo '║ VÉRIFICATION DES MIGRATIONS APPLIQUÉES                                 ║'
\echo '╚════════════════════════════════════════════════════════════════════════╝'
\echo ''

-- ============================================================================
-- 1. Migrations Supabase appliquées
-- ============================================================================
\echo '📋 Migrations appliquées (table supabase_migrations.schema_migrations):'
\echo ''

SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY version;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 2. Tables créées dans le schema public
-- ============================================================================
\echo '🗄️  Tables existantes dans schema public:'
\echo ''

SELECT 
  tablename AS "Table",
  (SELECT count(*) FROM information_schema.columns WHERE table_name = tablename) AS "Colonnes"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 3. Vérification migration 0011 (Buvette)
-- ============================================================================
\echo '🍺 Migration 0011 - Buvette et inscriptions:'
\echo ''

-- Colonnes ajoutées sur events
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'events'
  AND column_name IN ('buvette_active', 'signups_enabled')
ORDER BY column_name;

\echo ''
\echo 'Table event_products:'

SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_products'
  ) AS "Existe",
  (
    SELECT count(*) FROM information_schema.columns 
    WHERE table_name = 'event_products'
  ) AS "Nb colonnes";

\echo ''
\echo 'Trigger prevent_product_modification_if_published:'

SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'event_products'
  AND trigger_name = 'prevent_product_modification';

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 4. Vérification migration 0012 (Photos)
-- ============================================================================
\echo '📸 Migration 0012 - Photos événements:'
\echo ''

\echo 'Table event_photos:'

SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'event_photos'
  ) AS "Existe",
  (
    SELECT count(*) FROM information_schema.columns 
    WHERE table_name = 'event_photos'
  ) AS "Nb colonnes",
  (
    SELECT count(*) FROM event_photos
  ) AS "Photos uploadées";

\echo ''
\echo 'Contrainte unique sur is_cover:'

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'event_photos'
  AND indexname = 'idx_event_photos_unique_cover';

\echo ''
\echo 'Triggers sur event_photos:'

SELECT 
  trigger_name,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'event_photos'
ORDER BY trigger_name;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 5. Storage - Buckets
-- ============================================================================
\echo '🗂️  Storage Buckets:'
\echo ''

SELECT 
  id AS "Bucket ID",
  name AS "Nom",
  public AS "Public",
  file_size_limit AS "Limite taille",
  allowed_mime_types AS "Types MIME"
FROM storage.buckets
ORDER BY name;

\echo ''
\echo '⚠️  Note: Les policies Storage ne sont pas dans storage.policies'
\echo '   Elles doivent être vérifiées via Dashboard Supabase'
\echo ''

\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 6. Policies RLS sur tables publiques
-- ============================================================================
\echo '🔐 Row Level Security Policies:'
\echo ''

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('events', 'event_products', 'event_photos')
ORDER BY tablename, policyname;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 7. Fonctions helper
-- ============================================================================
\echo '⚙️  Fonctions helper créées:'
\echo ''

SELECT 
  routine_name AS "Fonction",
  routine_type AS "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'can_manage_events',
    'is_jetc_admin', 
    'is_president_or_vice',
    'check_event_photos_limit',
    'check_photo_modification_permissions',
    'prevent_product_modification_if_published',
    'get_event_photo_url'
  )
ORDER BY routine_name;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''

-- ============================================================================
-- 8. Résumé final
-- ============================================================================
\echo '✅ RÉSUMÉ DE L''ÉTAT DES MIGRATIONS:'
\echo ''

WITH migration_check AS (
  SELECT 
    'events table' AS item,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') AS exists,
    'Migration 0002' AS migration
  UNION ALL
  SELECT 
    'buvette_active column',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'buvette_active'),
    'Migration 0011'
  UNION ALL
  SELECT 
    'signups_enabled column',
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'signups_enabled'),
    'Migration 0011'
  UNION ALL
  SELECT 
    'event_products table',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_products'),
    'Migration 0011'
  UNION ALL
  SELECT 
    'event_photos table',
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'event_photos'),
    'Migration 0012'
  UNION ALL
  SELECT 
    'event-photos bucket',
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'event-photos'),
    'Configuration manuelle'
)
SELECT 
  item AS "Élément",
  CASE WHEN exists THEN '✅ OK' ELSE '❌ MANQUANT' END AS "Statut",
  migration AS "Source"
FROM migration_check
ORDER BY migration, item;

\echo ''
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
\echo ''
\echo '📝 ACTIONS REQUISES:'
\echo ''
\echo '   Si "event-photos bucket" est ❌ MANQUANT :'
\echo '   → Créer le bucket manuellement dans Dashboard Supabase'
\echo '   → Voir: docs/CONFIGURATION-STORAGE-PHOTOS.md'
\echo ''
\echo '   Si "event_photos table" est ❌ MANQUANT :'
\echo '   → Exécuter: supabase db push (ou appliquer migration 0012)'
\echo ''
\echo '╔════════════════════════════════════════════════════════════════════════╗'
\echo '║ FIN DE LA VÉRIFICATION                                                  ║'
\echo '╚════════════════════════════════════════════════════════════════════════╝'
