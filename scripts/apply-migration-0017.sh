#!/bin/bash
# Script pour appliquer la migration 0017

set -e

echo "🚀 Application de la migration 0017_fix_event_volunteers_rls.sql"

# Variables d'environnement
source .env.local

# Appliquer la migration via psql
psql "$SUPABASE_DB_URL" -f supabase/migrations/0017_fix_event_volunteers_rls.sql

echo "✅ Migration appliquée avec succès"
