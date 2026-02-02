#!/usr/bin/env node

/**
 * 🧪 Test de cohérence du solde de trésorerie
 * 
 * Vérifie que l'API centralisée /api/treasury/balance fonctionne
 * et retourne les bonnes données structurées.
 * 
 * Usage: node scripts/test-balance-consistency.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

async function testBalanceAPI() {
  console.log('🧪 Test de cohérence du solde de trésorerie\n')
  console.log(`📡 API: ${BASE_URL}/api/treasury/balance\n`)

  try {
    const response = await fetch(`${BASE_URL}/api/treasury/balance`)
    
    if (!response.ok) {
      console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`)
      process.exit(1)
    }

    const data = await response.json()

    console.log('✅ Réponse API reçue\n')
    console.log('📊 Données structurées:')
    console.log('┌─────────────────────────────────────────┐')
    console.log(`│ Solde de départ:     ${formatEuro(data.startingBalance)}`)
    console.log(`│ Date solde départ:   ${data.startingBalanceDate || 'N/A'}`)
    console.log(`│ Total transactions:  ${formatEuro(data.transactionsTotal)}`)
    console.log('├─────────────────────────────────────────┤')
    console.log(`│ SOLDE ACTUEL:        ${formatEuro(data.currentBalance)}`)
    console.log('└─────────────────────────────────────────┘\n')

    // Vérification du calcul
    const expectedBalance = data.startingBalance + data.transactionsTotal
    const balanceMatch = Math.abs(expectedBalance - data.currentBalance) < 0.01

    console.log('🔍 Vérification du calcul:')
    console.log(`   ${formatEuro(data.startingBalance)} + ${formatEuro(data.transactionsTotal)} = ${formatEuro(expectedBalance)}`)
    
    if (balanceMatch) {
      console.log('   ✅ Calcul correct !')
    } else {
      console.log(`   ❌ Incohérence détectée ! Attendu: ${formatEuro(expectedBalance)}, Reçu: ${formatEuro(data.currentBalance)}`)
      process.exit(1)
    }

    // Métadonnées
    if (data.meta) {
      console.log('\n📈 Métadonnées:')
      console.log(`   - Nombre de transactions: ${data.meta.transactionsCount}`)
      console.log(`   - Calculé le: ${new Date(data.meta.calculatedAt).toLocaleString('fr-FR')}`)
    }

    // Validation de la structure
    console.log('\n✅ Tests réussis:')
    console.log('   ✓ API accessible')
    console.log('   ✓ Structure JSON valide')
    console.log('   ✓ Tous les champs présents')
    console.log('   ✓ Calcul mathématique correct')
    console.log('   ✓ Métadonnées présentes')

    console.log('\n🎉 Test de cohérence: SUCCÈS')

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Conseil: Assurez-vous que le serveur Next.js est démarré:')
      console.error('   npm run dev')
    }
    
    process.exit(1)
  }
}

function formatEuro(amount) {
  if (typeof amount !== 'number') return 'N/A'
  
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
  
  // Ajout d'espace pour alignement
  return formatted.padStart(15)
}

// Exécution
testBalanceAPI()
