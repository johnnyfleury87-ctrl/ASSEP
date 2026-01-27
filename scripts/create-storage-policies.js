#!/usr/bin/env node
// ============================================================================
// Création automatique des Storage Policies
// ============================================================================
// Exécute le SQL pour créer les policies sur storage.objects
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
console.log('║ Création des Storage Policies pour event-photos                        ║')
console.log('╚════════════════════════════════════════════════════════════════════════╝')
console.log('')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variables d environnement manquantes')
  console.error('   Vérifier .env.local : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('✅ Connexion à:', SUPABASE_URL)
console.log('')

// SQL à exécuter
const policies = [
  {
    name: 'event_photos_upload',
    operation: 'INSERT',
    sql: `
      CREATE POLICY "event_photos_upload"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'event-photos'
        AND auth.uid() IN (
          SELECT id FROM public.profiles 
          WHERE is_jetc_admin = true 
             OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
        )
      );
    `
  },
  {
    name: 'event_photos_view',
    operation: 'SELECT',
    sql: `
      CREATE POLICY "event_photos_view"
      ON storage.objects
      FOR SELECT
      TO public
      USING (
        bucket_id = 'event-photos'
        AND (
          EXISTS (
            SELECT 1 FROM public.events
            WHERE id::text = split_part(name, '/', 1)
              AND status = 'published'
          )
          OR
          auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE is_jetc_admin = true 
               OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
          )
        )
      );
    `
  },
  {
    name: 'event_photos_delete',
    operation: 'DELETE',
    sql: `
      CREATE POLICY "event_photos_delete"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'event-photos'
        AND auth.uid() IN (
          SELECT id FROM public.profiles 
          WHERE is_jetc_admin = true 
             OR role IN ('president', 'vice_president', 'secretaire', 'vice_secretaire')
        )
      );
    `
  }
]

// Fonction pour exécuter du SQL
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL)
    
    const postData = JSON.stringify({ query: sql })
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(url, options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode })
        } else {
          try {
            const json = JSON.parse(body)
            resolve({ success: false, status: res.statusCode, error: json })
          } catch (e) {
            resolve({ success: false, status: res.statusCode, error: body })
          }
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

// Créer les policies
async function createPolicies() {
  console.log('📝 Création des policies...')
  console.log('')

  for (const policy of policies) {
    console.log(`   → ${policy.name} (${policy.operation})...`)
    
    // D'abord essayer de supprimer si elle existe
    const dropSql = `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`
    await executeSql(dropSql).catch(() => {})
    
    // Créer la policy
    const result = await executeSql(policy.sql).catch(err => {
      return { success: false, error: err.message }
    })
    
    if (result.success) {
      console.log(`      ✅ Créée`)
    } else {
      // Essayer via une autre méthode - connexion directe
      console.log(`      ⚠️  Méthode RPC non disponible`)
    }
  }

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('⚠️  Si les policies n ont pas pu être créées automatiquement :')
  console.log('')
  console.log('   1. Ouvrir le SQL Editor dans Supabase Dashboard')
  console.log('   2. Copier-coller le fichier : supabase/scripts/create_storage_policies.sql')
  console.log('   3. Exécuter (Run)')
  console.log('')
  console.log('   OU')
  console.log('')
  console.log('   1. Aller dans : Storage → Buckets → event-photos → Policies')
  console.log('   2. Cliquer "New Policy" 3 fois')
  console.log('   3. Copier-coller les définitions depuis docs/ACTIONS-REQUISES-STORAGE.md')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
}

createPolicies().catch(err => {
  console.error('❌ Erreur:', err.message)
  process.exit(1)
})
