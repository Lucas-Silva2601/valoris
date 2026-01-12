#!/usr/bin/env node

/**
 * 🧹 Script de Limpeza de Portas
 * Encerra processos nas portas 3001-3010 e 5173-5180
 */

import { execSync } from 'child_process';
import { platform } from 'os';

const PORTS_TO_CLEAN = {
  backend: [3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010],
  frontend: [5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180]
};

console.log('🧹 Limpando portas ocupadas...\n');

function cleanPorts(ports, label) {
  console.log(`📍 ${label}:`);
  let cleaned = 0;
  
  ports.forEach(port => {
    try {
      if (platform() === 'win32') {
        // Windows
        const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
        const lines = result.split('\n').filter(line => line.includes('LISTENING'));
        
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          
          if (pid && /^\d+$/.test(pid)) {
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
              console.log(`  ✅ Porta ${port} liberada (PID: ${pid})`);
              cleaned++;
            } catch (killError) {
              // Processo já encerrado ou sem permissão
            }
          }
        });
      } else {
        // Linux/Mac
        const result = execSync(`lsof -ti:${port}`, { encoding: 'utf8' });
        const pids = result.trim().split('\n').filter(pid => pid);
        
        pids.forEach(pid => {
          try {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
            console.log(`  ✅ Porta ${port} liberada (PID: ${pid})`);
            cleaned++;
          } catch (killError) {
            // Processo já encerrado
          }
        });
      }
    } catch (error) {
      // Porta não está em uso (normal)
    }
  });
  
  if (cleaned === 0) {
    console.log(`  ℹ️  Nenhuma porta ocupada`);
  }
  console.log('');
}

cleanPorts(PORTS_TO_CLEAN.backend, 'Backend (3001-3010)');
cleanPorts(PORTS_TO_CLEAN.frontend, 'Frontend (5173-5180)');

console.log('✅ Limpeza concluída!\n');

