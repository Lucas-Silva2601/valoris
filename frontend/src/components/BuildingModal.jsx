import { useState, useEffect } from 'react';
import { isValidCountryId } from '../utils/countryUtils';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { API_BASE_URL, apiRequest } from '../config/api';

const BUILDING_TYPES = [
  { value: 'house', label: 'Casa', emoji: '🏠', description: 'Residência básica' },
  { value: 'apartment', label: 'Apartamento', emoji: '🏢', description: 'Prédio residencial' },
  { value: 'office', label: 'Escritório', emoji: '🏛️', description: 'Edifício comercial' },
  { value: 'skyscraper', label: 'Arranha-céu', emoji: '🏙️', description: 'Torre comercial' },
  { value: 'factory', label: 'Fábrica', emoji: '🏭', description: 'Produção industrial' },
  { value: 'mall', label: 'Shopping', emoji: '🏬', description: 'Centro comercial' }
];

export default function BuildingModal({ 
  isOpen, 
  onClose, 
  countryId, 
  countryName, 
  position,
  onBuild 
}) {
  const [selectedType, setSelectedType] = useState('house');
  const [level, setLevel] = useState(1);
  const [cost, setCost] = useState(0);
  const [loading, setLoading] = useState(false);

  // Calcular custo quando tipo ou nível mudar
  useEffect(() => {
    const fetchCost = async () => {
      try {
        const { data } = await apiRequest(`/buildings/cost?type=${selectedType}&level=${level}`);
        if (data.cost) {
          setCost(data.cost);
        } else {
          // Usar custo padrão se não conseguir buscar
          const defaultCosts = {
            house: 1000,
            apartment: 5000,
            office: 10000,
            skyscraper: 50000,
            factory: 20000,
            mall: 30000
          };
          setCost(defaultCosts[selectedType] || 1000);
        }
      } catch (error) {
        // Usar custo padrão se não conseguir buscar (servidor offline)
        const defaultCosts = {
          house: 1000,
          apartment: 5000,
          office: 10000,
          skyscraper: 50000,
          factory: 20000,
          mall: 30000
        };
        setCost(defaultCosts[selectedType] || 1000);
        console.warn('⚠️  Não foi possível buscar custo do servidor, usando valores padrão');
      }
    };

    if (isOpen && selectedType) {
      fetchCost();
    }
  }, [selectedType, level, isOpen]);

  const handleBuild = async () => {
    // ✅ Validar dados antes de construir
    if (!isValidCountryId(countryId) || countryId === 'UNK') {
      alert('⚠️ País não identificado!\n\nPor favor, clique diretamente em um país no mapa antes de construir.\n\nO sistema precisa identificar em qual país você está construindo.');
      console.error('❌ countryId inválido ou UNK:', countryId);
      return;
    }

    if (!countryName || countryName === 'País Desconhecido' || countryName === 'Local Desconhecido') {
      alert('⚠️ Nome do país inválido!\n\nPor favor, clique diretamente em um país no mapa para identificá-lo corretamente.');
      return;
    }

    // Validar posição
    if (!position || !position.lat || !position.lng) {
      alert('⚠️ Posição inválida!\n\nPor favor, clique no mapa para definir a localização da construção.');
      return;
    }

    setLoading(true);
    
    try {
      const userId = localStorage.getItem('userId') || 'test-user-id';

      // ✅ Usar apiRequest para melhor tratamento de erros
      const { data } = await apiRequest('/buildings/build', {
        method: 'POST',
        body: JSON.stringify({
          countryId: countryId,
          countryName: countryName,
          type: selectedType,
          lat: position.lat,
          lng: position.lng,
          level,
          userId: userId
        })
      });

      if (data.success) {
        if (onBuild) {
          onBuild(data.building);
        }
        onClose();
      } else {
        // Erro retornado pelo servidor
        const errorMsg = data.error || 'Erro ao construir edifício';
        alert(`❌ Erro: ${errorMsg}`);
        console.error('Erro ao construir:', data);
      }
    } catch (error) {
      // ✅ Tratamento de erro melhorado
      console.error('❌ Erro ao construir:', error);
      
      let errorMessage = 'Erro desconhecido ao construir edifício.';
      
      if (error.message.includes('Servidor não está respondendo') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_CONNECTION_REFUSED')) {
        errorMessage = '🔴 Servidor não está respondendo!\n\n' +
          'Verifique se o backend está rodando na porta 3001:\n' +
          '  cd backend && npm start\n\n' +
          'Ou verifique se a porta está correta nas configurações.';
      } else if (error.message.includes('timeout')) {
        errorMessage = '⏱️ Timeout na requisição!\n\n' +
          'O servidor demorou muito para responder. Tente novamente.';
      } else if (error.message.includes('Saldo insuficiente')) {
        errorMessage = `💰 ${error.message}\n\n` +
          'Use o botão 💰 na carteira para adicionar saldo.';
      } else {
        errorMessage = `❌ ${error.message || 'Erro ao construir edifício'}`;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        // Fechar ao clicar fora do modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] border border-gray-700 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho fixo */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">🏗️ Construir Edifício</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        
        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Localização</label>
            <div className="text-base font-semibold text-white bg-gray-700 px-3 py-2 rounded-lg">
              {position ? (
                `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`
              ) : (
                'Clique no mapa para definir'
              )}
              {countryName && countryName !== 'País Desconhecido' && countryName !== 'Local Desconhecido' && countryId !== 'UNK' ? (
                <div className="text-xs text-green-400 mt-1 font-semibold">
                  ✅ {countryName} {countryId && `(${countryId})`}
                </div>
              ) : (
                <div className="text-xs text-red-400 mt-1">
                  ⚠️ País não identificado - Clique diretamente em um país no mapa
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Edifício</label>
            <div className="grid grid-cols-2 gap-2">
              {BUILDING_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-2 border-2 rounded-lg text-left transition-all cursor-pointer ${
                    selectedType === type.value
                      ? 'border-blue-500 bg-blue-900 bg-opacity-30 shadow-lg scale-105'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  <div className="text-xl mb-1">{type.emoji}</div>
                  <div className={`font-semibold text-xs ${selectedType === type.value ? 'text-white' : 'text-gray-200'}`}>
                    {type.label}
                  </div>
                  <div className={`text-xs ${selectedType === type.value ? 'text-gray-300' : 'text-gray-400'}`}>
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nível</label>
            <input
              type="number"
              min="1"
              max="10"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="bg-gray-700 p-3 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1">Custo de Construção</div>
              <div className="text-2xl font-bold text-blue-400">{cost.toLocaleString()} VAL</div>
            </div>
          </div>

          <div className="p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
            <p className="text-xs text-blue-300">
              💡 Dica: Se não tiver saldo suficiente, clique no ícone 💰 na carteira (painel lateral) para garantir saldo inicial de 100.000 VAL
            </p>
          </div>
        </div>

        {/* Botões fixos no rodapé */}
        <div className="flex gap-3 mt-4 flex-shrink-0 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleBuild}
            disabled={loading || !position || (position.lat === 0 && position.lng === 0)}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
          >
            {loading ? '⏳ Construindo...' : '✅ Construir'}
          </button>
        </div>
      </div>
    </div>
  );
}

