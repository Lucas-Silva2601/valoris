import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Criar logger para um módulo específico
 */
export const createLogger = (moduleName) => {
  const logFile = path.join(logsDir, `${moduleName.toLowerCase()}.log`);

  const formatMessage = (level, message, ...args) => {
    const timestamp = new Date().toISOString();
    const argsStr = args.length > 0 ? ' ' + args.map(a => 
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    ).join(' ') : '';
    return `[${timestamp}] [${level}] [${moduleName}] ${message}${argsStr}\n`;
  };

  return {
    info: (message, ...args) => {
      const log = formatMessage('INFO', message, ...args);
      console.log(log.trim());
      fs.appendFileSync(logFile, log);
    },
    warn: (message, ...args) => {
      const log = formatMessage('WARN', message, ...args);
      console.warn(log.trim());
      fs.appendFileSync(logFile, log);
    },
    error: (message, ...args) => {
      const log = formatMessage('ERROR', message, ...args);
      console.error(log.trim());
      fs.appendFileSync(logFile, log);
    },
    debug: (message, ...args) => {
      if (process.env.NODE_ENV === 'development') {
        const log = formatMessage('DEBUG', message, ...args);
        console.debug(log.trim());
        fs.appendFileSync(logFile, log);
      }
    }
  };
};

/**
 * Logger global
 */
export const logger = createLogger('App');

