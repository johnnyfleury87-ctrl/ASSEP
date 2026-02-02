// Script pour appliquer la migration 0017
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Application de la migration 0017_fix_event_volunteers_rls.sql')
  
  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/0017_fix_event_volunteers_rls.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')
    
    // Exécuter la migration via RPC
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ Erreur lors de l\'application de la migration:', error)
      
      // Essayer méthode alternative: exécuter les commandes une par une
      console.log('\n📝 Essai méthode alternative...')
      
      // Extraire les commandes SQL individuelles
      const commands = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd && !cmd.startsWith('--') && cmd !== 'BEGIN' && cmd !== 'COMMIT')
      
      for (const command of commands) {
        console.log(`\nExécution: ${command.substring(0, 80)}...`)
        
        // Utiliser une requête directe
        const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: command })
        
        if (cmdError) {
          console.error(`❌ Erreur:`, cmdError.message)
        } else {
          console.log('✅ OK')
        }
      }
      
      console.log('\n⚠️  Migration appliquée partiellement. Vérifier les erreurs ci-dessus.')
      return
    }
    
    console.log('✅ Migration appliquée avec succès')
    
  } catch (err) {
    console.error('❌ Erreur:', err)
    process.exit(1)
  }
}

applyMigration()
