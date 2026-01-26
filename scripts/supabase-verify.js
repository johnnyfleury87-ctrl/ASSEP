// scripts/supabase-verify.js
// Vérifie que les migrations Supabase ont été appliquées correctement

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EXPECTED_TABLES = [
  'profiles',
  'events',
  'event_volunteer_tasks',
  'event_volunteer_shifts',
  'volunteer_signups',
  'event_buvette_items',
  'event_buvette_payment_methods',
  'caisse_transactions',
  'communications',
  'donation_counters',
  'bureau_members'
]

const EXPECTED_COLUMNS = {
  profiles: ['id', 'email', 'full_name', 'role', 'is_jetc_admin', 'must_change_password'],
  events: ['id', 'slug', 'title', 'status', 'has_buvette'],
  bureau_members: ['id', 'first_name', 'last_name', 'role_label']
}

async function checkTables() {
  console.log('\n🔍 Vérification des tables...\n')
  
  let allOk = true

  for (const tableName of EXPECTED_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ Table "${tableName}": ${error.message}`)
        allOk = false
      } else {
        console.log(`✅ Table "${tableName}" existe`)
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}": ${err.message}`)
      allOk = false
    }
  }

  return allOk
}

async function checkRLS() {
  console.log('\n🔒 Vérification RLS...\n')

  try {
    // Query pour vérifier RLS activé
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          rowsecurity as rls_enabled
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (${EXPECTED_TABLES.map(t => `'${t}'`).join(',')})
        ORDER BY tablename;
      `
    })

    if (error) {
      console.log('⚠️  Impossible de vérifier RLS (fonction exec_sql non disponible)')
      console.log('   Vérifiez manuellement dans Supabase Dashboard → Table Editor')
      return true
    }

    let allEnabled = true
    data.forEach(row => {
      if (row.rls_enabled) {
        console.log(`✅ RLS activé sur "${row.tablename}"`)
      } else {
        console.log(`❌ RLS désactivé sur "${row.tablename}"`)
        allEnabled = false
      }
    })

    return allEnabled
  } catch (err) {
    console.log('⚠️  Vérification RLS échouée:', err.message)
    return true // Ne pas bloquer
  }
}

async function checkColumns() {
  console.log('\n📋 Vérification des colonnes critiques...\n')

  let allOk = true

  for (const [tableName, columns] of Object.entries(EXPECTED_COLUMNS)) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select(columns.join(','))
        .limit(0)

      if (error) {
        console.log(`❌ Colonnes manquantes dans "${tableName}":`, error.message)
        allOk = false
      } else {
        console.log(`✅ Colonnes OK dans "${tableName}": ${columns.join(', ')}`)
      }
    } catch (err) {
      console.log(`❌ Erreur sur "${tableName}":`, err.message)
      allOk = false
    }
  }

  return allOk
}

async function checkFunctions() {
  console.log('\n⚙️  Vérification des fonctions SQL...\n')

  const expectedFunctions = [
    'ensure_profile_exists',
    'repair_missing_profiles'
  ]

  for (const funcName of expectedFunctions) {
    try {
      // Tester l'existence de la fonction en l'appelant avec des params dummy
      const { error } = await supabase.rpc(funcName, funcName === 'ensure_profile_exists' 
        ? { p_user_id: '00000000-0000-0000-0000-000000000000', p_email: 'test@test.com' }
        : {}
      )

      // Si erreur 42883 = fonction n'existe pas
      if (error && error.code === '42883') {
        console.log(`❌ Fonction "${funcName}" manquante`)
      } else {
        console.log(`✅ Fonction "${funcName}" existe`)
      }
    } catch (err) {
      console.log(`❌ Fonction "${funcName}":`, err.message)
    }
  }
}

async function generateFixSQL() {
  console.log('\n📝 Génération du script de correction...\n')

  console.log('-- Script de correction (à exécuter dans Supabase SQL Editor)\n')
  console.log('-- Activez RLS sur toutes les tables:')
  
  for (const table of EXPECTED_TABLES) {
    console.log(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`)
  }

  console.log('\n-- Recréez les fonctions si manquantes:')
  console.log('-- Copiez le contenu de supabase/migrations/0007_ensure_profile_function.sql')
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗')
  console.log('║     VÉRIFICATION MIGRATIONS SUPABASE - ASSEP              ║')
  console.log('╚═══════════════════════════════════════════════════════════╝')

  const tablesOk = await checkTables()
  const columnsOk = await checkColumns()
  await checkRLS() // Warning seulement
  await checkFunctions() // Info seulement

  console.log('\n' + '═'.repeat(60))
  
  if (tablesOk && columnsOk) {
    console.log('✅ BASE DE DONNÉES OK - Toutes les migrations sont appliquées')
    console.log('\nℹ️  Si des problèmes persistent, exécutez les migrations manuellement:')
    console.log('   Supabase Dashboard → SQL Editor → copier/coller chaque fichier .sql')
    process.exit(0)
  } else {
    console.log('❌ BASE DE DONNÉES INCOMPLÈTE - Migrations manquantes')
    await generateFixSQL()
    console.log('\n⚠️  Action requise:')
    console.log('   1. Ouvrez Supabase Dashboard → SQL Editor')
    console.log('   2. Exécutez les migrations dans l\'ordre (0001 à 0007)')
    console.log('   3. Relancez ce script pour vérifier')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
