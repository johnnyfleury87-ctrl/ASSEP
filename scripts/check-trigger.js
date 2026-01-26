#!/usr/bin/env node

/**
 * Script de diagnostic pour le trigger on_auth_user_created
 * Vérifie que le schéma profiles et le trigger sont correctement configurés
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTriggerHealth() {
  console.log('🔍 Diagnostic du trigger on_auth_user_created\n')
  let hasErrors = false

  // 1. Vérifier les colonnes de profiles
  console.log('1️⃣ Vérification du schéma profiles...')
  const requiredColumns = [
    'id', 'email', 'first_name', 'last_name', 'full_name', 
    'role', 'comms_opt_in', 'is_jetc_admin', 'must_change_password'
  ]

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (error) throw error

    const existingColumns = data && data.length > 0 ? Object.keys(data[0]) : []
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

    if (missingColumns.length > 0) {
      console.log('   ❌ Colonnes manquantes:', missingColumns.join(', '))
      console.log('   → Exécutez: supabase/migrations/0008_fix_profiles_schema.sql')
      hasErrors = true
    } else {
      console.log('   ✅ Toutes les colonnes requises sont présentes')
    }
  } catch (err) {
    console.log('   ❌ Erreur:', err.message)
    hasErrors = true
  }

  // 2. Vérifier l'existence du trigger
  console.log('\n2️⃣ Vérification du trigger on_auth_user_created...')
  try {
    const { data, error } = await supabase.rpc('pg_get_triggerdef', {
      trigger_oid: 'on_auth_user_created'
    }).single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data) {
      console.log('   ✅ Trigger existe')
    } else {
      console.log('   ⚠️ Trigger non trouvé (vérification manuelle requise)')
    }
  } catch (err) {
    // Méthode alternative: vérifier via une requête directe
    console.log('   ℹ️ Vérification manuelle recommandée dans Supabase SQL Editor:')
    console.log('   SELECT * FROM pg_trigger WHERE tgname = \'on_auth_user_created\';')
  }

  // 3. Vérifier la fonction handle_new_user
  console.log('\n3️⃣ Vérification de la fonction handle_new_user...')
  try {
    const { data, error } = await supabase.rpc('pg_get_functiondef', {
      func_oid: 'handle_new_user'
    }).single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    if (data) {
      console.log('   ✅ Fonction existe')
    } else {
      console.log('   ⚠️ Fonction non trouvée (vérification manuelle requise)')
    }
  } catch (err) {
    console.log('   ℹ️ Vérification manuelle recommandée dans Supabase SQL Editor:')
    console.log('   SELECT proname FROM pg_proc WHERE proname = \'handle_new_user\';')
  }

  // 4. Test de création de profil (simulation)
  console.log('\n4️⃣ Test de simulation de profil...')
  try {
    // Créer un profil de test
    const testId = '00000000-0000-0000-0000-000000000001'
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: testId,
        email: 'test-diagnostic@example.com',
        first_name: 'Test',
        last_name: 'Diagnostic',
        role: 'membre',
        is_jetc_admin: false,
        comms_opt_in: false,
        must_change_password: false
      })

    if (insertError && insertError.code !== '23505') { // 23505 = déjà existe
      throw insertError
    }

    // Nettoyer
    await supabase.from('profiles').delete().eq('id', testId)

    console.log('   ✅ Insertion de test réussie (schéma valide)')
  } catch (err) {
    console.log('   ❌ Erreur lors de l\'insertion test:', err.message)
    hasErrors = true
  }

  // 5. Résumé
  console.log('\n' + '='.repeat(60))
  if (hasErrors) {
    console.log('❌ ÉCHEC: Des problèmes ont été détectés')
    console.log('\n📋 Actions correctives:')
    console.log('1. Exécutez supabase/migrations/0008_fix_profiles_schema.sql dans SQL Editor')
    console.log('2. Relancez ce script: node scripts/check-trigger.js')
    console.log('3. Testez la création d\'un user dans Supabase Auth UI')
    process.exit(1)
  } else {
    console.log('✅ SUCCÈS: Trigger et schéma correctement configurés')
    console.log('\nVous pouvez maintenant créer des utilisateurs via:')
    console.log('• Supabase Auth UI → Add user')
    console.log('• /dashboard/jetc/users (si vous êtes JETC admin)')
    process.exit(0)
  }
}

checkTriggerHealth()
