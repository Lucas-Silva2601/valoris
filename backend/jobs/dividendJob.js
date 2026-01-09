import cron from 'node-cron';
import * as dividendService from '../services/dividendService.js';
import CountryOwnership from '../models/CountryOwnership.js';
import { emitDividendNotification } from '../socket/socketHandler.js';

let isRunning = false;

/**
 * Processar dividendos para todos os países
 */
const processAllDividends = async () => {
  if (isRunning) {
    console.log('⚠️ Job de dividendos já está em execução');
    return;
  }

  isRunning = true;
  console.log('💰 Iniciando processamento de dividendos...');

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Obter todos os países com acionistas
    const countries = await CountryOwnership.find({
      'shareholders.0': { $exists: true }
    });

    console.log(`📊 Processando dividendos para ${countries.length} países...`);

    let processed = 0;
    let totalDistributed = 0;

    for (const ownership of countries) {
      try {
        const dividend = await dividendService.processDividends(
          ownership.countryId,
          yesterday,
          now
        );

        if (dividend) {
          processed++;
          totalDistributed += dividend.totalAmount;

          // Notificar acionistas via Socket.io (já feito no dividendService)
          // Mas podemos adicionar notificação adicional aqui se necessário
        }
      } catch (error) {
        console.error(`❌ Erro ao processar dividendos para ${ownership.countryId}:`, error.message);
      }
    }

    console.log(`✅ Dividendos processados: ${processed} países, ${totalDistributed.toFixed(2)} distribuídos`);
  } catch (error) {
    console.error('❌ Erro ao processar dividendos:', error);
  } finally {
    isRunning = false;
  }
};

/**
 * Iniciar job de dividendos (executa a cada 24 horas)
 */
export const startDividendJob = () => {
  // Executar diariamente às 00:00
  cron.schedule('0 0 * * *', () => {
    processAllDividends();
  });

  // Para testes, também pode executar a cada hora (comentar em produção)
  // cron.schedule('0 * * * *', () => {
  //   processAllDividends();
  // });

  console.log('⏰ Job de dividendos agendado (diariamente às 00:00)');
  
  // Executar imediatamente na primeira vez (opcional)
  // processAllDividends();
};

/**
 * Processar dividendos manualmente (para testes)
 */
export const processDividendsManually = async () => {
  await processAllDividends();
};

