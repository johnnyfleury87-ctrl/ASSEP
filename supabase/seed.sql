-- supabase/seed.sql
-- Données de test pour démarrer rapidement
-- À exécuter APRÈS les migrations 0001-0006

-- ============================================================================
-- IMPORTANT: Adapter ces données à votre contexte
-- ============================================================================

-- Insérer des membres du bureau (exemple)
INSERT INTO bureau_members (title, name, photo_url, sort_order, is_visible) VALUES
  ('Président', 'Jean Dupont', NULL, 1, true),
  ('Vice-Présidente', 'Marie Martin', NULL, 2, true),
  ('Trésorière', 'Sophie Bernard', NULL, 3, true),
  ('Secrétaire', 'Pierre Durand', NULL, 4, true)
ON CONFLICT DO NOTHING;

-- Insérer un événement de test
INSERT INTO events (slug, title, theme, location, starts_at, ends_at, has_buvette, status, created_at)
VALUES (
  'kermesse-2026',
  'Kermesse de l''école',
  'Fête de fin d''année',
  'Cour de l''école Hubert Reeves',
  '2026-06-20 14:00:00+02',
  '2026-06-20 18:00:00+02',
  true,
  'published',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Récupérer l'ID de l'événement pour la suite
DO $$
DECLARE
  event_id UUID;
BEGIN
  SELECT id INTO event_id FROM events WHERE slug = 'kermesse-2026';

  -- Articles de buvette
  INSERT INTO event_buvette_items (event_id, name, price_cents, currency, is_active) VALUES
    (event_id, 'Café', 100, 'EUR', true),
    (event_id, 'Thé', 100, 'EUR', true),
    (event_id, 'Jus de fruits', 150, 'EUR', true),
    (event_id, 'Gâteau maison', 200, 'EUR', true),
    (event_id, 'Crêpe', 150, 'EUR', true)
  ON CONFLICT DO NOTHING;

  -- Moyens de paiement
  INSERT INTO event_payment_methods (event_id, method, details) VALUES
    (event_id, 'cash', 'Espèces acceptées'),
    (event_id, 'card', 'Carte bancaire via TPE'),
    (event_id, 'cheque', 'Chèques à l''ordre de ASSEP')
  ON CONFLICT DO NOTHING;

  -- Tâches bénévoles
  INSERT INTO event_tasks (event_id, label, description) VALUES
    (event_id, 'Mise en place', 'Installation des stands et décoration'),
    (event_id, 'Buvette', 'Service à la buvette'),
    (event_id, 'Stands jeux', 'Animation des stands de jeux'),
    (event_id, 'Rangement', 'Nettoyage et rangement de fin')
  ON CONFLICT DO NOTHING;

  -- Créneaux pour "Mise en place"
  INSERT INTO event_shifts (event_task_id, starts_at, ends_at, required_count)
  SELECT id, '2026-06-20 13:00:00+02', '2026-06-20 14:00:00+02', 5
  FROM event_tasks WHERE event_id = event_id AND label = 'Mise en place';

  -- Créneaux pour "Buvette" (2 créneaux)
  INSERT INTO event_shifts (event_task_id, starts_at, ends_at, required_count)
  SELECT id, '2026-06-20 14:00:00+02', '2026-06-20 16:00:00+02', 3
  FROM event_tasks WHERE event_id = event_id AND label = 'Buvette';

  INSERT INTO event_shifts (event_task_id, starts_at, ends_at, required_count)
  SELECT id, '2026-06-20 16:00:00+02', '2026-06-20 18:00:00+02', 3
  FROM event_tasks WHERE event_id = event_id AND label = 'Buvette';

  -- Créneaux pour "Stands jeux"
  INSERT INTO event_shifts (event_task_id, starts_at, ends_at, required_count)
  SELECT id, '2026-06-20 14:00:00+02', '2026-06-20 18:00:00+02', 4
  FROM event_tasks WHERE event_id = event_id AND label = 'Stands jeux';

  -- Créneaux pour "Rangement"
  INSERT INTO event_shifts (event_task_id, starts_at, ends_at, required_count)
  SELECT id, '2026-06-20 18:00:00+02', '2026-06-20 19:00:00+02', 6
  FROM event_tasks WHERE event_id = event_id AND label = 'Rangement';

  -- Compteur de dons pour cet événement
  INSERT INTO donation_counters (event_id, amount_cents_total, notes)
  VALUES (event_id, 0, 'Compteur de dons pour la kermesse 2026')
  ON CONFLICT (event_id) DO NOTHING;

END $$;

-- Quelques entrées de trésorerie (exemple)
INSERT INTO ledger_entries (type, label, amount_cents, currency, entry_date) VALUES
  ('income', 'Subvention mairie', 50000, 'EUR', '2026-01-15'),
  ('income', 'Cotisations membres', 30000, 'EUR', '2026-02-01'),
  ('expense', 'Achat matériel pédagogique', 15000, 'EUR', '2026-02-10'),
  ('expense', 'Assurance association', 12000, 'EUR', '2026-03-01')
ON CONFLICT DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Données de test insérées avec succès !';
  RAISE NOTICE 'Vous pouvez maintenant:';
  RAISE NOTICE '  1. Créer un utilisateur dans Supabase Auth';
  RAISE NOTICE '  2. Modifier son role dans profiles → president';
  RAISE NOTICE '  3. Vous connecter sur le site';
END $$;
