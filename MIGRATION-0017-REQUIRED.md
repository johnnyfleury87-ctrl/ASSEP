# 🚨 ACTION REQUISE : Appliquer la migration 0017

## Problème identifié

Les bénévoles inscrits n'apparaissent pas dans le dashboard bureau car :

1. ✅ **Corrigé dans le code** : La page utilisait la mauvaise table (`volunteer_signups` au lieu de `event_volunteers`)
2. ⚠️ **À corriger en base** : Les policies RLS manquent pour que le bureau puisse voir les bénévoles

## Solution

### Étape 1 : Appliquer la migration SQL

Allez sur [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/ifpsqzaskcfyoffcaagk/sql/new) et exécutez :

```sql
-- Migration: Fix event_volunteers RLS for bureau members
-- Date: 2026-02-02

BEGIN;

-- Les membres du bureau peuvent voir tous les bénévoles
CREATE POLICY "event_volunteers_select_bureau"
  ON public.event_volunteers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.is_jetc_admin = true
        OR p.role IN ('president', 'vice_president', 'tresorier', 'vice_tresorier', 'secretaire', 'vice_secretaire')
      )
    )
  );

-- Les bénévoles peuvent voir leurs propres inscriptions
CREATE POLICY "event_volunteers_select_own"
  ON public.event_volunteers FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

COMMIT;
```

### Étape 2 : Vérifier les policies

Toujours dans SQL Editor, exécutez :

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'event_volunteers'
ORDER BY policyname;
```

Vous devriez voir au minimum :
- `event_volunteers_select_bureau` (SELECT)
- `event_volunteers_select_own` (SELECT)
- `event_volunteers_count_public` (SELECT)
- `event_volunteers_insert_authenticated` (INSERT)
- `event_volunteers_update_own` (UPDATE)
- `event_volunteers_all_managers` (ALL)

### Étape 3 : Tester

1. Connectez-vous en tant que membre
2. Inscrivez-vous comme bénévole à un événement
3. Connectez-vous en tant que membre du bureau
4. Allez dans Dashboard → Événements → [votre événement] → Bénévoles
5. ✅ Vous devriez voir le bénévole inscrit avec son nom/prénom/email/téléphone

## Changements de code déployés

- ✅ [pages/dashboard/evenements/[id]/benevoles.js](../pages/dashboard/evenements/[id]/benevoles.js) : Utilise `event_volunteers` au lieu de `volunteer_signups`
- ✅ Jointure correcte avec `profiles` pour obtenir les données personnelles
- ✅ Export CSV mis à jour
- ✅ Commit fa766ec poussé sur GitHub

## Résultat attendu

- ✅ Les bénévoles inscrits apparaissent dans la liste bureau
- ✅ Le compteur "X bénévole(s) inscrit(s)" se met à jour
- ✅ Export CSV fonctionne correctement
- ✅ Pas de régression sur les événements existants

---

**Date** : 2026-02-02  
**Commit** : fa766ec  
**Migration** : 0017_fix_event_volunteers_rls.sql
