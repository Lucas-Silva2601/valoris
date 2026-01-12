# ✅ Correção do backend/utils/portDetector.js

**Data**: 12/01/2026  
**Erro Original**: `SyntaxError: Unexpected reserved word` na linha 48  
**Status**: ✅ **CORRIGIDO**

---

## 🐛 Problema Identificado

### Erro Original (Linha 48)
```javascript
export function saveBackendPort(port) {
  const fs = await import('fs');  // ❌ ERRO: await fora de função async
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  // ...
}
```

**Causa**:
- Uso de `await` em função **não-async**
- Importações dinâmicas desnecessárias
- `await import()` é válido apenas em:
  - Funções `async`
  - Top-level await (apenas em módulos ES6 puros)

---

## ✅ Correção Aplicada

### Código Corrigido
```javascript
import detect from 'detect-port';
import fs from 'fs';              // ✅ Importação estática no topo
import path from 'path';          // ✅ Importação estática no topo
import { fileURLToPath } from 'url';  // ✅ Importação estática no topo
import { createLogger } from './logger.js';

const logger = createLogger('PortDetector');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 🔍 Detecta uma porta disponível
 * @param {number} preferredPort - Porta preferida
 * @param {number} maxTries - Máximo de portas para tentar
 * @returns {Promise<number>} - Porta disponível
 */
export async function detectAvailablePort(preferredPort, maxTries = 10) {
  try {
    logger.info(`🔍 Verificando disponibilidade da porta ${preferredPort}...`);
    
    const availablePort = await detect(preferredPort);
    
    if (availablePort === preferredPort) {
      logger.info(`✅ Porta ${preferredPort} está disponível`);
      return preferredPort;
    }
    
    // Porta ocupada, tentar próximas
    logger.warn(`⚠️  Porta ${preferredPort} ocupada, procurando alternativa...`);
    
    for (let i = 1; i < maxTries; i++) {
      const nextPort = preferredPort + i;
      const testPort = await detect(nextPort);
      
      if (testPort === nextPort) {
        logger.info(`✅ Porta alternativa encontrada: ${nextPort}`);
        return nextPort;
      }
    }
    
    throw new Error(`Nenhuma porta disponível entre ${preferredPort} e ${preferredPort + maxTries}`);
  } catch (error) {
    logger.error('❌ Erro ao detectar porta:', error);
    throw error;
  }
}

/**
 * 💾 Salva a porta atual em um arquivo para o frontend
 * @param {number} port - Porta do backend
 */
export function saveBackendPort(port) {
  try {
    const configPath = path.join(__dirname, '../../frontend/public/backend-config.json');
    
    // Garantir que o diretório existe
    const publicDir = path.dirname(configPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const config = {
      port,
      apiUrl: `http://localhost:${port}/api`,
      socketUrl: `http://localhost:${port}`,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info(`💾 Configuração salva em: backend-config.json`);
  } catch (error) {
    logger.warn('⚠️  Não foi possível salvar configuração do backend:', error.message);
  }
}
```

---

## 🔧 Mudanças Realizadas

### 1. ✅ Importações Estáticas no Topo
```javascript
// ❌ Antes (importações dinâmicas com await)
export function saveBackendPort(port) {
  const fs = await import('fs');
  const path = await import('path');
  // ...
}

// ✅ Depois (importações estáticas)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export function saveBackendPort(port) {
  // Usa fs, path diretamente
}
```

### 2. ✅ `__dirname` Definido no Escopo do Módulo
```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### 3. ✅ Função Síncrona (sem async desnecessário)
```javascript
export function saveBackendPort(port) {
  // Operações síncronas: fs.writeFileSync
  // Não precisa ser async
}
```

---

## 🧪 Testes Realizados

### ✅ Teste 1: Sintaxe
```bash
node -c backend/utils/portDetector.js
# ✅ Sintaxe correta!
```

### ✅ Teste 2: Server.js
```bash
node -c backend/server.js
# ✅ Server.js sem erros de sintaxe!
```

### ✅ Teste 3: Inicialização
```bash
cd backend && node server.js
# ═══════════════════════════════════════════
# 🚀 Servidor VALORIS iniciado com sucesso!
# ═══════════════════════════════════════════
# 📡 Porta: 3001
# 🔗 API: http://localhost:3001/api
# ⚡ Socket.io: http://localhost:3001
# 💾 Config: frontend/public/backend-config.json
# ═══════════════════════════════════════════
```

---

## 📊 Resultado

### ✅ Arquivo Corrigido
- **Importações**: Todas estáticas no topo
- **Funções**: `async` apenas onde necessário
- **Sintaxe**: 100% válida para ES Modules
- **Funcionalidade**: Mantida integralmente

### ✅ Sem Erros
```
✅ SyntaxError resolvido
✅ Backend inicia sem crashes
✅ Detecção de porta funcionando
✅ backend-config.json gerado
✅ Sistema operacional
```

---

## 🎯 Lições Aprendidas

### ❌ O que NÃO fazer
```javascript
// Importações dinâmicas desnecessárias
export function myFunction() {
  const fs = await import('fs');  // ❌ Erro: await sem async
}
```

### ✅ O que fazer
```javascript
// Importações estáticas no topo
import fs from 'fs';

export function myFunction() {
  fs.writeFileSync(...);  // ✅ Correto
}
```

### 🔑 Regra de Ouro
- Use **importações estáticas** quando possível
- Use **importações dinâmicas** apenas para:
  - Lazy loading (carregar módulos sob demanda)
  - Importações condicionais
  - Code splitting

---

## ✅ Status Final

**Arquivo**: `backend/utils/portDetector.js`  
**Status**: ✅ **CORRIGIDO E TESTADO**  
**Sintaxe**: ✅ **VÁLIDA**  
**Funcionalidade**: ✅ **100% OPERACIONAL**

---

**Data da Correção**: 12/01/2026 19:25 BRT

