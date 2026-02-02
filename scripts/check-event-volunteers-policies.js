// Script pour vérifier les policies RLS sur event_volunteers
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function checkPolicies() {
  console.log('🔍 Vérification des policies RLS sur event_volunteers\n')
  
  try {
    // Requête pour lister les policies
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, roles')
      .eq('tablename', 'event_volunteers')
      .order('policyname')
    
    if (error) {
      console.error('❌ Erreur:', error)
      console.log('\n⚠️  La vue pg_policies n\'est peut-être pas accessible.')
      console.log('📝 Allez sur Supabase Dashboard → SQL Editor et exécutez:')
      console.log('\nSELECT policyname, cmd FROM pg_policies WHERE tablename = \'event_volunteers\';')
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  Aucune policy trouvée sur event_volunteers')
    } else {
      console.log(`✅ ${data.length} policy/policies trouvée(s):\n`)
      data.forEach(policy => {
        console.log(`  - ${policy.policyname} (${policy.cmd})`)
      })
    }
    
    console.log('\n📊 Pour voir plus de détails, exécutez sur Supabase Dashboard:')
    console.log('SELECT * FROM pg_policies WHERE tablename = \'event_volunteers\';')
    
  } catch (err) {
    console.error('❌ Erreur:', err)
  }
}

checkPolicies()
