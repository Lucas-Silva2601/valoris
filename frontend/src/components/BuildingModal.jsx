import { useState, useEffect } from 'react';
import { isValidCountryId } from '../utils/countryUtils';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { API_BASE_URL, apiRequest } from '../config/api';
import * as turf from '@turf/turf';

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
  countryGeometry, // ✅ Geometria do país para calcular centroide se necessário
  cityId = null, // ✅ FASE 18.6: ID da cidade (opcional)
  onBuild 
}) {
  const [selectedType, setSelectedType] = useState('house');
  const [level, setLevel] = useState(1);
  const [cost, setCost] = useState(0);
  const [loading, setLoading] = useState(false);
  // ✅ FASE 18.6: Estados para informações da cidade
  const [cityInfo, setCityInfo] = useState(null);
  const [predictedYield, setPredictedYield] = useState(null);
  const [loadingCityInfo, setLoadingCityInfo] = useState(false);

  // ✅ FASE 18.6: Carregar informações da cidade quando modal abrir
  useEffect(() => {
    const loadCityInfo = async () => {
      if (!isOpen || !cityId) {
        setCityInfo(null);
        setPredictedYield(null);
        return;
      }

      setLoadingCityInfo(true);
      try {
        // Carregar informações da cidade
        const cityResponse = await fetch(`${API_BASE_URL}/geography/cities/${cityId}`);
        if (cityResponse.ok) {
          const cityData = await cityResponse.json();
          setCityInfo(cityData);
        }

        // Calcular previsão de yield
        if (selectedType && level) {
          const yieldResponse = await apiRequest('/buildings/predict-yield', {
            method: 'POST',
            body: JSON.stringify({
              buildingType: selectedType,
              level: level,
              cityId: cityId
            })
          });
          if (yieldResponse.data) {
            setPredictedYield(yieldResponse.data);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar informações da cidade:', error);
      } finally {
        setLoadingCityInfo(false);
      }
    };

    loadCityInfo();
  }, [isOpen, cityId, selectedType, level]);

  // Calcular custo quando tipo ou nível mudar
  useEffect(() => {
    const fetchCost = async () => {
      try {
        // ✅ FASE 18.6: Incluir cityId na requisição para calcular custo com land_value
        let url = `/buildings/cost?type=${selectedType}&level=${level}`;
        if (cityId) {
          url += `&cityId=${cityId}`;
        }
        
        const { data } = await apiRequest(url);
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
  }, [selectedType, level, isOpen, cityId]);

  // ✅ Função para gerar ponto ALEATÓRIO ESPALHADO dentro do país (não apenas centroide)
  const generateRandomPositionInCountry = async () => {
    if (!countryGeometry) return null;
    
    try {
      const polygon = turf.feature(countryGeometry);
      const bbox = turf.bbox(polygon); // [minLng, minLat, maxLng, maxLat]
      
      // ✅ Tentar gerar ponto aleatório dentro do polígono (até 50 tentativas)
      for (let attempt = 0; attempt < 50; attempt++) {
        // Gerar coordenada aleatória dentro do bounding box
        const randomLng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
        const randomLat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
        
        const point = turf.point([randomLng, randomLat]);
        
        // Verificar se está dentro do polígono
        let isInside = false;
        if (countryGeometry.type === 'Polygon') {
          const poly = turf.polygon(countryGeometry.coordinates);
          isInside = turf.booleanPointInPolygon(point, poly);
        } else if (countryGeometry.type === 'MultiPolygon') {
          for (const coords of countryGeometry.coordinates) {
            const poly = turf.polygon(coords);
            if (turf.booleanPointInPolygon(point, poly)) {
              isInside = true;
              break;
            }
          }
        }
        
        if (isInside) {
          console.log(`✅ Posição aleatória gerada no país (tentativa ${attempt + 1}):`, { lat: randomLat, lng: randomLng });
          return { lat: randomLat, lng: randomLng };
        }
      }
      
      // ✅ Se não conseguiu gerar ponto aleatório, usar centroide como fallback
      console.warn('⚠️ Não conseguiu gerar ponto aleatório, usando centroide');
      const centroid = turf.centroid(polygon);
      const [lng, lat] = centroid.geometry.coordinates;
      return { lat, lng };
    } catch (error) {
      console.error('Erro ao gerar posição aleatória no país:', error);
      return null;
    }
  };
  
  // ✅ Função para calcular centroide do país (fallback)
  const calculateCountryCentroid = () => {
    if (!countryGeometry) return null;
    
    try {
      const polygon = turf.feature(countryGeometry);
      const centroid = turf.centroid(polygon);
      const [lng, lat] = centroid.geometry.coordinates;
      return { lat, lng };
    } catch (error) {
      console.error('Erro ao calcular centroide do país:', error);
      return null;
    }
  };

  const handleBuild = async () => {
    // ✅ Validar dados antes de construir - validação mais flexível
    // Aceitar se tiver countryId válido OU countryName válido
    const hasValidCountryId = countryId && countryId !== 'UNK' && countryId !== 'XXX' && countryId.trim().length > 0;
    const hasValidCountryName = countryName && countryName !== 'País Desconhecido' && countryName !== 'Local Desconhecido' && countryName.trim().length > 0;
    
    if (!hasValidCountryId && !hasValidCountryName) {
      alert('⚠️ País não identificado!\n\nPor favor, clique diretamente em um país no mapa antes de construir.\n\nO sistema precisa identificar em qual país você está construindo.');
      console.error('❌ countryId e countryName inválidos:', { countryId, countryName });
      return;
    }
    
    // ✅ Garantir que sempre tenhamos nome e ID válidos
    // Se não tiver nome mas tiver ID, usar um nome padrão
    let finalCountryName = hasValidCountryName ? countryName : (hasValidCountryId ? `País ${countryId}` : 'País Selecionado');
    
    // Se não tiver ID válido mas tiver nome, gerar ID a partir do nome
    let finalCountryId = hasValidCountryId ? countryId : null;
    if (!finalCountryId && hasValidCountryName) {
      const normalized = countryName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (normalized.length >= 3) {
        finalCountryId = normalized.substring(0, 3);
      } else if (normalized.length > 0) {
        finalCountryId = (normalized + 'XXX').substring(0, 3);
      }
    }
    
    // Se ainda não tiver ID, usar fallback genérico (não deve acontecer, mas por segurança)
    if (!finalCountryId || finalCountryId === 'UNK' || finalCountryId === 'XXX') {
      console.error('⚠️ Não foi possível gerar ID válido para o país:', { countryId, countryName });
      alert('⚠️ Erro ao identificar o país!\n\nPor favor, clique novamente no país no mapa e tente construir novamente.');
      return;
    }

    // ✅ IMPORTANTE: Se não houver posição, gerar posição ALEATÓRIA ESPALHADA pelo país
    // Isso garante que múltiplas construções sejam ESPALHADAS, não concentradas
    let finalPosition = position;
    if (!finalPosition || !finalPosition.lat || !finalPosition.lng || (finalPosition.lat === 0 && finalPosition.lng === 0)) {
      console.log('📍 Posição não definida, gerando posição ALEATÓRIA ESPALHADA pelo país...');
      finalPosition = await generateRandomPositionInCountry();
      
      if (!finalPosition) {
        // Fallback para centroide se não conseguir gerar aleatório
        finalPosition = calculateCountryCentroid();
        if (!finalPosition) {
          alert('⚠️ Não foi possível calcular a posição automaticamente!\n\nPor favor, clique no mapa dentro do país para definir a localização da construção.');
          return;
        }
      }
      
      console.log('✅ Posição ALEATÓRIA gerada no país:', finalPosition);
    }

    setLoading(true);
    
    try {
      const userId = localStorage.getItem('userId') || 'test-user-id';

      // ✅ Usar apiRequest para melhor tratamento de erros
      // ✅ IMPORTANTE: O servidor vai deduzir o custo da carteira automaticamente
      // ✅ CORRIGIDO: Rota correta é /buildings (não /buildings/build)
      const { data } = await apiRequest('/buildings', {
        method: 'POST',
        body: JSON.stringify({
          countryId: finalCountryId,
          countryName: finalCountryName,
          type: selectedType,
          lat: finalPosition.lat,
          lng: finalPosition.lng,
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
              ) : countryGeometry ? (
                <span className="text-amber-300">📍 Será construído no centro do país automaticamente</span>
              ) : (
                <span className="text-gray-400">Clique no mapa para definir a posição ou será usado o centro do país</span>
              )}
              {/* ✅ Validação melhorada: aceitar país se tiver nome válido OU ID válido */}
              {(countryName && countryName !== 'País Desconhecido' && countryName !== 'Local Desconhecido' && countryName.trim().length > 0) || 
               (countryId && countryId !== 'UNK' && countryId !== 'XXX' && countryId.trim().length > 0) ? (
                <div className="text-xs text-green-400 mt-1 font-semibold">
                  ✅ {countryName && countryName !== 'País Desconhecido' && countryName !== 'Local Desconhecido' ? countryName : 'País Selecionado'} 
                  {countryId && countryId !== 'UNK' && countryId !== 'XXX' && ` (${countryId})`}
                  {!position && countryGeometry && (
                    <div className="text-xs text-amber-300 mt-1 font-normal">
                      💡 A construção será colocada automaticamente no centro do país
                    </div>
                  )}
                  {!position && !countryGeometry && (
                    <div className="text-xs text-amber-300 mt-1 font-normal">
                      💡 Clique no mapa para definir a posição da construção
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-red-400 mt-1">
                  ⚠️ País não identificado - Clique diretamente em um país no mapa para selecioná-lo
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
            disabled={loading || (!countryId || countryId === 'UNK' || countryId === 'XXX') || (!countryName || countryName === 'País Desconhecido')}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
          >
            {loading ? '⏳ Construindo...' : `✅ Construir (${cost.toLocaleString()} VAL)`}
          </button>
        </div>
      </div>
    </div>
  );
}

