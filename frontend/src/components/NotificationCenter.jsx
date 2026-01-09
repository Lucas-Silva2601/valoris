import { useState, useEffect } from 'react';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { useToast } from '../hooks/useToast';

export default function NotificationCenter() {
  const { dividends, combats, ownershipUpdates, economicHealth } = useRealtimeUpdates();
  const { showSuccess, showInfo, showWarning } = useToast();
  const [lastDividend, setLastDividend] = useState(null);
  const [lastCombat, setLastCombat] = useState(null);

  // Notificar dividendos
  useEffect(() => {
    if (dividends.length > 0) {
      const latest = dividends[dividends.length - 1];
      if (!lastDividend || latest.timestamp !== lastDividend.timestamp) {
        showSuccess(
          `Dividendo recebido: ${latest.countryName} - ${new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'VAL'
          }).format(latest.amount)}`,
          5000
        );
        setLastDividend(latest);
      }
    }
  }, [dividends, lastDividend, showSuccess]);

  // Notificar combates
  useEffect(() => {
    if (combats.length > 0) {
      const latest = combats[combats.length - 1];
      if (!lastCombat || latest.combatId !== lastCombat.combatId) {
        if (latest.result === 'attacker_victory') {
          showSuccess(`Combate vencido em ${latest.defenderCountry}!`, 5000);
        } else if (latest.result === 'defender_victory') {
          showWarning(`Combate perdido em ${latest.attackerCountry}`, 5000);
        } else {
          showInfo(`Combate iniciado: ${latest.attackerCountry} vs ${latest.defenderCountry}`, 3000);
        }
        setLastCombat(latest);
      }
    }
  }, [combats, lastCombat, showSuccess, showWarning, showInfo]);

  // Notificar atualizações de propriedade
  useEffect(() => {
    if (ownershipUpdates) {
      showInfo(`Propriedade atualizada: ${ownershipUpdates.countryName}`, 3000);
    }
  }, [ownershipUpdates, showInfo]);

  return null; // Componente apenas para lógica de notificações
}

