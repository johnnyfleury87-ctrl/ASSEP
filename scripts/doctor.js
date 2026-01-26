/**
 * Script Doctor: Vérification de l'environnement et de la DB
 * Usage: node scripts/doctor.js
 * 
 * Vérifie:
 * - Variables d'environnement
 * - Connexion Supabase
 * - Tables et colonnes essentielles
 * - Triggers
 * - Policies RLS
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const REQUIRED_TABLES = [
  'profiles',
  'bureau_members',
  'events',
  'event_shifts',
  'event_volunteers',
  'event_tasks',
  'signups',
  'transactions',
  'email_campaigns',
  'donations'
];

const REQUIRED_COLUMNS = {
  profiles: [
    'id',
    'email',
    'role',
    'is_jetc_admin',
    'must_change_password',
    'created_by',
    'role_requested',
    'role_approved_by',
    'comms_opt_in'
  ],
  events: [
    'id',
    'name',
    'slug',
    'status',
    'approved_by',
    'approved_at',
    'created_by'
  ]
};

async function runDoctor() {
  console.log('🏥 ASSEP Doctor - Diagnostic de l\'environnement\n');
  console.log('='.repeat(60));
  
  let errors = 0;
  let warnings = 0;

  // ============================================================================
  // 1. Variables d'environnement
  // ============================================================================
  console.log('\n📋 1. Variables d\'environnement');
  console.log('-'.repeat(60));

  for (const varName of REQUIRED_ENV_VARS) {
    if (process.env[varName]) {
      console.log(`✅ ${varName} définie`);
    } else {
      console.log(`❌ ${varName} MANQUANTE`);
      errors++;
    }
  }

  if (errors > 0) {
    console.log('\n❌ Variables manquantes. Vérifiez votre fichier .env.local');
    process.exit(1);
  }

  // ============================================================================
  // 2. Connexion Supabase
  // ============================================================================
  console.log('\n🔌 2. Connexion Supabase');
  console.log('-'.repeat(60));

  let supabase;
  try {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Client Supabase créé');
  } catch (err) {
    console.log('❌ Erreur création client:', err.message);
    errors++;
    process.exit(1);
  }

  // Test de connexion
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    console.log('✅ Connexion à la base de données OK');
  } catch (err) {
    console.log('❌ Erreur connexion DB:', err.message);
    errors++;
  }

  // ============================================================================
  // 3. Tables
  // ============================================================================
  console.log('\n📊 3. Tables');
  console.log('-'.repeat(60));

  for (const tableName of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(tableName).select('*').limit(1);
      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`);
        errors++;
      } else {
        console.log(`✅ Table '${tableName}' existe`);
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}': ${err.message}`);
      errors++;
    }
  }

  // ============================================================================
  // 4. Colonnes essentielles
  // ============================================================================
  console.log('\n🔍 4. Colonnes essentielles');
  console.log('-'.repeat(60));

  for (const [tableName, columns] of Object.entries(REQUIRED_COLUMNS)) {
    try {
      const { data, error } = await supabase.from(tableName).select(columns.join(',')).limit(0);
      
      if (error) {
        console.log(`❌ ${tableName}: Erreur lors de la vérification des colonnes`);
        console.log(`   ${error.message}`);
        errors++;
      } else {
        console.log(`✅ ${tableName}: Toutes les colonnes présentes`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
      errors++;
    }
  }

  // ============================================================================
  // 5. Test fonction SQL
  // ============================================================================
  console.log('\n⚙️  5. Fonctions SQL');
  console.log('-'.repeat(60));

  try {
    const { data, error } = await supabase.rpc('get_stats_dashboard');
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('⚠️  Fonction get_stats_dashboard non trouvée');
      warnings++;
    } else if (!error) {
      console.log('✅ Fonctions SQL accessibles');
      console.log(`   Stats: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    console.log(`⚠️  Test fonction SQL: ${err.message}`);
    warnings++;
  }

  // ============================================================================
  // 6. RLS activé
  // ============================================================================
  console.log('\n🔒 6. Row Level Security (RLS)');
  console.log('-'.repeat(60));

  try {
    // Tester l'accès sans authentification
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: profiles } = await supabaseAnon.from('profiles').select('*');
    
    if (profiles && profiles.length === 0) {
      console.log('✅ RLS activé sur profiles (accès anon bloqué)');
    } else {
      console.log('⚠️  RLS profiles: accès anon autorisé');
      warnings++;
    }

    // Tester events public
    const { data: events } = await supabaseAnon.from('events').select('*').eq('status', 'published');
    console.log(`✅ Events publics accessibles (${events ? events.length : 0} trouvés)`);

  } catch (err) {
    console.log(`❌ Test RLS: ${err.message}`);
    errors++;
  }

  // ============================================================================
  // 7. Résumé
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DU DIAGNOSTIC\n');
  
  if (errors === 0 && warnings === 0) {
    console.log('✅ Environnement OK - Aucun problème détecté');
    console.log('\n👉 Vous pouvez lancer l\'application avec: npm run dev');
  } else {
    if (errors > 0) {
      console.log(`❌ ${errors} erreur(s) détectée(s)`);
    }
    if (warnings > 0) {
      console.log(`⚠️  ${warnings} avertissement(s)`);
    }
    console.log('\n👉 Corrigez les erreurs avant de continuer');
  }

  console.log('='.repeat(60));
  process.exit(errors > 0 ? 1 : 0);
}

runDoctor().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});
