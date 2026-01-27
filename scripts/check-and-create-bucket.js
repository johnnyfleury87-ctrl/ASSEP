#!/usr/bin/env node
// ============================================================================
// Vérification et création du bucket Storage event-photos
// ============================================================================
// Usage: node scripts/check-and-create-bucket.js
// ============================================================================

const fs = require('fs')
const https = require('https')
const path = require('path')

// Charger .env.local manuellement
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET_NAME = 'event-photos'

console.log('╔════════════════════════════════════════════════════════════════════════╗')
console.log('║ Vérification du bucket Storage "event-photos"                          ║')
console.log('╚════════════════════════════════════════════════════════════════════════╝')
console.log('')

// Vérifier variables d environnement
if (!SUPABASE_URL) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL non défini dans .env.local')
  console.error('   Ajouter : NEXT_PUBLIC_SUPABASE_URL=https://votreprojet.supabase.co')
  process.exit(1)
}

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY non défini dans .env.local')
  console.error('   Cette clé est nécessaire pour créer le bucket')
  console.error('   Récupérer depuis : Dashboard Supabase → Settings → API')
  console.error('')
  console.error('⚠️  ALTERNATIVE : Créer le bucket manuellement via Dashboard')
  console.error('   1. Aller sur : ' + SUPABASE_URL.replace('//', '//supabase.com/dashboard/project/').replace('.supabase.co', '/storage/buckets'))
  console.error('   2. Cliquer "New bucket"')
  console.error('   3. Name: event-photos, Public: NON, Size: 5242880, MIME: image/jpeg,image/png,image/webp')
  console.error('')
  process.exit(1)
}

console.log('✅ Variables d environnement OK')
console.log('   SUPABASE_URL:', SUPABASE_URL)
console.log('')

// Fonction pour faire une requête HTTPS
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL)
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY
      }
    }

    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          resolve({ status: res.statusCode, data: json })
        } catch (err) {
          resolve({ status: res.statusCode, data: body })
        }
      })
    })

    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// Vérifier si le bucket existe
async function checkBucket() {
  console.log('🔍 Vérification du bucket "event-photos"...')
  
  try {
    const { status, data } = await makeRequest('GET', '/storage/v1/bucket')
    
    if (Array.isArray(data)) {
      const bucket = data.find(b => b.id === BUCKET_NAME || b.name === BUCKET_NAME)
      if (bucket) {
        console.log('✅ Bucket "event-photos" existe déjà')
        console.log('   ID:', bucket.id)
        console.log('   Public:', bucket.public)
        console.log('   Limite taille:', bucket.file_size_limit, 'bytes (' + Math.round(bucket.file_size_limit / 1024 / 1024) + 'MB)')
        console.log('')
        return true
      }
    }
    
    console.log('❌ Bucket "event-photos" introuvable')
    console.log('')
    return false
  } catch (err) {
    console.error('❌ Erreur vérification:', err.message)
    return false
  }
}

// Créer le bucket
async function createBucket() {
  console.log('📦 Création du bucket "event-photos"...')
  
  const bucketConfig = {
    id: BUCKET_NAME,
    name: BUCKET_NAME,
    public: false,
    file_size_limit: 5242880, // 5MB
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  }
  
  try {
    const { status, data } = await makeRequest('POST', '/storage/v1/bucket', bucketConfig)
    
    if (status === 200 || status === 201) {
      console.log('✅ Bucket créé avec succès !')
      console.log('')
      return true
    } else if (status === 409 || (data.message && data.message.includes('already exists'))) {
      console.log('ℹ️  Bucket existe déjà (normal)')
      console.log('')
      return true
    } else {
      console.error('❌ Erreur création (HTTP', status, '):', data.message || data)
      console.log('')
      return false
    }
  } catch (err) {
    console.error('❌ Erreur création:', err.message)
    console.log('')
    return false
  }
}

// Fonction principale
async function main() {
  const exists = await checkBucket()
  
  if (!exists) {
    const created = await createBucket()
    
    if (created) {
      // Vérifier à nouveau
      await checkBucket()
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('⚠️  IMPORTANT : Créer les Storage Policies')
  console.log('')
  console.log('   Les policies RLS sur le bucket ne peuvent pas être créées via API.')
  console.log('   Elles doivent être créées manuellement :')
  console.log('')
  console.log('   1. Aller sur : ' + SUPABASE_URL + '/project/_/storage/buckets')
  console.log('   2. Cliquer sur "event-photos" → Policies')
  console.log('   3. Créer 3 policies (voir docs/ACTIONS-REQUISES-STORAGE.md)')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err.message)
  process.exit(1)
})
