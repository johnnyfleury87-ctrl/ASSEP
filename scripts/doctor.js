#!/usr/bin/env node
// scripts/doctor.js
// Script de diagnostic pour vérifier la santé du projet ASSEP

const fs = require('fs')
const path = require('path')

// Codes couleur ANSI
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function check(title, passed, details = '') {
  const icon = passed ? '✓' : '✗'
  const color = passed ? 'green' : 'red'
  log(`${icon} ${title}`, color)
  if (details) {
    log(`  ${details}`, 'reset')
  }
  return passed
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'blue')
  log(title, 'bold')
  log('='.repeat(60), 'blue')
}

// ============================================================================
// 1. Vérifier les variables d'environnement
// ============================================================================
function checkEnvVars() {
  section('1. Variables d\'environnement')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'NEXT_PUBLIC_DONATION_GENERAL_URL',
    'NEXT_PUBLIC_DONATION_EVENT_BASE_URL'
  ]

  let allPresent = true

  // Charger .env.local si existe
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value && !process.env[key]) {
        process.env[key] = value.trim()
      }
    })
  }

  requiredVars.forEach(varName => {
    const exists = !!process.env[varName]
    check(varName, exists, exists ? '✓ Définie' : '✗ Manquante')
    if (!exists) allPresent = false
  })

  const envExampleExists = fs.existsSync(path.join(process.cwd(), '.env.example'))
  check('.env.example existe', envExampleExists)

  return allPresent && envExampleExists
}

// ============================================================================
// 2. Vérifier la structure des migrations
// ============================================================================
function checkMigrations() {
  section('2. Migrations Supabase')
  
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    check('Dossier migrations existe', false, 'Le dossier supabase/migrations est manquant')
    return false
  }

  const expectedMigrations = [
    '0001_foundations.sql',
    '0002_events.sql',
    '0003_signups.sql',
    '0004_finance.sql',
    '0005_emails_donations.sql',
    '0006_rls_policies.sql'
  ]

  let allPresent = true

  expectedMigrations.forEach(filename => {
    const filePath = path.join(migrationsDir, filename)
    const exists = fs.existsSync(filePath)
    
    if (exists) {
      const content = fs.readFileSync(filePath, 'utf8')
      const hasContent = content.length > 100
      check(filename, hasContent, hasContent ? `${content.length} caractères` : 'Fichier vide')
      if (!hasContent) allPresent = false
    } else {
      check(filename, false, 'Manquant')
      allPresent = false
    }
  })

  return allPresent
}

// ============================================================================
// 3. Vérifier les fichiers lib
// ============================================================================
function checkLibFiles() {
  section('3. Fichiers lib/')
  
  const expectedFiles = [
    'lib/supabaseClient.js',
    'lib/supabaseServer.js',
    'lib/email.js'
  ]

  let allPresent = true

  expectedFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    const exists = fs.existsSync(filePath)
    check(file, exists)
    if (!exists) allPresent = false
  })

  return allPresent
}

// ============================================================================
// 4. Vérifier les routes API
// ============================================================================
function checkApiRoutes() {
  section('4. Routes API')
  
  const expectedRoutes = [
    'pages/api/signups.js',
    'pages/api/campaigns/send.js',
    'pages/api/admin/roles.js',
    'pages/api/admin/bureau.js'
  ]

  let allPresent = true

  expectedRoutes.forEach(route => {
    const filePath = path.join(process.cwd(), route)
    const exists = fs.existsSync(filePath)
    check(route, exists)
    if (!exists) allPresent = false
  })

  return allPresent
}

// ============================================================================
// 5. Vérifier les pages principales
// ============================================================================
function checkPages() {
  section('5. Pages principales')
  
  const expectedPages = [
    'pages/index.js',
    'pages/login.js',
    'pages/evenements/index.js',
    'pages/evenements/[slug].js',
    'pages/dons/index.js',
    'pages/dons/evenement/[id].js',
    'pages/dashboard/index.js',
    'pages/dashboard/evenements/index.js',
    'pages/dashboard/evenements/new.js',
    'pages/dashboard/evenements/[id]/benevoles.js',
    'pages/dashboard/evenements/[id]/caisse.js',
    'pages/dashboard/tresorerie.js',
    'pages/dashboard/communications.js',
    'pages/dashboard/bureau.js'
  ]

  let allPresent = true

  expectedPages.forEach(page => {
    const filePath = path.join(process.cwd(), page)
    const exists = fs.existsSync(filePath)
    check(page, exists)
    if (!exists) allPresent = false
  })

  return allPresent
}

// ============================================================================
// 6. Vérifier package.json et dépendances
// ============================================================================
function checkDependencies() {
  section('6. Dépendances')
  
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  
  if (!fs.existsSync(packageJsonPath)) {
    check('package.json existe', false)
    return false
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'next',
    'react',
    'react-dom',
    'qrcode',
    'resend'
  ]

  let allPresent = true

  requiredDeps.forEach(dep => {
    const exists = packageJson.dependencies && packageJson.dependencies[dep]
    check(dep, !!exists, exists ? `v${exists}` : 'Manquant')
    if (!exists) allPresent = false
  })

  // Vérifier node_modules
  const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'))
  check('node_modules/', nodeModulesExists, nodeModulesExists ? '' : 'Exécuter npm install')

  return allPresent && nodeModulesExists
}

// ============================================================================
// 7. Vérifier la syntaxe SQL basique des migrations
// ============================================================================
function checkSqlSyntax() {
  section('7. Syntaxe SQL (vérification basique)')
  
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    check('Migrations directory', false)
    return false
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'))
  let allValid = true

  files.forEach(file => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    
    // Vérifications basiques
    const hasCreateOrAlter = content.toLowerCase().includes('create') || content.toLowerCase().includes('alter')
    const hasSemicolons = content.includes(';')
    
    const valid = hasCreateOrAlter && hasSemicolons
    check(file, valid, valid ? 'Syntaxe OK' : 'Syntaxe suspecte')
    
    if (!valid) allValid = false
  })

  return allValid
}

// ============================================================================
// 8. Vérifier la structure globale
// ============================================================================
function checkStructure() {
  section('8. Structure du projet')
  
  const requiredDirs = [
    'pages',
    'pages/api',
    'pages/dashboard',
    'pages/evenements',
    'pages/dons',
    'lib',
    'supabase',
    'supabase/migrations',
    'scripts'
  ]

  let allPresent = true

  requiredDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir)
    const exists = fs.existsSync(dirPath)
    check(dir + '/', exists)
    if (!exists) allPresent = false
  })

  return allPresent
}

// ============================================================================
// MAIN
// ============================================================================
function main() {
  log('\n' + '█'.repeat(60), 'blue')
  log('  ASSEP - Diagnostic du projet', 'bold')
  log('█'.repeat(60) + '\n', 'blue')

  const results = {
    envVars: checkEnvVars(),
    migrations: checkMigrations(),
    libFiles: checkLibFiles(),
    apiRoutes: checkApiRoutes(),
    pages: checkPages(),
    dependencies: checkDependencies(),
    sqlSyntax: checkSqlSyntax(),
    structure: checkStructure()
  }

  // Résumé
  section('📊 Résumé')
  
  const totalChecks = Object.keys(results).length
  const passedChecks = Object.values(results).filter(v => v).length
  const percentage = Math.round((passedChecks / totalChecks) * 100)

  log(`\nTests réussis: ${passedChecks}/${totalChecks} (${percentage}%)`, 'bold')

  if (passedChecks === totalChecks) {
    log('\n✅ Le projet est prêt !', 'green')
    log('Vous pouvez exécuter: npm run dev', 'green')
    return 0
  } else {
    log('\n⚠️  Certains éléments nécessitent votre attention', 'yellow')
    log('Consultez les détails ci-dessus et corrigez les problèmes.', 'yellow')
    return 1
  }
}

// Exécuter
const exitCode = main()
process.exit(exitCode)
