#!/usr/bin/env node

/**
 * Script para verificar e configurar ambiente de desenvolvimento
 */

import { existsSync, copyFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkDependencies() {
  const backendNodeModules = join(rootDir, 'backend', 'node_modules');
  const frontendNodeModules = join(rootDir, 'frontend', 'node_modules');
  
  let needsInstall = false;
  
  if (!existsSync(backendNodeModules)) {
    log('⚠️  Dependências do backend não encontradas', 'yellow');
    needsInstall = true;
  }
  
  if (!existsSync(frontendNodeModules)) {
    log('⚠️  Dependências do frontend não encontradas', 'yellow');
    needsInstall = true;
  }
  
  if (needsInstall) {
    log('\n📦 Instalando dependências...', 'cyan');
    log('Execute: npm run install:all', 'yellow');
    log('Ou: cd backend && npm install && cd ../frontend && npm install --legacy-peer-deps\n', 'yellow');
    process.exit(1);
  }
  
  log('✅ Dependências verificadas', 'green');
}

function checkEnvFiles() {
  const backendEnv = join(rootDir, 'backend', '.env');
  const backendEnvExample = join(rootDir, 'backend', '.env.example');
  const frontendEnv = join(rootDir, 'frontend', '.env');
  const frontendEnvExample = join(rootDir, 'frontend', 'env.example');
  
  // Backend
  if (!existsSync(backendEnv) && existsSync(backendEnvExample)) {
    log('📝 Criando .env do backend a partir de .env.example...', 'cyan');
    copyFileSync(backendEnvExample, backendEnv);
    log('✅ Arquivo backend/.env criado (configure as variáveis se necessário)', 'green');
  }
  
  // Frontend
  if (!existsSync(frontendEnv) && existsSync(frontendEnvExample)) {
    log('📝 Criando .env do frontend a partir de env.example...', 'cyan');
    copyFileSync(frontendEnvExample, frontendEnv);
    log('✅ Arquivo frontend/.env criado (configure as variáveis se necessário)', 'green');
  }
  
  if (existsSync(backendEnv) && existsSync(frontendEnv)) {
    log('✅ Arquivos .env verificados', 'green');
  }
}

function main() {
  log('\n🚀 Verificando ambiente de desenvolvimento...\n', 'cyan');
  
  checkDependencies();
  checkEnvFiles();
  
  log('\n✅ Ambiente pronto! Iniciando servidores...\n', 'green');
}

main();

