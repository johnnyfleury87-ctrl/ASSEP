-- ============================================================================
-- Seed Data
-- ============================================================================
-- Description: Données de test pour développement
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- VARIABLES
-- ============================================================================
-- On utilise des variables PL/pgSQL explicites pour éviter les bugs

DO $$
DECLARE
  v_president_id UUID;
  v_vice_id UUID;
  v_tresorier_id UUID;
  v_secretaire_id UUID;
  v_membre_id UUID;
  
  v_event_draft_id UUID;
  v_event_pending_id UUID;
  v_event_published_id UUID;
  
  v_shift1_id UUID;
  v_shift2_id UUID;
  
  v_task1_id UUID;
  v_task2_id UUID;
BEGIN

  -- ============================================================================
  -- PROFILES (exemples - à créer via dashboard Supabase pour les vrais)
  -- ============================================================================
  -- NOTE: Ces profiles sont des exemples pour le seed
  -- En production, les vrais users sont créés via Dashboard Supabase ou API JETC
  
  RAISE NOTICE 'Seed: création des profils exemples...';
  
  -- Ces IDs sont fictifs, remplacer par de vrais IDs après création via dashboard
  -- ou ne pas créer du tout (juste les événements/tâches)
  
  -- ============================================================================
  -- BUREAU_MEMBERS (affichage public)
  -- ============================================================================
  
  RAISE NOTICE 'Seed: création des membres du bureau...';
  
  INSERT INTO public.bureau_members (role, name, bio, display_order, is_active)
  VALUES 
    ('president', 'Jean Dupont', 'Président de l''ASSEP depuis 2024', 1, true),
    ('vice_president', 'Marie Martin', 'Vice-présidente, en charge des événements', 2, true),
    ('tresorier', 'Pierre Durand', 'Trésorier, gestion comptable', 3, true),
    ('secretaire', 'Sophie Bernard', 'Secrétaire, communications', 4, true);
  
  -- ============================================================================
  -- EVENTS
  -- ============================================================================
  
  RAISE NOTICE 'Seed: création des événements...';
  
  -- Récupère un user existant pour created_by (ou utilise le premier trouvé)
  SELECT id INTO v_president_id FROM public.profiles WHERE role = 'president' LIMIT 1;
  
  -- Si aucun président, on utilise le premier user
  IF v_president_id IS NULL THEN
    SELECT id INTO v_president_id FROM public.profiles LIMIT 1;
  END IF;
  
  -- Event 1: Draft
  INSERT INTO public.events (
    name,
    slug,
    description,
    event_date,
    location,
    max_participants,
    status,
    created_by
  ) VALUES (
    'Course des Étoiles 2026',
    'course-etoiles-2026',
    'Course de 10km nocturne dans les rues de la ville.',
    '2026-06-15 20:00:00+02',
    'Centre-ville',
    200,
    'draft',
    COALESCE(v_president_id, gen_random_uuid())
  ) RETURNING id INTO v_event_draft_id;
  
  -- Event 2: Pending approval
  INSERT INTO public.events (
    name,
    slug,
    description,
    event_date,
    location,
    max_participants,
    status,
    created_by
  ) VALUES (
    'Trail des Collines',
    'trail-collines-2026',
    'Trail de 25km avec 800m de dénivelé.',
    '2026-05-10 09:00:00+02',
    'Collines du Nord',
    150,
    'pending_approval',
    COALESCE(v_president_id, gen_random_uuid())
  ) RETURNING id INTO v_event_pending_id;
  
  -- Event 3: Published (approuvé)
  INSERT INTO public.events (
    name,
    slug,
    description,
    event_date,
    location,
    max_participants,
    registration_deadline,
    status,
    approved_by,
    approved_at,
    created_by
  ) VALUES (
    'Marathon du Printemps',
    'marathon-printemps-2026',
    'Marathon 42km avec parcours homologué FFA.',
    '2026-04-20 08:30:00+02',
    'Stade Municipal',
    500,
    '2026-04-10 23:59:59+02',
    'published',
    COALESCE(v_president_id, gen_random_uuid()),
    NOW() - INTERVAL '2 days',
    COALESCE(v_president_id, gen_random_uuid())
  ) RETURNING id INTO v_event_published_id;
  
  -- ============================================================================
  -- EVENT_SHIFTS (pour event published)
  -- ============================================================================
  
  RAISE NOTICE 'Seed: création des créneaux bénévoles...';
  
  INSERT INTO public.event_shifts (
    event_id,
    name,
    description,
    start_time,
    end_time,
    max_volunteers
  ) VALUES 
    (
      v_event_published_id,
      'Accueil participants',
      'Accueil et distribution des dossards',
      '2026-04-20 07:00:00+02',
      '2026-04-20 08:30:00+02',
      5
    ),
    (
      v_event_published_id,
      'Ravitaillement km 20',
      'Distribution eau et ravitaillement',
      '2026-04-20 09:30:00+02',
      '2026-04-20 12:00:00+02',
      8
    )
  RETURNING id INTO v_shift1_id;
  
  -- ============================================================================
  -- EVENT_TASKS
  -- ============================================================================
  
  RAISE NOTICE 'Seed: création des tâches...';
  
  INSERT INTO public.event_tasks (
    event_id,
    name,
    description,
    status,
    due_date
  ) VALUES 
    (
      v_event_published_id,
      'Commander les médailles',
      'Commander 500 médailles finisher',
      'pending',
      '2026-03-20'
    ),
    (
      v_event_published_id,
      'Réserver les barrières',
      'Réserver barrières de sécurité auprès de la mairie',
      'in_progress',
      '2026-03-15'
    ),
    (
      v_event_draft_id,
      'Valider le parcours',
      'Faire valider le parcours par la police municipale',
      'pending',
      '2026-05-01'
    ),
    (
      v_event_pending_id,
      'Assurance événement',
      'Souscrire assurance responsabilité civile',
      'pending',
      '2026-04-01'
    );
  
  -- ============================================================================
  -- FIN
  -- ============================================================================
  
  RAISE NOTICE 'Seed: terminé avec succès!';
  RAISE NOTICE '  - % événements créés', 3;
  RAISE NOTICE '  - % créneaux bénévoles', 2;
  RAISE NOTICE '  - % tâches', 4;
  RAISE NOTICE '  - % membres bureau', 4;

END $$;
