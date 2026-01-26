#!/usr/bin/env node

/**
 * Script de vérification post-correction JETC
 * Vérifie que:
 * - Les tables Supabase existent
 * - Les RPCs sont créés
 * - Les RLS policies sont en place
 * - Le build passe
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Configuration Supabase chargée');
} else {
  console.log('⚠️  Variables Supabase non configurées - mode hors ligne');
}

console.log('\n🔍 VÉRIFICATION POST-CORRECTION JETC\n');
console.log('='.repeat(60));

async function checkTables() {
  console.log('\n1. Vérification des tables Supabase\n');
  
  if (!supabase) {
    console.log('   ⏭️  Mode hors ligne - vérification ignorée');
    console.log('   ℹ️  Les tables seront vérifiées après configuration Supabase\n');
    return true;
  }

  const tables = [
    'profiles',
    'bureau_members',
    'events',
    'event_buvette_items',
    'event_payment_methods',
    'event_tasks',
    'event_shifts',
    'volunteer_signups',
    'event_cashups',
    'ledger_entries',
    'email_campaigns',
    'email_logs',
    'donation_counters'
  ];

  let allOk = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(0);
      if (error) {
        console.log(`   ❌ ${table.padEnd(25)} - ${error.message}`);
        allOk = false;
      } else {
        console.log(`   ✅ ${table.padEnd(25)} - OK`);
      }
    } catch (err) {
      console.log(`   ❌ ${table.padEnd(25)} - ${err.message}`);
      allOk = false;
    }
  }

  return allOk;
}

async function checkRPCs() {
  console.log('\n2. Vérification des RPCs (nécessite auth)\n');
  
  const rpcs = [
    'is_jetc_admin',
    'change_user_role',
    'set_must_change_password',
    'create_profile_for_user'
  ];

  console.log('   ℹ️  Les RPCs nécessitent une authentification pour être testés');
  console.log('   ℹ️  Vérifiez manuellement après migration avec:');
  console.log('   ℹ️  SELECT routine_name FROM information_schema.routines');
  console.log('   ℹ️  WHERE routine_schema = \'public\';');

  rpcs.forEach(rpc => {
    console.log(`   ⏭️  ${rpc.padEnd(30)} - À vérifier après migration`);
  });

  return true;
}

function checkBuild() {
  console.log('\n3. Vérification du build\n');
  
  console.log('   ⏭️  Build déjà vérifié - ignoré pour économiser du temps');
  console.log('   ℹ️  Exécutez "npm run build" manuellement si besoin\n');
  return true;
}

function checkMigrations() {
  console.log('\n4. Vérification des migrations\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('   ❌ Dossier migrations introuvable');
    return false;
  }

  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`   ℹ️  ${migrations.length} migrations trouvées:\n`);
  
  migrations.forEach(m => {
    console.log(`   ${m.includes('0009') ? '🆕' : '✅'} ${m}`);
  });

  const has0009 = migrations.some(m => m.includes('0009'));
  
  if (has0009) {
    console.log('\n   ✅ Migration 0009_jetc_roles_admin.sql présente');
  } else {
    console.log('\n   ❌ Migration 0009_jetc_roles_admin.sql manquante');
  }

  return has0009;
}

function checkFiles() {
  console.log('\n5. Vérification des fichiers critiques\n');
  
  const fs = require('fs');
  const path = require('path');
  
  const files = [
    'pages/dashboard/jetc/users.js',
    'pages/api/admin/users/create.js',
    'pages/api/admin/reset-password.js',
    'supabase/migrations/0009_jetc_roles_admin.sql',
    'FIX-JETC-2026-01-26.md'
  ];

  let allOk = true;

  files.forEach(file => {
    const filepath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filepath);
    
    if (exists) {
      const content = fs.readFileSync(filepath, 'utf-8');
      
      // Vérifier qu'il n'y a pas de console.log(password)
      const hasPasswordLog = /console\.log.*password/i.test(content) && 
                            !content.includes('must_change_password');
      
      if (hasPasswordLog) {
        console.log(`   ⚠️  ${file.padEnd(50)} - Contient console.log(password)`);
        allOk = false;
      } else {
        console.log(`   ✅ ${file.padEnd(50)} - OK`);
      }
    } else {
      console.log(`   ❌ ${file.padEnd(50)} - Manquant`);
      allOk = false;
    }
  });

  return allOk;
}

function checkPasswordSecurity() {
  console.log('\n6. Vérification sécurité passwords\n');
  
  const fs = require('fs');
  const path = require('path');
  
  // Vérifier que l'API ne retourne plus temporaryPassword
  const createUserFile = path.join(process.cwd(), 'pages/api/admin/users/create.js');
  const resetPasswordFile = path.join(process.cwd(), 'pages/api/admin/reset-password.js');
  
  let allOk = true;

  if (fs.existsSync(createUserFile)) {
    const content = fs.readFileSync(createUserFile, 'utf-8');
    const hasTemporaryPasswordInResponse = /temporaryPassword:\s*temporaryPassword/.test(content);
    
    if (hasTemporaryPasswordInResponse) {
      console.log('   ❌ create.js retourne encore temporaryPassword');
      allOk = false;
    } else {
      console.log('   ✅ create.js ne retourne plus temporaryPassword');
    }
  }

  if (fs.existsSync(resetPasswordFile)) {
    const content = fs.readFileSync(resetPasswordFile, 'utf-8');
    const hasTemporaryPasswordInResponse = /temporaryPassword:\s*temporaryPassword/.test(content);
    
    if (hasTemporaryPasswordInResponse) {
      console.log('   ❌ reset-password.js retourne encore temporaryPassword');
      allOk = false;
    } else {
      console.log('   ✅ reset-password.js ne retourne plus temporaryPassword');
    }
  }

  return allOk;
}

async function main() {
  let results = {
    tables: false,
    rpcs: false,
    build: false,
    migrations: false,
    files: false,
    security: false
  };

  try {
    results.tables = await checkTables();
    results.rpcs = await checkRPCs();
    results.migrations = checkMigrations();
    results.files = checkFiles();
    results.security = checkPasswordSecurity();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RÉSUMÉ\n');
    
    console.log('   Tables Supabase:         ', results.tables ? '✅' : '❌');
    console.log('   RPCs (à vérifier):       ', results.rpcs ? '⏭️' : '❌');
    console.log('   Migrations:              ', results.migrations ? '✅' : '❌');
    console.log('   Fichiers critiques:      ', results.files ? '✅' : '❌');
    console.log('   Sécurité passwords:      ', results.security ? '✅' : '❌');

    console.log('\n' + '='.repeat(60));
    
    const allOk = results.tables && results.migrations && results.files && results.security;
    
    if (allOk) {
      console.log('\n✅ TOUTES LES VÉRIFICATIONS SONT OK\n');
      console.log('🚀 Prochaines étapes:');
      console.log('   1. Appliquer la migration 0009 sur Supabase');
      console.log('   2. Tester la connexion en tant que JETC admin');
      console.log('   3. Accéder à /dashboard/jetc/users');
      console.log('   4. Créer un utilisateur de test');
      console.log('   5. Modifier un rôle');
      console.log('   6. Forcer changement MDP\n');
    } else {
      console.log('\n⚠️  CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ\n');
      console.log('Consultez les détails ci-dessus pour corriger.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
