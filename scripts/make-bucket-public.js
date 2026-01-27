#!/usr/bin/env node
// ============================================================================
// Rendre le bucket event-photos PUBLIC
// ============================================================================

const fs = require('fs')
const https = require('https')
const path = require('path')

// Charger .env.local
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

console.log('╔════════════════════════════════════════════════════════════════════════╗')
console.log('║ Rendre le bucket event-photos PUBLIC                                   ║')
console.log('╚════════════════════════════════════════════════════════════════════════╝')
console.log('')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variables manquantes')
  process.exit(1)
}

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

async function makeBucketPublic() {
  console.log('📦 Mise à jour du bucket event-photos en PUBLIC...')
  console.log('')
  
  const { status, data } = await makeRequest('PUT', '/storage/v1/bucket/event-photos', {
    public: true
  })
  
  if (status === 200) {
    console.log('✅ Bucket event-photos est maintenant PUBLIC')
    console.log('')
    console.log('Les photos seront accessibles via :')
    console.log(`${SUPABASE_URL}/storage/v1/object/public/event-photos/...`)
    console.log('')
  } else {
    console.log('⚠️  Réponse:', status, data)
  }
}

makeBucketPublic().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})
