#!/bin/bash
# ============================================================================
# Script de configuration du bucket Storage event-photos
# ============================================================================
# Ce script crée le bucket et les policies via l'API Supabase
# Utilise la clé service_role (doit être gardée secrète)
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════════════╗"
echo "║ Configuration du bucket Storage 'event-photos'                         ║"
echo "╚════════════════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier les variables d'environnement
if [ -z "$SUPABASE_URL" ]; then
  echo "❌ SUPABASE_URL non défini"
  echo "Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyxxx ./setup-storage.sh"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_KEY non défini"
  echo "Usage: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=eyxxx ./setup-storage.sh"
  exit 1
fi

# ============================================================================
# 1. Créer le bucket
# ============================================================================
echo "📦 Création du bucket 'event-photos'..."

BUCKET_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "event-photos",
    "name": "event-photos",
    "public": false,
    "file_size_limit": 5242880,
    "allowed_mime_types": ["image/jpeg", "image/png", "image/webp"]
  }')

if echo "$BUCKET_RESPONSE" | grep -q '"name":"event-photos"'; then
  echo "✅ Bucket 'event-photos' créé avec succès"
elif echo "$BUCKET_RESPONSE" | grep -q "already exists"; then
  echo "ℹ️  Bucket 'event-photos' existe déjà"
else
  echo "⚠️  Réponse: $BUCKET_RESPONSE"
fi

echo ""

# ============================================================================
# 2. Vérifier que le bucket existe
# ============================================================================
echo "🔍 Vérification du bucket..."

BUCKET_CHECK=$(curl -s -X GET "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")

if echo "$BUCKET_CHECK" | grep -q '"id":"event-photos"'; then
  echo "✅ Bucket 'event-photos' confirmé"
else
  echo "❌ Bucket 'event-photos' introuvable"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Configuration terminée !"
echo ""
echo "⚠️  IMPORTANT : Les Storage Policies doivent être créées via le Dashboard"
echo ""
echo "   1. Aller dans : ${SUPABASE_URL}/project/_/storage/buckets"
echo "   2. Cliquer sur 'event-photos' → Policies"
echo "   3. Créer 3 policies (voir docs/ACTIONS-REQUISES-STORAGE.md)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
