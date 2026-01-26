/**
 * Script: Test du workflow d'authentification
 * Usage: node scripts/check-auth-flow.js
 * 
 * Teste:
 * - Création d'un user via Admin API
 * - Trigger automatique de création de profil
 * - Confirmation automatique (auto-confirm)
 * - Accès avec le mot de passe temporaire
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const testEmail = `test-${Date.now()}@assep-test.local`;
const testPassword = 'ASSEP1234!';

async function testAuthFlow() {
  console.log('🔐 Test du workflow d\'authentification\n');
  console.log('='.repeat(60));

  let errors = 0;

  // Créer client admin
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n✅ Client admin créé\n');

  // ============================================================================
  // 1. Créer un user via Admin API
  // ============================================================================
  console.log('1️⃣  Création d\'un utilisateur test');
  console.log('-'.repeat(60));
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${testPassword}`);

  let userId;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // AUTO-CONFIRM
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'membre'
      }
    });

    if (error) {
      console.log(`❌ Erreur création user: ${error.message}`);
      errors++;
      process.exit(1);
    }

    userId = data.user.id;
    console.log(`✅ User créé: ${userId}`);
    console.log(`✅ Email confirmé: ${data.user.email_confirmed_at ? 'OUI' : 'NON'}`);

    if (!data.user.email_confirmed_at) {
      console.log('❌ Email NOT confirmed - auto-confirm a échoué');
      errors++;
    }

  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
    errors++;
    process.exit(1);
  }

  // Attendre que le trigger s'exécute
  console.log('\n⏳ Attente du trigger (1s)...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // ============================================================================
  // 2. Vérifier que le profil a été créé automatiquement
  // ============================================================================
  console.log('\n2️⃣  Vérification du profil (trigger)');
  console.log('-'.repeat(60));

  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.log('❌ Profil non trouvé - le trigger a échoué');
      console.log(`   Erreur: ${error?.message || 'Profil null'}`);
      errors++;
    } else {
      console.log('✅ Profil trouvé');
      console.log(`   Email: ${profile.email}`);
      console.log(`   Rôle: ${profile.role}`);
      console.log(`   JETC Admin: ${profile.is_jetc_admin ? 'OUI' : 'NON'}`);
      console.log(`   Must change password: ${profile.must_change_password ? 'OUI' : 'NON'}`);

      // Vérifications
      if (profile.must_change_password !== true) {
        console.log('⚠️  must_change_password devrait être true');
      }
      if (profile.role !== 'membre') {
        console.log('⚠️  Rôle devrait être membre par défaut');
      }
    }
  } catch (err) {
    console.log(`❌ Exception profil: ${err.message}`);
    errors++;
  }

  // ============================================================================
  // 3. Tester la connexion avec le password temporaire
  // ============================================================================
  console.log('\n3️⃣  Test de connexion');
  console.log('-'.repeat(60));

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (error) {
      console.log(`❌ Erreur connexion: ${error.message}`);
      errors++;
    } else {
      console.log('✅ Connexion réussie');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Session: ${data.session ? 'OK' : 'MANQUANTE'}`);
    }

    // Se déconnecter
    await supabaseClient.auth.signOut();

  } catch (err) {
    console.log(`❌ Exception connexion: ${err.message}`);
    errors++;
  }

  // ============================================================================
  // 4. Nettoyage: Supprimer le user de test
  // ============================================================================
  console.log('\n4️⃣  Nettoyage');
  console.log('-'.repeat(60));

  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      console.log(`⚠️  Erreur suppression user: ${error.message}`);
    } else {
      console.log('✅ User de test supprimé');
    }
  } catch (err) {
    console.log(`⚠️  Exception nettoyage: ${err.message}`);
  }

  // ============================================================================
  // 5. Résumé
  // ============================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS\n');

  if (errors === 0) {
    console.log('✅ Tous les tests sont passés');
    console.log('\n👉 Le workflow d\'authentification fonctionne correctement:');
    console.log('   - Création user via Admin API');
    console.log('   - Auto-confirm activé');
    console.log('   - Trigger de profil fonctionnel');
    console.log('   - Connexion avec password temporaire OK');
  } else {
    console.log(`❌ ${errors} erreur(s) détectée(s)`);
    console.log('\n👉 Vérifiez:');
    console.log('   - Les migrations sont bien appliquées');
    console.log('   - Le trigger handle_new_user existe');
    console.log('   - Les policies RLS sont configurées');
  }

  console.log('='.repeat(60));
  process.exit(errors > 0 ? 1 : 0);
}

testAuthFlow().catch(err => {
  console.error('💥 Erreur fatale:', err);
  process.exit(1);
});
