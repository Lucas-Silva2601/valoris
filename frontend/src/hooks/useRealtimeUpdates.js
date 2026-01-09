import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

/**
 * Hook para gerenciar atualizações em tempo real
 */
export const useRealtimeUpdates = (countryId = null) => {
  const { isConnected, addListener, removeListener, joinCountry, leaveCountry } = useSocket();
  const [unitPositions, setUnitPositions] = useState({});
  const [balance, setBalance] = useState(null);
  const [dividends, setDividends] = useState([]);
  const [combats, setCombats] = useState([]);
  const [ownershipUpdates, setOwnershipUpdates] = useState(null);
  const [economicHealth, setEconomicHealth] = useState(null);

  useEffect(() => {
    if (!isConnected) return;

    // Entrar na sala do país se fornecido
    if (countryId) {
      joinCountry(countryId);
    }

    // Listener para atualização de posição de unidades
    const handleUnitPosition = (data) => {
      setUnitPositions(prev => ({
        ...prev,
        [data.unitId]: data
      }));
    };

    // Listener para atualização de saldo
    const handleBalanceUpdate = (data) => {
      setBalance(data.balance);
    };

    // Listener para dividendos
    const handleDividend = (data) => {
      setDividends(prev => [...prev, data]);
    };

    // Listener para combates
    const handleCombat = (data) => {
      setCombats(prev => {
        const existing = prev.find(c => c.combatId === data.combatId);
        if (existing) {
          return prev.map(c => c.combatId === data.combatId ? data : c);
        }
        return [...prev, data];
      });
    };

    // Listener para atualização de propriedade
    const handleOwnership = (data) => {
      setOwnershipUpdates(data);
    };

    // Listener para saúde econômica
    const handleEconomicHealth = (data) => {
      setEconomicHealth(data);
    };

    // Registrar listeners
    addListener('unit_position_update', handleUnitPosition);
    addListener('balance_update', handleBalanceUpdate);
    addListener('dividend_received', handleDividend);
    addListener('combat_update', handleCombat);
    addListener('ownership_update', handleOwnership);
    addListener('economic_health_update', handleEconomicHealth);

    // Limpar ao desmontar
    return () => {
      if (countryId) {
        leaveCountry(countryId);
      }
      removeListener('unit_position_update', handleUnitPosition);
      removeListener('balance_update', handleBalanceUpdate);
      removeListener('dividend_received', handleDividend);
      removeListener('combat_update', handleCombat);
      removeListener('ownership_update', handleOwnership);
      removeListener('economic_health_update', handleEconomicHealth);
    };
  }, [isConnected, countryId, addListener, removeListener, joinCountry, leaveCountry]);

  return {
    unitPositions,
    balance,
    dividends,
    combats,
    ownershipUpdates,
    economicHealth,
    isConnected
  };
};

