// Script de diagnostic pour la trésorerie
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lire .env.local
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnostic() {
  console.log('\n🔍 Diagnostic Trésorerie\n');
  
  // 1. Vérifier la table transactions
  console.log('1️⃣ Vérification de la table transactions...');
  const { data: transactions, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { descending: true })
    .limit(5);
  
  if (fetchError) {
    console.error('❌ Erreur:', fetchError.message);
    return;
  }
  
  console.log(`✅ Table accessible`);
  console.log(`   ${transactions.length} transaction(s) récente(s)\n`);
  
  if (transactions.length > 0) {
    console.log('Dernières transactions:');
    transactions.forEach(t => {
      console.log(`  - ${t.transaction_date} | ${t.type === 'income' ? '📈 RECETTE' : '📉 DÉPENSE'} | ${t.amount}€ | ${t.description}`);
    });
    console.log('');
  }
  
  // 2. Calculer le solde
  console.log('2️⃣ Calcul du solde...');
  const { data: allTransactions, error: allError } = await supabase
    .from('transactions')
    .select('type, amount');
  
  if (allError) {
    console.error('❌ Erreur:', allError.message);
    return;
  }
  
  let balance = 0;
  allTransactions.forEach(t => {
    if (t.type === 'income') {
      balance += parseFloat(t.amount);
    } else {
      balance -= parseFloat(t.amount);
    }
  });
  
  console.log(`✅ Solde calculé: ${balance.toFixed(2)} €`);
  console.log(`   Recettes: ${allTransactions.filter(t => t.type === 'income').length}`);
  console.log(`   Dépenses: ${allTransactions.filter(t => t.type === 'expense').length}\n`);
  
  // 3. Vérifier les profils avec rôles financiers
  console.log('3️⃣ Vérification des gestionnaires financiers...');
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, role, is_jetc_admin')
    .in('role', ['tresorier', 'vice_tresorier', 'president', 'vice_president'])
    .or('is_jetc_admin.eq.true');
  
  if (profileError) {
    console.error('❌ Erreur:', profileError.message);
  } else {
    console.log(`✅ ${profiles.length} gestionnaire(s) financier(s):`);
    profiles.forEach(p => {
      const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email;
      console.log(`   - ${name} (${p.role}${p.is_jetc_admin ? ' + JETC Admin' : ''})`);
    });
  }
  
  console.log('\n✅ Diagnostic terminé!\n');
}

diagnostic().catch(console.error);
