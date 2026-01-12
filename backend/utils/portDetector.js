import detect from 'detect-port';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
