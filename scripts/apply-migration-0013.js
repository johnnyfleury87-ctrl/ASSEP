#!/usr/bin/env node
/**
 * Script pour appliquer la migration 0013_secretaires_full_edit.sql
 * Utilise supabaseAdmin pour exécuter le SQL
 */

const { supabaseAdmin } = require('../lib/supabaseAdmin')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  console.log('📦 Application de la migration 0013_secretaires_full_edit.sql...')
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/0013_secretaires_full_edit.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Exécuter via supabaseAdmin (nécessite des droits suffisants)
    const { error } = await supabaseAdmin.rpc('exec_sql', { query: sql })
    
    if (error) {
      // Si exec_sql n'existe pas, on essaie une approche alternative
      console.log('⚠️  exec_sql non disponible, application manuelle requise')
      console.log('📋 Exécutez le SQL suivant dans le SQL Editor de Supabase:')
      console.log('\n' + '='.repeat(80))
      console.log(sql)
      console.log('='.repeat(80) + '\n')
      process.exit(1)
    }
    
    console.log('✅ Migration appliquée avec succès!')
    process.exit(0)
    
  } catch (err) {
    console.error('❌ Erreur:', err.message)
    console.log('\n📋 Veuillez appliquer manuellement via Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/_/sql/new')
    process.exit(1)
  }
}

applyMigration()
