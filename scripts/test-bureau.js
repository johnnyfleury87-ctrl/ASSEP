// Script de test pour vérifier la configuration du bureau
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lire .env.local manuellement
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBureau() {
  console.log('\n🔍 Test de la configuration Bureau\n');
  
  // 1. Vérifier la table
  console.log('1️⃣ Vérification de la table bureau_members...');
  const { data: existing, error: fetchError } = await supabase
    .from('bureau_members')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Erreur:', fetchError.message);
    return;
  }
  
  console.log(`✅ Table bureau_members existe`);
  console.log(`   ${existing.length} membre(s) trouvé(s)\n`);
  
  if (existing.length > 0) {
    console.log('Membres actuels:');
    existing.forEach(m => {
      console.log(`  - ${m.name} (${m.role}) ${m.is_active ? '✅' : '❌ inactif'}`);
    });
    console.log('');
  }
  
  // 2. Tester l'insertion d'un membre de test
  console.log('2️⃣ Test d\'insertion d\'un membre...');
  const { data: newMember, error: insertError } = await supabase
    .from('bureau_members')
    .insert({
      role: 'president',
      name: 'Marie Dupont',
      bio: 'Présidente de l\'ASSEP depuis 2026',
      display_order: 0,
      is_active: true
    })
    .select()
    .single();
  
  if (insertError) {
    if (insertError.code === '23505') {
      console.log('⚠️  Un président existe déjà (c\'est normal)');
    } else {
      console.error('❌ Erreur d\'insertion:', insertError.message);
    }
  } else {
    console.log('✅ Membre créé avec succès:');
    console.log(`   ID: ${newMember.id}`);
    console.log(`   Nom: ${newMember.name}`);
    console.log(`   Rôle: ${newMember.role}\n`);
  }
  
  // 3. Vérifier l'API publique
  console.log('3️⃣ Test de l\'API GET /api/admin/bureau...');
  try {
    const response = await fetch(`${supabaseUrl.replace(/supabase.co.*/, 'supabase.co')}/api/admin/bureau`);
    
    // Note: en local, l'API Next.js n'est pas accessible depuis ce script
    // Cette partie nécessite que le serveur Next.js soit lancé
    console.log('⚠️  Test API nécessite le serveur Next.js (npm run dev)');
  } catch (err) {
    console.log('⚠️  Test API nécessite le serveur Next.js (npm run dev)');
  }
  
  console.log('\n✅ Test terminé!\n');
  console.log('Pour tester complètement:');
  console.log('1. npm run dev');
  console.log('2. Ouvrir http://localhost:3000');
  console.log('3. Vérifier la section "Le Bureau de l\'ASSEP"\n');
}

testBureau().catch(console.error);
