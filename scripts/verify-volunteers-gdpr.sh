#!/bin/bash
# Script de vérification: Système bénévoles RGPD
# Date: 2026-02-02

echo "🔍 Vérification du système d'inscription bénévole RGPD"
echo "======================================================"
echo ""

# Vérifier que les fichiers existent
echo "📁 Vérification des fichiers..."

files=(
  "supabase/migrations/0016_secure_profiles_gdpr.sql"
  "pages/espace-membres.js"
  "pages/api/auth/signup-member.js"
  "components/VolunteerSignup.js"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (MANQUANT)"
    all_exist=false
  fi
done

echo ""

if [ "$all_exist" = false ]; then
  echo "❌ Certains fichiers sont manquants. Veuillez vérifier."
  exit 1
fi

echo "✅ Tous les fichiers sont présents"
echo ""

# Vérifier la migration SQL
echo "🗄️ Vérification de la migration 0016..."

if grep -q "volunteer_consent_given" supabase/migrations/0016_secure_profiles_gdpr.sql; then
  echo "  ✅ Champ volunteer_consent_given ajouté"
else
  echo "  ❌ Champ volunteer_consent_given manquant"
fi

if grep -q "profiles_select_own" supabase/migrations/0016_secure_profiles_gdpr.sql; then
  echo "  ✅ RLS profiles_select_own créée"
else
  echo "  ❌ RLS profiles_select_own manquante"
fi

if grep -q "profiles_select_bureau" supabase/migrations/0016_secure_profiles_gdpr.sql; then
  echo "  ✅ RLS profiles_select_bureau créée"
else
  echo "  ❌ RLS profiles_select_bureau manquante"
fi

echo ""

# Vérifier la page espace-membres
echo "🌐 Vérification de la page espace-membres..."

if grep -q "gdprConsent" pages/espace-membres.js; then
  echo "  ✅ Champ consentement RGPD présent"
else
  echo "  ❌ Champ consentement RGPD manquant"
fi

if grep -q "Protection des données personnelles" pages/espace-membres.js; then
  echo "  ✅ Texte RGPD présent"
else
  echo "  ❌ Texte RGPD manquant"
fi

if grep -q "/api/auth/signup-member" pages/espace-membres.js; then
  echo "  ✅ Appel API signup-member configuré"
else
  echo "  ❌ Appel API signup-member manquant"
fi

echo ""

# Vérifier l'API signup-member
echo "🔌 Vérification de l'API signup-member..."

if grep -q "volunteerConsent" pages/api/auth/signup-member.js; then
  echo "  ✅ Validation consentement RGPD"
else
  echo "  ❌ Validation consentement RGPD manquante"
fi

if grep -q "supabaseAdmin" pages/api/auth/signup-member.js; then
  echo "  ✅ Utilise supabaseAdmin (service_role)"
else
  echo "  ❌ N'utilise pas supabaseAdmin"
fi

if grep -q "volunteer_consent_given" pages/api/auth/signup-member.js; then
  echo "  ✅ Enregistrement date consentement"
else
  echo "  ❌ Enregistrement date consentement manquant"
fi

echo ""

# Vérifier VolunteerSignup
echo "🙋 Vérification du composant VolunteerSignup..."

if grep -q "/espace-membres" components/VolunteerSignup.js; then
  echo "  ✅ Redirection vers /espace-membres"
else
  echo "  ❌ Redirection vers /espace-membres manquante"
fi

if grep -q "disposer d'un compte membre" components/VolunteerSignup.js; then
  echo "  ✅ Message utilisateur membre requis"
else
  echo "  ❌ Message utilisateur membre requis manquant"
fi

if grep -q "Merci pour votre engagement" components/VolunteerSignup.js; then
  echo "  ✅ Message succès inscription"
else
  echo "  ❌ Message succès inscription manquant"
fi

echo ""
echo "======================================================"
echo "✅ Vérification terminée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Appliquer la migration 0016 sur Supabase"
echo "  2. Tester inscription membre sur /espace-membres"
echo "  3. Tester inscription bénévole sur événement"
echo "  4. Vérifier RLS en production"
echo ""
echo "📖 Documentation: LIVRAISON-BENEVOLES-RGPD.md"
