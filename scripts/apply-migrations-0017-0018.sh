#!/bin/bash
# Script pour appliquer les migrations 0017 et 0018 via Supabase

echo "🔧 Application des migrations RLS - ASSEP"
echo "=========================================="
echo ""

# Vérifier que DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Erreur: DATABASE_URL n'est pas défini"
  echo "Définissez-le avec: export DATABASE_URL='votre_url_supabase'"
  exit 1
fi

echo "📋 Migrations à appliquer:"
echo "  - 0017_fix_event_volunteers_rls.sql"
echo "  - 0018_fix_events_delete_rls.sql"
echo ""

read -p "Continuer? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Annulé"
  exit 1
fi

echo ""
echo "🚀 Application migration 0017..."
psql "$DATABASE_URL" -f supabase/migrations/0017_fix_event_volunteers_rls.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration 0017 appliquée"
else
  echo "❌ Erreur migration 0017"
  exit 1
fi

echo ""
echo "🚀 Application migration 0018..."
psql "$DATABASE_URL" -f supabase/migrations/0018_fix_events_delete_rls.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration 0018 appliquée"
else
  echo "❌ Erreur migration 0018"
  exit 1
fi

echo ""
echo "🎉 Toutes les migrations sont appliquées!"
echo ""
echo "📝 Vérifications à faire:"
echo "  1. Dashboard > Événements > [Événement] > Bénévoles (affiche les inscrits)"
echo "  2. Dashboard > Événements (bouton Supprimer visible)"
echo "  3. /espace-membres (formulaire inscription complet)"
echo "  4. Page d'accueil (solde trésorerie affiché)"
echo ""
