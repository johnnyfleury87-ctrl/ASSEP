#!/bin/bash

# =========================================================
# Script de configuration des variables Vercel via CLI
# =========================================================
# Ce script configure automatiquement les variables d'environnement
# sur Vercel pour le projet ASSEP
#
# Prérequis: Vercel CLI installé et authentifié
#   npm i -g vercel
#   vercel login
# =========================================================

set -e

echo "🚀 Configuration des variables d'environnement Vercel pour ASSEP"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI n'est pas installé${NC}"
    echo ""
    echo "Installation:"
    echo "  npm i -g vercel"
    echo "  vercel login"
    exit 1
fi

echo -e "${BLUE}📦 Vérification de la connexion Vercel...${NC}"
vercel whoami

echo ""
echo -e "${BLUE}🔧 Ajout des variables d'environnement...${NC}"
echo ""

# Variables Supabase (depuis .env.local)
SUPABASE_URL="https://ifpsqzaskcfyoffcaagk.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0Mzg4NTQsImV4cCI6MjA4NTAxNDg1NH0.EayrZ5LEn9nkPOONqahAplC0t2IO7KftbatgZLEm1dA"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHNxemFza2NmeW9mZmNhYWdrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQzODg1NCwiZXhwIjoyMDg1MDE0ODU0fQ.K4009aYPrqC5MAKWguJAt6XOEzymztzv1iRuugP3T7A"

# Fonction pour ajouter une variable
add_env_var() {
    local name=$1
    local value=$2
    local environments=$3
    
    echo -e "${BLUE}➕ Ajout de ${name}...${NC}"
    
    if [ "$environments" = "all" ]; then
        vercel env add "$name" production preview development <<< "$value" 2>/dev/null || echo "⚠️  Variable déjà existante, ignorée"
    else
        vercel env add "$name" "$environments" <<< "$value" 2>/dev/null || echo "⚠️  Variable déjà existante, ignorée"
    fi
}

# Ajouter les variables (tous les environnements)
echo "1/3 - NEXT_PUBLIC_SUPABASE_URL"
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "all"

echo ""
echo "2/3 - NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "all"

echo ""
echo "3/3 - SUPABASE_SERVICE_ROLE_KEY"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "all"

echo ""
echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "⚠️  IMPORTANT : Vous devez maintenant redéployer le projet"
echo ""
echo "Option 1 - Via Git (recommandé):"
echo "  git add ."
echo "  git commit -m \"fix: configure Vercel env variables\""
echo "  git push"
echo ""
echo "Option 2 - Via Vercel CLI:"
echo "  vercel --prod"
echo ""
