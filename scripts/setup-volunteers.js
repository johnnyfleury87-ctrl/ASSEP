#!/usr/bin/env node
/**
 * Script rapide pour appliquer les migrations et tester
 */

const { supabaseAdmin } = require('../lib/supabaseAdmin')

async function setup() {
  console.log('🔧 Configuration du système de bénévoles...\n')

  try {
    // 1. Vérifier si la colonne volunteer_target existe
    console.log('1️⃣ Vérification de la colonne volunteer_target...')
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('events')
      .select('volunteer_target')
      .limit(1)

    if (columnsError) {
      console.log('❌ La colonne volunteer_target n\'existe pas encore')
      console.log('📋 Veuillez appliquer la migration 0014_volunteers_simple_signup.sql')
      console.log('   → Ouvrez Supabase Dashboard → SQL Editor')
      console.log('   → Collez le contenu de supabase/migrations/0014_volunteers_simple_signup.sql')
      console.log('   → Exécutez\n')
      return
    }

    console.log('✅ La colonne volunteer_target existe\n')

    // 2. Vérifier les événements existants
    console.log('2️⃣ Liste des événements:')
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, name, slug, volunteer_target, status')
      .order('created_at', { ascending: false })
      .limit(5)

    if (eventsError) {
      console.error('❌ Erreur:', eventsError.message)
      return
    }

    if (!events || events.length === 0) {
      console.log('   Aucun événement trouvé')
      return
    }

    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.name} (${event.slug})`)
      console.log(`      Bénévoles: ${event.volunteer_target || 0} | Statut: ${event.status}`)
    })

    console.log('\n3️⃣ Pour activer les bénévoles sur un événement:')
    console.log('   → Allez dans Dashboard → Événements → Modifier')
    console.log('   → Définissez "Nombre de bénévoles recherchés" (ex: 5)')
    console.log('   → Enregistrez')
    console.log('   → Le bouton d\'inscription apparaîtra sur la page publique!\n')

    // 3. Compter les inscriptions actuelles
    console.log('4️⃣ Inscriptions bénévoles actuelles:')
    const { count: volunteerCount, error: countError } = await supabaseAdmin
      .from('event_volunteers')
      .select('id', { count: 'exact', head: true })
      .is('shift_id', null)
      .eq('status', 'confirmed')

    if (!countError) {
      console.log(`   ${volunteerCount || 0} inscription(s) au total\n`)
    }

    console.log('✅ Configuration terminée!')

  } catch (err) {
    console.error('❌ Erreur:', err.message)
  }
}

setup()
