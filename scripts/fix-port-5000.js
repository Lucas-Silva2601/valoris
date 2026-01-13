/**
 * ✅ Script para corrigir todos os componentes que usam porta 5000
 * Substitui por getApiUrl() dinâmico
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_SRC = path.join(__dirname, '../frontend/src');

const componentsToFix = [
  'components/WalletDisplay.jsx',
  'components/GodModePanel.jsx',
  'components/DefenseInfo.jsx',
  'components/MissionsPanel.jsx',
  'components/AnalyticsDashboard.jsx',
  'components/SystemHealthDashboard.jsx',
  'components/InvestmentHistory.jsx',
  'components/EconomicChart.jsx',
  'components/ShareholdersList.jsx',
  'components/UnitControlPanel.jsx',
  'pages/LoginPage.jsx',
  'components/UserProfile.jsx',
  'components/MilitaryUnitModal.jsx',
  'components/UnitsList.jsx'
];

const OLD_PATTERN = /const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000\/api';/g;
const NEW_CODE = `import { getApiUrl } from '../config/api';\n\n// ✅ REMOVIDO: const API_URL hardcoded (porta 5000)\n// Agora usa getApiUrl() para detectar porta dinâmica`;

let fixedCount = 0;
let errors = [];

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║  🔧 CORRIGINDO COMPONENTES COM PORTA 5000                 ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

for (const componentPath of componentsToFix) {
  const fullPath = path.join(FRONTEND_SRC, componentPath);
  
  try {
    let content = fs.readFileSync(fullPath, 'utf-8');
    const originalContent = content;
    
    // 1. Substituir declaração de API_URL
    if (content.match(OLD_PATTERN)) {
      console.log(`📝 ${componentPath}`);
      
      // Adicionar import se não existir
      if (!content.includes("import { getApiUrl }")) {
        const firstImportIndex = content.indexOf('import');
        if (firstImportIndex !== -1) {
          const insertPosition = content.indexOf('\n', firstImportIndex) + 1;
          content = content.slice(0, insertPosition) + 
                   `import { getApiUrl } from '../config/api';\n` +
                   content.slice(insertPosition);
        }
      }
      
      // Remover const API_URL antiga
      content = content.replace(OLD_PATTERN, '');
      
      // 2. Substituir todas as ocorrências de ${API_URL}
      let replacements = 0;
      content = content.replace(/\$\{API_URL\}/g, () => {
        replacements++;
        return '${await getApiUrl()}';
      });
      
      // 3. Tornar funções async se não forem
      if (replacements > 0) {
        // Encontrar funções que usam fetch com await getApiUrl()
        const asyncFunctions = content.match(/const \w+ = (?!async)\(/g);
        if (asyncFunctions) {
          content = content.replace(/const (\w+) = \(/g, (match, funcName) => {
            if (content.includes(`${funcName} = async (`) || content.includes(`async ${funcName}(`)) {
              return match; // Já é async
            }
            // Verificar se a função usa await getApiUrl()
            const funcStart = content.indexOf(match);
            const funcBody = content.substring(funcStart, funcStart + 500);
            if (funcBody.includes('await getApiUrl()')) {
              return `const ${funcName} = async (`;
            }
            return match;
          });
        }
      }
      
      // Salvar arquivo
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`   ✅ Corrigido (${replacements} URLs)`);
        fixedCount++;
      } else {
        console.log(`   ⚠️  Nenhuma mudança necessária`);
      }
    } else {
      console.log(`   ℹ️  ${componentPath} - Já usa getApiUrl() ou não tem porta 5000`);
    }
    
  } catch (error) {
    console.error(`   ❌ Erro em ${componentPath}:`, error.message);
    errors.push({ file: componentPath, error: error.message });
  }
}

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log(`║  ✅ CORREÇÃO CONCLUÍDA: ${fixedCount} arquivos corrigidos`);
console.log('╚════════════════════════════════════════════════════════════╝\n');

if (errors.length > 0) {
  console.log('⚠️  Erros encontrados:');
  errors.forEach(({ file, error }) => {
    console.log(`   - ${file}: ${error}`);
  });
}

console.log('\n📋 Próximos Passos:');
console.log('   1. Execute SQL no Supabase (INSTRUCOES_CORRECAO_BANCO.md)');
console.log('   2. Limpe cache do navegador (Ctrl+Shift+Delete)');
console.log('   3. Recarregue o sistema (Ctrl+Shift+R)\n');

