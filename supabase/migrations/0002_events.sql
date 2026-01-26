-- ============================================================================
-- Migration 0002: Événements
-- ============================================================================
-- Description: Tables pour la gestion des événements ASSEP
-- Date: 2026-01-26
-- ============================================================================

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Événements organisés par l'ASSEP (courses, manifestations sportives)

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Informations de base
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Dates et lieu
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  
  -- Logistique
  max_participants INTEGER,
  registration_deadline TIMESTAMPTZ,
  
  -- Workflow de publication (NOUVEAU)
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_approval', 'published', 'closed', 'archived')
  ),
  
  -- Validation par président ou vice-président (NOUVEAU)
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Traçabilité
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_approved_by ON public.events(approved_by);

-- ============================================================================
-- EVENT_SHIFTS TABLE
-- ============================================================================
-- Créneaux de bénévolat pour un événement

CREATE TABLE IF NOT EXISTS public.event_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Informations du créneau
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Capacité
  max_volunteers INTEGER NOT NULL DEFAULT 1,
  current_volunteers INTEGER NOT NULL DEFAULT 0,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_times CHECK (end_time > start_time),
  CONSTRAINT check_volunteers CHECK (current_volunteers <= max_volunteers)
);

-- Index
CREATE INDEX idx_event_shifts_event_id ON public.event_shifts(event_id);
CREATE INDEX idx_event_shifts_times ON public.event_shifts(start_time, end_time);

-- ============================================================================
-- EVENT_VOLUNTEERS TABLE
-- ============================================================================
-- Assignations des bénévoles aux créneaux

CREATE TABLE IF NOT EXISTS public.event_volunteers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES public.event_shifts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (
    status IN ('confirmed', 'cancelled', 'completed')
  ),
  
  -- Notes
  notes TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Un bénévole ne peut être assigné qu'une fois par créneau
  UNIQUE(shift_id, profile_id)
);

-- Index
CREATE INDEX idx_event_volunteers_event_id ON public.event_volunteers(event_id);
CREATE INDEX idx_event_volunteers_shift_id ON public.event_volunteers(shift_id);
CREATE INDEX idx_event_volunteers_profile_id ON public.event_volunteers(profile_id);
CREATE INDEX idx_event_volunteers_status ON public.event_volunteers(status);

-- ============================================================================
-- EVENT_TASKS TABLE
-- ============================================================================
-- Tâches à réaliser pour un événement

CREATE TABLE IF NOT EXISTS public.event_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Informations de la tâche
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  
  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  
  -- Dates
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_event_tasks_event_id ON public.event_tasks(event_id);
CREATE INDEX idx_event_tasks_assigned_to ON public.event_tasks(assigned_to);
CREATE INDEX idx_event_tasks_status ON public.event_tasks(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_event_shifts_updated_at
  BEFORE UPDATE ON public.event_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_event_volunteers_updated_at
  BEFORE UPDATE ON public.event_volunteers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_event_tasks_updated_at
  BEFORE UPDATE ON public.event_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.events IS 'Événements organisés par ASSEP avec workflow de validation';
COMMENT ON COLUMN public.events.status IS 'draft -> pending_approval -> published (validé par président/vice)';
COMMENT ON COLUMN public.events.approved_by IS 'Président ou vice-président qui a validé l''événement';
