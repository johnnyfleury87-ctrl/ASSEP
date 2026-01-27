-- ============================================================================
-- Migration 0012: Photos d'événements
-- ============================================================================
-- Description: Gestion photos événements avec Storage Supabase
-- Date: 2026-01-27
-- Auteur: Système ASSEP
-- ============================================================================

-- ============================================================================
-- TABLE: event_photos
-- ============================================================================
-- Photos uploadées pour un événement

CREATE TABLE IF NOT EXISTS public.event_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Lien événement
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  
  -- Stockage
  storage_path TEXT NOT NULL UNIQUE,
  
  -- Métadonnées
  caption TEXT,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Traçabilité
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_is_cover ON public.event_photos(is_cover);
CREATE INDEX IF NOT EXISTS idx_event_photos_display_order ON public.event_photos(event_id, display_order);

COMMENT ON TABLE public.event_photos IS 'Photos uploadées pour les événements';
COMMENT ON COLUMN public.event_photos.storage_path IS 'Chemin dans le bucket Supabase Storage event-photos';
COMMENT ON COLUMN public.event_photos.is_cover IS 'Photo de couverture affichée dans liste événements (1 seule par événement)';
COMMENT ON COLUMN public.event_photos.display_order IS 'Ordre d''affichage dans la galerie (0 = premier)';

-- ============================================================================
-- CONTRAINTE: Une seule photo de couverture par événement
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_photos_unique_cover
  ON public.event_photos(event_id)
  WHERE is_cover = true;

COMMENT ON INDEX public.idx_event_photos_unique_cover IS 
  'Garantit qu''un événement n''a qu''une seule photo de couverture';

-- ============================================================================
-- FONCTION: Vérifier limite 20 photos par événement
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_event_photos_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_photo_count INTEGER;
BEGIN
  -- Compter photos existantes pour cet événement
  SELECT COUNT(*) INTO v_photo_count
  FROM public.event_photos
  WHERE event_id = NEW.event_id;
  
  -- Limiter à 20 photos
  IF v_photo_count >= 20 THEN
    RAISE EXCEPTION 'Limite atteinte : maximum 20 photos par événement';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_photos_limit_before_insert
  BEFORE INSERT ON public.event_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_event_photos_limit();

-- ============================================================================
-- FONCTION: Empêcher suppression/modification cover si publié (sauf admin)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_photo_modification_permissions()
RETURNS TRIGGER AS $$
DECLARE
  v_event_status TEXT;
  v_is_admin BOOLEAN;
  v_is_president BOOLEAN;
BEGIN
  -- Récupérer le statut de l'événement
  SELECT status INTO v_event_status
  FROM public.events
  WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  
  -- Vérifier si l'utilisateur est admin/président
  SELECT 
    COALESCE(is_jetc_admin, false),
    COALESCE(role IN ('president', 'vice_president'), false)
  INTO v_is_admin, v_is_president
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Si événement publié ET modification/suppression cover
  IF v_event_status = 'published' THEN
    -- DELETE ou UPDATE de is_cover
    IF (TG_OP = 'DELETE' AND OLD.is_cover = true) OR
       (TG_OP = 'UPDATE' AND OLD.is_cover = true AND NEW.is_cover = false) THEN
      -- Autoriser uniquement admin/président
      IF NOT (v_is_admin OR v_is_president) THEN
        RAISE EXCEPTION 'Seul le président ou admin peut modifier/supprimer la photo de couverture d''un événement publié';
      END IF;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_photo_permissions_before_modification
  BEFORE UPDATE OR DELETE ON public.event_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_photo_modification_permissions();

-- ============================================================================
-- RLS POLICIES: event_photos
-- ============================================================================

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- Public peut voir les photos des événements publiés
DROP POLICY IF EXISTS "event_photos_select_public" ON public.event_photos;
CREATE POLICY "event_photos_select_public"
  ON public.event_photos FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_photos.event_id
      AND events.status = 'published'
    )
  );

-- Gestionnaires d'événements peuvent voir toutes les photos
DROP POLICY IF EXISTS "event_photos_select_managers" ON public.event_photos;
CREATE POLICY "event_photos_select_managers"
  ON public.event_photos FOR SELECT
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- Gestionnaires d'événements peuvent uploader des photos
DROP POLICY IF EXISTS "event_photos_insert_managers" ON public.event_photos;
CREATE POLICY "event_photos_insert_managers"
  ON public.event_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    (is_jetc_admin() OR is_president_or_vice() OR can_manage_events())
    AND uploaded_by = auth.uid()
  );

-- Gestionnaires d'événements peuvent modifier/supprimer
-- (Le trigger gère les restrictions si événement publié)
DROP POLICY IF EXISTS "event_photos_update_managers" ON public.event_photos;
CREATE POLICY "event_photos_update_managers"
  ON public.event_photos FOR UPDATE
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  )
  WITH CHECK (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

DROP POLICY IF EXISTS "event_photos_delete_managers" ON public.event_photos;
CREATE POLICY "event_photos_delete_managers"
  ON public.event_photos FOR DELETE
  TO authenticated
  USING (
    is_jetc_admin() OR is_president_or_vice() OR can_manage_events()
  );

-- ============================================================================
-- STORAGE BUCKET: event-photos
-- ============================================================================
-- NOTE: Cette partie doit être exécutée via l'interface Supabase Storage
-- ou via l'API Supabase Management

-- Commandes à exécuter manuellement dans Supabase Dashboard :
-- 1. Créer bucket "event-photos" (public: false)
-- 2. Configurer policies Storage :

/*
-- Policy: Gestionnaires peuvent uploader
CREATE POLICY "event_photos_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos'
  AND (auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE is_jetc_admin = true 
       OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
  ))
);

-- Policy: Public peut voir si événement publié
CREATE POLICY "event_photos_view_public"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'event-photos'
  AND (
    -- Extraire event_id du path (format: event-photos/{event_id}/{filename})
    -- et vérifier que l'événement est publié
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id::text = split_part(name, '/', 1)
      AND status = 'published'
    )
    OR
    -- Ou autoriser si utilisateur est gestionnaire
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE is_jetc_admin = true 
         OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
    )
  )
);

-- Policy: Gestionnaires peuvent supprimer
CREATE POLICY "event_photos_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos'
  AND (auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE is_jetc_admin = true 
       OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
  ))
);
*/

-- ============================================================================
-- HELPER: Obtenir URL publique d'une photo
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_event_photo_url(p_storage_path TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Retourne l'URL publique Supabase Storage
  -- Format: https://{project_ref}.supabase.co/storage/v1/object/public/event-photos/{path}
  RETURN format(
    'https://%s.supabase.co/storage/v1/object/public/event-photos/%s',
    current_setting('app.settings.project_ref', true),
    p_storage_path
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION public.get_event_photo_url IS 
  'Génère l''URL publique Supabase Storage pour une photo';

-- ============================================================================
-- VÉRIFICATIONS
-- ============================================================================

-- Vérifier table event_photos
SELECT 
  table_name, 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'event_photos') as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'event_photos';

-- Vérifier contrainte unique cover
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'event_photos' 
  AND indexname = 'idx_event_photos_unique_cover';

-- Vérifier policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'event_photos'
ORDER BY policyname;

-- Vérifier triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'event_photos'
ORDER BY trigger_name;

-- ============================================================================
-- INSTRUCTIONS POST-MIGRATION
-- ============================================================================

/*
⚠️ ACTIONS MANUELLES REQUISES APRÈS CETTE MIGRATION :

1. Créer le bucket Storage "event-photos" dans Supabase Dashboard
   - Aller dans Storage > Create bucket
   - Nom : event-photos
   - Public : false (géré par RLS)
   - File size limit : 5MB
   - Allowed MIME types : image/jpeg, image/png, image/webp

2. Configurer les Storage Policies (voir commentaires SQL ci-dessus)
   - event_photos_upload
   - event_photos_view_public
   - event_photos_delete

3. Tester l'upload d'une photo test

4. Vérifier l'affichage public conditionné par status = 'published'
*/

-- ============================================================================
-- FIN MIGRATION 0012
-- ============================================================================
