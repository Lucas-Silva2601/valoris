import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`  ${title}`, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Verificações
const checks = {
  errors: [],
  warnings: [],
  info: [],
};

// 1. Verificar estrutura de diretórios
function checkDirectoryStructure() {
  logSection('📁 ESTRUTURA DE DIRETÓRIOS');
  
  const requiredDirs = [
    'backend',
    'frontend',
    'backend/routes',
    'backend/models',
    'backend/controllers',
    'backend/services',
    'backend/middleware',
    'backend/jobs',
    'backend/data',
    'frontend/src',
    'frontend/src/components',
    'frontend/src/pages',
    'scripts',
  ];

  let allExist = true;
  requiredDirs.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    if (existsSync(fullPath)) {
      logSuccess(`${dir}/`);
    } else {
      logError(`${dir}/ - NÃO ENCONTRADO`);
      checks.errors.push(`Diretório faltando: ${dir}`);
      allExist = false;
    }
  });

  return allExist;
}

// 2. Verificar arquivos essenciais
function checkEssentialFiles() {
  logSection('📄 ARQUIVOS ESSENCIAIS');
  
  const essentialFiles = [
    { path: 'package.json', required: true },
    { path: 'backend/package.json', required: true },
    { path: 'frontend/package.json', required: true },
    { path: 'backend/server.js', required: true },
    { path: 'frontend/vite.config.js', required: true },
    { path: 'backend/.env', required: false },
    { path: 'frontend/.env', required: false },
    { path: 'backend/env.example', required: false },
    { path: 'frontend/env.example', required: false },
    { path: 'backend/data/countries.geojson', required: false },
  ];

  essentialFiles.forEach(file => {
    const fullPath = path.join(rootDir, file.path);
    if (existsSync(fullPath)) {
      logSuccess(file.path);
    } else {
      if (file.required) {
        logError(`${file.path} - NÃO ENCONTRADO (OBRIGATÓRIO)`);
        checks.errors.push(`Arquivo obrigatório faltando: ${file.path}`);
      } else {
        logWarning(`${file.path} - NÃO ENCONTRADO (OPCIONAL)`);
        checks.warnings.push(`Arquivo opcional faltando: ${file.path}`);
      }
    }
  });
}

// 3. Verificar dependências
function checkDependencies() {
  logSection('📦 DEPENDÊNCIAS');
  
  const checkPackageJson = (dir, name) => {
    const packagePath = path.join(rootDir, dir, 'package.json');
    if (!existsSync(packagePath)) {
      logError(`${name}: package.json não encontrado`);
      checks.errors.push(`${name}: package.json não encontrado`);
      return false;
    }

    try {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      const nodeModulesPath = path.join(rootDir, dir, 'node_modules');
      
      if (existsSync(nodeModulesPath)) {
        logSuccess(`${name}: node_modules/ existe`);
        
        // Verificar algumas dependências críticas
        const criticalDeps = name === 'Backend' 
          ? ['express', 'mongoose', 'socket.io', 'jsonwebtoken']
          : ['react', 'react-dom', 'leaflet', 'react-leaflet'];
        
        const missingDeps = [];
        criticalDeps.forEach(dep => {
          const depPath = path.join(nodeModulesPath, dep);
          if (!existsSync(depPath)) {
            missingDeps.push(dep);
          }
        });
        
        if (missingDeps.length > 0) {
          logWarning(`${name}: Dependências faltando: ${missingDeps.join(', ')}`);
          checks.warnings.push(`${name}: Dependências faltando: ${missingDeps.join(', ')}`);
        } else {
          logSuccess(`${name}: Dependências críticas instaladas`);
        }
      } else {
        logError(`${name}: node_modules/ NÃO ENCONTRADO - Execute: npm install`);
        checks.errors.push(`${name}: Dependências não instaladas`);
        return false;
      }
      
      return true;
    } catch (error) {
      logError(`${name}: Erro ao ler package.json - ${error.message}`);
      checks.errors.push(`${name}: Erro ao ler package.json`);
      return false;
    }
  };

  checkPackageJson('backend', 'Backend');
  checkPackageJson('frontend', 'Frontend');
  checkPackageJson('.', 'Root');
}

// 4. Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  logSection('🔐 VARIÁVEIS DE AMBIENTE');
  
  const checkEnv = (dir, name) => {
    const envPath = path.join(rootDir, dir, '.env');
    const envExamplePath = path.join(rootDir, dir, 'env.example');
    
    if (existsSync(envPath)) {
      logSuccess(`${name}: .env existe`);
      
      try {
        const envContent = readFileSync(envPath, 'utf8');
        const exampleContent = existsSync(envExamplePath) 
          ? readFileSync(envExamplePath, 'utf8') 
          : '';
        
        // Verificar variáveis críticas
        const criticalVars = name === 'Backend'
          ? ['PORT', 'MONGODB_URI', 'JWT_SECRET']
          : ['VITE_API_URL'];
        
        const missingVars = [];
        criticalVars.forEach(varName => {
          if (!envContent.includes(varName)) {
            missingVars.push(varName);
          }
        });
        
        if (missingVars.length > 0) {
          logWarning(`${name}: Variáveis faltando: ${missingVars.join(', ')}`);
          checks.warnings.push(`${name}: Variáveis faltando: ${missingVars.join(', ')}`);
        } else {
          logSuccess(`${name}: Variáveis críticas configuradas`);
        }
      } catch (error) {
        logWarning(`${name}: Erro ao ler .env - ${error.message}`);
      }
    } else {
      logWarning(`${name}: .env NÃO ENCONTRADO`);
      if (existsSync(envExamplePath)) {
        logInfo(`${name}: Copie env.example para .env e configure`);
        checks.warnings.push(`${name}: .env não encontrado`);
      } else {
        logError(`${name}: env.example também não encontrado`);
        checks.errors.push(`${name}: Arquivos de ambiente não encontrados`);
      }
    }
  };
  
  checkEnv('backend', 'Backend');
  checkEnv('frontend', 'Frontend');
}

// 5. Verificar portas
function checkPorts() {
  logSection('🔌 PORTAS E SERVIÇOS');
  
  try {
    // Verificar porta 5000 (backend)
    try {
      execSync('netstat -ano | findstr :5000', { stdio: 'ignore' });
      logWarning('Porta 5000 (Backend) está em uso');
      checks.warnings.push('Porta 5000 pode estar em uso');
    } catch {
      logSuccess('Porta 5000 (Backend) está livre');
    }
    
    // Verificar porta 5173 (frontend Vite)
    try {
      execSync('netstat -ano | findstr :5173', { stdio: 'ignore' });
      logWarning('Porta 5173 (Frontend Vite) está em uso');
      checks.warnings.push('Porta 5173 pode estar em uso');
    } catch {
      logSuccess('Porta 5173 (Frontend Vite) está livre');
    }
    
    // Verificar porta 27017 (MongoDB)
    try {
      execSync('netstat -ano | findstr :27017', { stdio: 'ignore' });
      logSuccess('Porta 27017 (MongoDB) está em uso - MongoDB pode estar rodando');
    } catch {
      logWarning('Porta 27017 (MongoDB) não está em uso - MongoDB pode não estar rodando');
      checks.warnings.push('MongoDB pode não estar rodando');
    }
  } catch (error) {
    logWarning('Não foi possível verificar portas (comando netstat não disponível)');
  }
}

// 6. Verificar MongoDB
function checkMongoDB() {
  logSection('🗄️  MONGODB');
  
  try {
    // Tentar conectar (se mongoose estiver instalado)
    const mongoosePath = path.join(rootDir, 'backend', 'node_modules', 'mongoose');
    if (existsSync(mongoosePath)) {
      logInfo('Mongoose instalado - Verificando conexão...');
      
      // Verificar se há arquivo de configuração do banco
      const dbConfigPath = path.join(rootDir, 'backend', 'config', 'database.js');
      if (existsSync(dbConfigPath)) {
        logSuccess('Configuração do banco de dados encontrada');
      } else {
        logWarning('Configuração do banco de dados não encontrada');
      }
    } else {
      logWarning('Mongoose não instalado');
    }
    
    // Verificar arquivo GeoJSON
    const geojsonPath = path.join(rootDir, 'backend', 'data', 'countries.geojson');
    if (existsSync(geojsonPath)) {
      const stats = fs.statSync(geojsonPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      logSuccess(`GeoJSON encontrado (${sizeMB} MB)`);
    } else {
      logWarning('GeoJSON não encontrado - Execute: node backend/scripts/download-geojson.js');
      checks.warnings.push('GeoJSON não encontrado');
    }
  } catch (error) {
    logError(`Erro ao verificar MongoDB: ${error.message}`);
  }
}

// 7. Verificar build do frontend
function checkFrontendBuild() {
  logSection('🏗️  BUILD DO FRONTEND');
  
  const distPath = path.join(rootDir, 'frontend', 'dist');
  if (existsSync(distPath)) {
    logSuccess('Pasta dist/ existe (build de produção)');
    
    const indexPath = path.join(distPath, 'index.html');
    if (existsSync(indexPath)) {
      logSuccess('index.html encontrado no build');
    } else {
      logWarning('index.html não encontrado no build');
    }
  } else {
    logInfo('Pasta dist/ não existe - Execute: cd frontend && npm run build');
    checks.info.push('Build de produção não encontrado');
  }
}

// 8. Verificar processos Node.js
function checkNodeProcesses() {
  logSection('🔄 PROCESSOS NODE.JS');
  
  try {
    const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
    const lines = output.split('\n').filter(line => line.trim() && !line.includes('node.exe'));
    
    if (lines.length > 1) {
      logInfo(`${lines.length - 1} processo(s) Node.js rodando`);
      checks.info.push(`${lines.length - 1} processo(s) Node.js rodando`);
    } else {
      logInfo('Nenhum processo Node.js rodando');
    }
  } catch (error) {
    logWarning('Não foi possível verificar processos Node.js');
  }
}

// 9. Verificar versões
function checkVersions() {
  logSection('📊 VERSÕES');
  
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    logSuccess(`Node.js: ${nodeVersion}`);
    
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm: ${npmVersion}`);
    
    // Verificar versão do Node.js (deve ser 18+)
    const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (nodeMajor < 18) {
      logWarning(`Node.js ${nodeVersion} pode ser muito antigo. Recomendado: 20+`);
      checks.warnings.push('Versão do Node.js pode ser muito antiga');
    }
  } catch (error) {
    logError('Não foi possível verificar versões');
    checks.errors.push('Erro ao verificar versões');
  }
}

// 10. Resumo e recomendações
function showSummary() {
  logSection('📋 RESUMO E RECOMENDAÇÕES');
  
  console.log('\n');
  
  if (checks.errors.length === 0 && checks.warnings.length === 0) {
    logSuccess('✅ Projeto está em bom estado!', 'green');
    logInfo('Você pode executar: npm run dev', 'blue');
  } else {
    if (checks.errors.length > 0) {
      logError(`\n❌ ${checks.errors.length} ERRO(S) ENCONTRADO(S):`, 'red');
      checks.errors.forEach((error, index) => {
        logError(`  ${index + 1}. ${error}`, 'red');
      });
    }
    
    if (checks.warnings.length > 0) {
      logWarning(`\n⚠️  ${checks.warnings.length} AVISO(S):`, 'yellow');
      checks.warnings.forEach((warning, index) => {
        logWarning(`  ${index + 1}. ${warning}`, 'yellow');
      });
    }
    
    console.log('\n');
    logInfo('🔧 COMANDOS ÚTEIS:', 'cyan');
    logInfo('  npm run install:all    - Instalar todas as dependências', 'blue');
    logInfo('  npm run dev            - Iniciar desenvolvimento', 'blue');
    logInfo('  npm run build          - Build de produção', 'blue');
    logInfo('  node backend/scripts/download-geojson.js - Baixar dados GeoJSON', 'blue');
  }
  
  if (checks.info.length > 0) {
    console.log('\n');
    logInfo('ℹ️  INFORMAÇÕES:', 'cyan');
    checks.info.forEach((info, index) => {
      logInfo(`  ${index + 1}. ${info}`, 'blue');
    });
  }
  
  console.log('\n');
}

// Executar todas as verificações
async function main() {
  console.clear();
  log('╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║     🔍 DIAGNÓSTICO DO PROJETO VALORIS                      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  checkDirectoryStructure();
  checkEssentialFiles();
  checkDependencies();
  checkEnvironmentVariables();
  checkVersions();
  checkPorts();
  checkMongoDB();
  checkFrontendBuild();
  checkNodeProcesses();
  showSummary();
}

main().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});

