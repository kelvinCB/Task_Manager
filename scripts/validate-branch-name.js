#!/usr/bin/env node

import { execSync } from 'child_process';

// Obtener el nombre de la rama actual
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();

// Patrones permitidos para nombres de ramas
const branchPatterns = [
  /^main$/,                                    // main
  /^develop$/,                                 // develop
  /^feature\/TM-\d+-[a-z0-9-]+$/,             // feature/TM-XXX-description
  /^bugfix\/TM-\d+-[a-z0-9-]+$/,              // bugfix/TM-XXX-description
  /^hotfix\/TM-\d+-[a-z0-9-]+$/,              // hotfix/TM-XXX-description
  /^release\/v\d+\.\d+\.\d+$/,                // release/vX.Y.Z
  /^docs\/TM-\d+-[a-z0-9-]+$/,                // docs/TM-XXX-description
  /^chore\/TM-\d+-[a-z0-9-]+$/,               // chore/TM-XXX-description
  /^refactor\/TM-\d+-[a-z0-9-]+$/             // refactor/TM-XXX-description
];

const isValidBranch = branchPatterns.some(pattern => pattern.test(currentBranch));

if (!isValidBranch) {
  console.error('❌ Error: Nombre de rama inválido');
  console.error(`📋 Rama actual: ${currentBranch}`);
  console.error('');
  console.error('📝 Formatos válidos:');
  console.error('   • main');
  console.error('   • develop');
  console.error('   • feature/TM-XXX-description-kebab-case');
  console.error('   • bugfix/TM-XXX-description-kebab-case');
  console.error('   • hotfix/TM-XXX-description-kebab-case');
  console.error('   • release/vX.Y.Z');
  console.error('   • docs/TM-XXX-description-kebab-case');
  console.error('   • chore/TM-XXX-description-kebab-case');
  console.error('   • refactor/TM-XXX-description-kebab-case');
  console.error('');
  console.error('💡 Ejemplos:');
  console.error('   • feature/TM-001-task-creation');
  console.error('   • bugfix/TM-002-timer-not-stopping');
  console.error('   • hotfix/TM-003-critical-data-loss');
  console.error('   • release/v1.2.0');
  console.error('');
  console.error('📖 Ver CONVENTIONS.md para más detalles');
  process.exit(1);
}

console.log(`✅ Nombre de rama válido: ${currentBranch}`);
process.exit(0);
