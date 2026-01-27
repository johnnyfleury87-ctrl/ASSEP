#!/usr/bin/env node
/**
 * Script de migration des console.log vers safeLog
 * Génère un rapport des fichiers à corriger manuellement
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fichiers à exclure
const EXCLUDED_DIRS = ['node_modules', '.next', 'scripts', 'docs'];
const EXCLUDED_FILES = ['logger.js', 'migrate-to-safelog.js'];

// Patterns sensibles à détecter
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /authorization/i,
  /session/i,
  /auth/i
];

function shouldProcessFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);
  
  // Exclure les dossiers
  if (EXCLUDED_DIRS.some(dir => relativePath.startsWith(dir))) {
    return false;
  }
  
  // Exclure les fichiers spécifiques
  if (EXCLUDED_FILES.some(file => relativePath.endsWith(file))) {
    return false;
  }
  
  return true;
}

function isSensitiveLog(logStatement) {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(logStatement));
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const issues = [];
  let hasLoggerImport = content.includes('from \'../lib/logger\'') || 
                        content.includes('from \'../../lib/logger\'') ||
                        content.includes('from \'../../../lib/logger\'') ||
                        content.includes('from \'../../../../lib/logger\'');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Détecter console.log/error/warn/info/debug
    const consoleMatch = trimmed.match(/console\.(log|error|warn|info|debug)\s*\(/);
    if (consoleMatch) {
      const isSensitive = isSensitiveLog(line);
      const type = consoleMatch[1];
      
      issues.push({
        line: index + 1,
        type: type,
        content: line.trim(),
        sensitive: isSensitive
      });
    }
  });
  
  return {
    filePath,
    hasLoggerImport,
    issues,
    hasSensitive: issues.some(i => i.sensitive)
  };
}

function main() {
  console.log('🔍 Analyse des fichiers pour détection de logs sensibles...\n');
  
  // Trouver tous les fichiers JS/JSX
  const files = glob.sync('**/*.{js,jsx}', {
    ignore: ['node_modules/**', '.next/**', 'scripts/**']
  });
  
  const results = [];
  
  files.forEach(file => {
    if (shouldProcessFile(file)) {
      const analysis = analyzeFile(file);
      if (analysis.issues.length > 0) {
        results.push(analysis);
      }
    }
  });
  
  // Rapport
  console.log('📊 RÉSULTATS DE L\'ANALYSE\n');
  console.log('='.repeat(80));
  
  // Fichiers avec logs sensibles (PRIORITÉ HAUTE)
  const sensitive = results.filter(r => r.hasSensitive);
  console.log(`\n🔴 PRIORITÉ HAUTE - Fichiers avec logs SENSIBLES: ${sensitive.length}\n`);
  
  sensitive.forEach(result => {
    console.log(`📄 ${result.filePath}`);
    console.log(`   Import logger: ${result.hasLoggerImport ? '✅' : '❌ À AJOUTER'}`);
    result.issues.forEach(issue => {
      if (issue.sensitive) {
        console.log(`   ⚠️  L${issue.line}: console.${issue.type} - ${issue.content.substring(0, 80)}...`);
      }
    });
    console.log('');
  });
  
  // Fichiers avec logs normaux
  const normal = results.filter(r => !r.hasSensitive);
  console.log(`\n🟡 PRIORITÉ MOYENNE - Fichiers avec logs normaux: ${normal.length}\n`);
  
  normal.slice(0, 10).forEach(result => {
    console.log(`📄 ${result.filePath} (${result.issues.length} log(s))`);
  });
  
  if (normal.length > 10) {
    console.log(`   ... et ${normal.length - 10} autres fichiers\n`);
  }
  
  // Statistiques
  console.log('\n' + '='.repeat(80));
  console.log('📈 STATISTIQUES\n');
  console.log(`   Fichiers analysés: ${files.length}`);
  console.log(`   Fichiers avec logs: ${results.length}`);
  console.log(`   Fichiers sensibles: ${sensitive.length}`);
  console.log(`   Total de logs à traiter: ${results.reduce((sum, r) => sum + r.issues.length, 0)}`);
  console.log(`   Fichiers déjà migrés: ${results.filter(r => r.hasLoggerImport).length}`);
  
  // Actions recommandées
  console.log('\n' + '='.repeat(80));
  console.log('🎯 ACTIONS RECOMMANDÉES\n');
  console.log('1. Traiter en priorité les fichiers avec logs SENSIBLES (🔴)');
  console.log('2. Importer safeLog: import safeLog from \'../lib/logger\'');
  console.log('3. Remplacer:');
  console.log('   - console.log() → safeLog.debug() ou safeLog.info()');
  console.log('   - console.error() → safeLog.error()');
  console.log('   - console.warn() → safeLog.warn()');
  console.log('4. Pour les logs d\'auth/API, utiliser safeLog.auth() ou safeLog.api()');
  console.log('\n');
  
  // Générer un fichier de rapport
  const reportPath = path.join(process.cwd(), 'docs', 'Conception', 'LOG_MIGRATION_REPORT.md');
  const reportDir = path.dirname(reportPath);
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  let report = '# Rapport de Migration des Logs\n\n';
  report += `Date: ${new Date().toISOString()}\n\n`;
  report += '## Fichiers Prioritaires (Logs Sensibles)\n\n';
  
  sensitive.forEach(result => {
    report += `### ${result.filePath}\n\n`;
    report += `- Import logger: ${result.hasLoggerImport ? '✅' : '❌ À AJOUTER'}\n`;
    report += '- Logs sensibles:\n\n';
    result.issues.forEach(issue => {
      if (issue.sensitive) {
        report += `  - \`L${issue.line}\`: \`console.${issue.type}\` - ${issue.content}\n`;
      }
    });
    report += '\n';
  });
  
  report += '\n## Statistiques\n\n';
  report += `- Fichiers analysés: ${files.length}\n`;
  report += `- Fichiers avec logs: ${results.length}\n`;
  report += `- Fichiers sensibles: ${sensitive.length}\n`;
  report += `- Total de logs: ${results.reduce((sum, r) => sum + r.issues.length, 0)}\n`;
  
  fs.writeFileSync(reportPath, report);
  console.log(`📝 Rapport généré: ${reportPath}\n`);
}

if (require.main === module) {
  main();
}
