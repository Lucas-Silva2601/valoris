import { useState, useEffect } from 'react';
import WorldMap from '../components/WorldMap';
import CountryPanel from '../components/CountryPanel';
import CountrySearch from '../components/CountrySearch';
import RealtimeStatus from '../components/RealtimeStatus';
import ToastContainer from '../components/ToastContainer';
import NotificationCenter from '../components/NotificationCenter';
import ErrorBoundary from '../components/ErrorBoundary';
import InvestmentModal from '../components/InvestmentModal';
import BuildingModal from '../components/BuildingModal';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import { getCountryId, getCountryName, isValidCountryId } from '../utils/countryUtils';
import { identifyCountryFromMapClick } from '../utils/mapClickUtils';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { API_BASE_URL, apiRequest } from '../config/api';

export default function GamePage() {
  const [countriesData, setCountriesData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCountryData, setSelectedCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userUnits, setUserUnits] = useState([]);
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [investmentCountry, setInvestmentCountry] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [npcs, setNPCs] = useState([]);
  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [buildingPosition, setBuildingPosition] = useState(null);

  // Hook de atualizações em tempo real
  const realtimeUpdates = useRealtimeUpdates(selectedCountry);
  const { toasts, removeToast, showSuccess, showError } = useToast();
  const { socket, isConnected } = useSocket();

  // Carregar unidades do usuário
  useEffect(() => {
    loadUserUnits();
  }, []);

  // Estado para controlar se o backend está disponível
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Carregar TODOS os NPCs (não apenas do país selecionado)
  useEffect(() => {
    if (backendAvailable) {
      loadAllNPCs();
    }
  }, [backendAvailable]);

  // ✅ Carregar edifícios quando backend fica disponível e periodicamente
  useEffect(() => {
    if (backendAvailable) {
      loadBuildings();
    } else {
      setBuildings([]);
    }
  }, [backendAvailable]);
  
  // ✅ Recarregar edifícios periodicamente para manter atualizado (apenas se backend estiver disponível)
  useEffect(() => {
    if (!backendAvailable) return;
    
    const interval = setInterval(() => {
      loadBuildings();
    }, 10000); // Recarregar a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [backendAvailable]);

  // Recarregar NPCs periodicamente para ver movimento (apenas se backend estiver disponível)
  useEffect(() => {
    if (!backendAvailable) return;
    
    const interval = setInterval(() => {
      loadAllNPCs();
    }, 5000); // Recarregar a cada 5 segundos (reduzido para evitar spam)

    return () => clearInterval(interval);
  }, [backendAvailable]);

  // ✅ Escutar edifícios criados via Socket.io para aparecer imediatamente no mapa
  useEffect(() => {
    if (!socket) return;

    const handleBuildingCreated = (data) => {
      if (data.building) {
        // ✅ Adicionar edifício à lista imediatamente
        setBuildings(prev => {
          // ✅ Evitar duplicatas - verificar por buildingId, building_id ou id
          const buildingId = data.building.buildingId || data.building.building_id || data.building.id;
          const exists = prev.some(b => {
            const bId = b.buildingId || b.building_id || b.id;
            return bId === buildingId;
          });
          
          if (exists) {
            console.log('🏗️ Edifício já existe na lista, atualizando...');
            // Atualizar edifício existente
            return prev.map(b => {
              const bId = b.buildingId || b.building_id || b.id;
              if (bId === buildingId) {
                return { ...b, ...data.building };
              }
              return b;
            });
          }
          
          // ✅ Validar posição antes de adicionar
          const position = data.building.position || { 
            lat: data.building.position_lat, 
            lng: data.building.position_lng 
          };
          
          if (!position || !position.lat || !position.lng || 
              isNaN(position.lat) || isNaN(position.lng)) {
            console.warn('⚠️ Edifício criado sem posição válida, recarregando lista...');
            // Recarregar lista completa em vez de adicionar inválido
            setTimeout(() => loadBuildings(), 500);
            return prev;
          }
          
          console.log('✅ Adicionando novo edifício ao mapa:', {
            id: buildingId,
            type: data.building.type,
            position: position,
            country: data.building.countryName || data.building.country_name
          });
          
          return [...prev, { ...data.building, position }];
        });
        
        console.log('🏗️ Novo edifício criado via Socket.io:', data.building);
        showSuccess(`✅ Edifício ${data.building.type || 'construído'} construído em ${data.building.countryName || 'país selecionado'}!`);
        
        // ✅ Recarregar lista após um pequeno delay para garantir que está sincronizado
        setTimeout(() => {
          loadBuildings();
        }, 1000);
      }
    };

    socket.on('building:created', handleBuildingCreated);

    return () => {
      socket.off('building:created', handleBuildingCreated);
    };
  }, [socket, showSuccess]);

  const loadUserUnits = async () => {
    if (!backendAvailable) return;
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const headers = {
        'user-id': userId
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/military/units`,
        { headers },
        3000
      );

      if (response.ok) {
        const data = await response.json();
        setUserUnits(data.units || []);
        setBackendAvailable(true);
      } else {
        setBackendAvailable(false);
        setUserUnits([]);
      }
    } catch (error) {
      // Silenciar erros de conexão
      setBackendAvailable(false);
      setUserUnits([]);
    }
  };

  const loadBuildings = async () => {
    // ✅ IMPORTANTE: Sempre carregar TODOS os edifícios do usuário para mostrar no mapa
    // Não apenas do país selecionado, pois o mapa mostra todos os edifícios
    try {
      const userId = localStorage.getItem('userId') || 'test-user-id';
      
      // ✅ Sempre carregar todos os edifícios do usuário
      const response = await fetch(`${API_BASE_URL}/buildings/user/${userId}`, {
        headers: {
          'user-id': userId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const buildingsList = data.buildings || data || [];
        
        // ✅ Validar e filtrar edifícios com posição válida
        const validBuildings = buildingsList.filter(building => {
          const hasPosition = building.position || (building.position_lat && building.position_lng);
          if (!hasPosition) {
            console.warn('Edifício sem posição válida:', building);
            return false;
          }
          
          const lat = building.position?.lat || building.position_lat;
          const lng = building.position?.lng || building.position_lng;
          
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn('Edifício com posição inválida:', building);
            return false;
          }
          
          return true;
        });
        
        setBuildings(validBuildings);
        console.log(`✅ Carregados ${validBuildings.length} edifícios válidos (de ${buildingsList.length} total)`);
        
        if (validBuildings.length > 0) {
          console.log('🏗️ Edifícios no mapa:', validBuildings.map(b => ({
            id: b.buildingId || b.building_id || b.id,
            type: b.type,
            position: b.position || { lat: b.position_lat, lng: b.position_lng },
            country: b.countryName || b.country_name
          })));
        }
      } else {
        console.warn('Erro ao carregar edifícios:', response.status);
        setBuildings([]);
      }
    } catch (error) {
      console.error('Erro ao carregar edifícios:', error);
      setBuildings([]);
    }
  };

  // Carregar TODOS os NPCs do mapa
  const loadAllNPCs = async () => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/npcs/all`, {}, 3000);
      
      if (response.ok) {
        const data = await response.json();
        const npcsList = data.npcs || [];
        setNPCs(npcsList);
        setBackendAvailable(true); // Backend está disponível
        
        // Log apenas se houver NPCs
        if (npcsList.length > 0) {
          console.log(`✅ ${npcsList.length} NPCs no mapa`);
        }
      } else {
        setBackendAvailable(false);
        setNPCs([]);
      }
    } catch (error) {
      // Silenciar erros de conexão após a primeira tentativa
      if (!window._backendWarningShown) {
        console.warn('⚠️ Backend não está rodando. Inicie: cd backend && npm start');
        window._backendWarningShown = true;
      }
      setBackendAvailable(false);
      setNPCs([]);
    }
  };

  // Função para criar NPCs iniciais automaticamente se necessário
  const createInitialNPCs = async (countryId, countryName) => {
    try {
      const token = localStorage.getItem('token');
      
      // Chamar endpoint do backend para criar NPCs iniciais
      const response = await fetch(`${API_BASE_URL}/npcs/create-initial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          countryId,
          countryName,
          count: 5 // Criar 5 NPCs iniciais
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Criados ${data.created || 0} NPCs iniciais para ${countryName}`);
      } else {
        console.log('⚠️ Não foi possível criar NPCs automaticamente. Construa edifícios para gerar NPCs!');
      }
    } catch (error) {
      console.error('Erro ao criar NPCs:', error);
    }
  };

  // Carregar dados GeoJSON dos países
  useEffect(() => {
    const loadCountriesData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/countries/geojson`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar dados dos países');
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // Se não for JSON, pode ser que o backend não esteja rodando
          throw new Error('Backend não está respondendo. Verifique se o servidor está rodando na porta 3001.');
        }
        
        const data = await response.json();
        setCountriesData(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao carregar países:', err);
        setError(err.message || 'Erro ao carregar mapa');
        // Fallback: tentar carregar dados locais se disponíveis
      } finally {
        setLoading(false);
      }
    };

    loadCountriesData();
  }, []);

  const handleCountryClick = (feature, countryId) => {
    // ✅ Garantir que sempre obtenhamos um ID válido do país
    const extractedCountryId = getCountryId(feature);
    const extractedCountryName = getCountryName(feature);
    
    // ✅ Usar ID extraído ou o passado como parâmetro
    let validCountryId = extractedCountryId || countryId;
    
    // ✅ Se ainda não tiver ID válido, gerar um baseado no nome (NUNCA deixar como 'UNK')
    if (!validCountryId || validCountryId === 'UNK' || validCountryId === 'XXX') {
      if (extractedCountryName && extractedCountryName !== 'País Desconhecido') {
        // Gerar ID a partir do nome se não tiver código ISO
        const normalized = extractedCountryName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        
        if (normalized.length >= 3) {
          validCountryId = normalized.substring(0, 3);
        } else if (normalized.length > 0) {
          validCountryId = (normalized + 'XXX').substring(0, 3);
        } else {
          // Se ainda não tiver, usar hash do nome completo
          let hash = 0;
          for (let i = 0; i < extractedCountryName.length; i++) {
            hash = ((hash << 5) - hash) + extractedCountryName.charCodeAt(i);
            hash = hash & hash;
          }
          validCountryId = Math.abs(hash).toString(36).substring(0, 3).toUpperCase().padEnd(3, 'X');
        }
      } else {
        // Último fallback: usar hash das propriedades do feature
        const propsStr = JSON.stringify(feature?.properties || {}).substring(0, 50);
        let hash = 0;
        for (let i = 0; i < propsStr.length; i++) {
          hash = ((hash << 5) - hash) + propsStr.charCodeAt(i);
          hash = hash & hash;
        }
        validCountryId = Math.abs(hash).toString(36).substring(0, 3).toUpperCase().padEnd(3, 'X');
      }
    }

    // ✅ Log para debug
    console.log('🌍 País clicado:', {
      extractedId: extractedCountryId,
      passedId: countryId,
      finalId: validCountryId,
      countryName: extractedCountryName,
      properties: feature?.properties,
      hasValidId: validCountryId && validCountryId !== 'UNK' && validCountryId !== 'XXX'
    });

    setSelectedCountry(validCountryId);
    setSelectedCountryData({
      id: validCountryId,
      name: extractedCountryName,
      properties: feature?.properties || {},
      geometry: feature?.geometry || null
    });
  };

  const handleCountryHover = (feature, countryId) => {
    // Pode adicionar lógica de hover aqui
  };

  // Handler para quando clicar na bolinha de investimento
  const handleInvestmentClick = (feature, countryId) => {
    // Usar função utilitária para obter ID do país (flexível)
    const validCountryId = getCountryId(feature) || countryId || 'UNK';
    const countryName = getCountryName(feature);
    
    setInvestmentCountry({
      id: validCountryId,
      name: countryName,
      properties: feature.properties,
      geometry: feature.geometry
    });
    setInvestmentModalOpen(true);
    // Também seleciona o país no mapa
    setSelectedCountry(validCountryId);
    setSelectedCountryData({
      id: validCountryId,
      name: countryName,
      properties: feature.properties,
      geometry: feature.geometry
    });
  };

  const handleInvestmentSuccess = () => {
    setInvestmentModalOpen(false);
    setInvestmentCountry(null);
    // Recarregar dados se necessário
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center text-red-400">
          <p className="text-xl mb-2">Erro ao carregar mapa</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const handleCountrySelect = (feature, countryId) => {
    handleCountryClick(feature, countryId);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-900 overflow-hidden">
        {/* Mapa - Ocupa a maior parte da tela */}
        <div className="flex-1 relative">
          {/* Barra de busca no topo */}
          <div className="absolute top-4 left-4 z-[1000] w-80">
            <CountrySearch
              countriesData={countriesData}
              onCountrySelect={handleCountrySelect}
            />
          </div>

          <WorldMap
            countriesData={countriesData}
            selectedCountry={selectedCountry}
            selectedCountryFeature={selectedCountryData}
            onCountryClick={handleCountryClick}
            onCountryHover={handleCountryHover}
            onInvestmentClick={handleInvestmentClick}
            units={userUnits}
            unitPositions={realtimeUpdates.unitPositions}
            buildings={buildings}
            npcs={npcs}
            socket={socket}
            onMapClick={(e) => {
              // ✅ Verificar se já há um modal de construção aberto (do CountryPanel)
              // Se sim, apenas atualizar a posição sem abrir novo modal
              if (buildingModalOpen && selectedCountry && selectedCountryData) {
                // Modal já está aberto, apenas atualizar a posição
                const clickedPosition = {
                  lat: e.latlng.lat,
                  lng: e.latlng.lng
                };
                
                setBuildingPosition(clickedPosition);
                console.log('📍 Posição atualizada no modal:', clickedPosition);
                return; // Não abrir novo modal
              }
              
              // ✅ Se não há modal aberto, identificar país e abrir novo modal
              const clickedPosition = {
                lat: e.latlng.lat,
                lng: e.latlng.lng
              };
              
              // ✅ Identificar país usando o GeoJSON carregado (OBRIGATÓRIO)
              if (!countriesData || !countriesData.features) {
                console.error('❌ GeoJSON não carregado ainda. Aguarde o carregamento do mapa.');
                alert('⚠️ Mapa ainda está carregando. Aguarde alguns segundos e tente novamente.');
                return;
              }
              
              const countryInfo = identifyCountryFromMapClick(e.latlng, countriesData);
              
              console.log('📍 Clique no mapa:', {
                coordenadas: clickedPosition,
                país: countryInfo.countryName,
                id: countryInfo.countryId,
                válido: countryInfo.valid,
                feature: countryInfo.feature
              });
              
              // ✅ VALIDAÇÃO: Só abrir modal se país foi identificado
              if (!countryInfo.valid || !countryInfo.countryId || countryInfo.countryId === 'UNK' || countryInfo.countryId === 'XXX') {
                console.warn('⚠️  País não identificado no clique:', {
                  coordenadas: clickedPosition,
                  countryInfo,
                  hasFeatures: countriesData?.features?.length
                });
                alert('⚠️ Não foi possível identificar o país neste local.\n\n💡 Dica: Clique diretamente sobre a área colorida de um país no mapa.\n\nO sistema precisa identificar em qual país você está construindo.');
                return; // Não abrir modal se país não foi identificado
              }
              
              // ✅ Definir posição e país ANTES de abrir modal
              setBuildingPosition(clickedPosition);
              setSelectedCountry(countryInfo.countryId);
              setSelectedCountryData({
                id: countryInfo.countryId,
                name: countryInfo.countryName || 'País Selecionado',
                properties: countryInfo.feature?.properties || {},
                geometry: countryInfo.feature?.geometry || null
              });
              
              console.log('✅ País identificado com sucesso:', {
                countryId: countryInfo.countryId,
                countryName: countryInfo.countryName
              });
              
              // Só abrir modal se país foi identificado corretamente
              setBuildingModalOpen(true);
            }}
          />
        </div>

        {/* Painel lateral */}
        <CountryPanel
          country={selectedCountryData}
          onClose={() => {
            setSelectedCountry(null);
            setSelectedCountryData(null);
          }}
        />

        {/* Status de conexão em tempo real */}
        <RealtimeStatus />

        {/* Container de notificações toast */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* Centro de notificações */}
        <NotificationCenter />

        {/* Modal de Investimento */}
        {investmentModalOpen && investmentCountry && (
          <InvestmentModal
            country={investmentCountry}
            onClose={() => {
              setInvestmentModalOpen(false);
              setInvestmentCountry(null);
            }}
            onSuccess={handleInvestmentSuccess}
          />
        )}

        {/* Modal de Construção */}
        {buildingModalOpen && (
          <BuildingModal
            isOpen={buildingModalOpen}
            onClose={() => {
              setBuildingModalOpen(false);
              setBuildingPosition(null);
            }}
            countryId={selectedCountry || 'UNK'}
            countryName={selectedCountryData?.name || 'Local Selecionado'}
            position={buildingPosition} // Pode ser null, será calculado automaticamente se necessário
            countryGeometry={selectedCountryData?.geometry} // ✅ Passar geometria para calcular centroide
            onBuild={(building) => {
              // ✅ Recarregar TODOS os edifícios após construir (não apenas do país selecionado)
              console.log('🏗️ Edifício construído, recarregando lista...', building);
              
              // Recarregar imediatamente
              loadBuildings();
              
              // Recarregar novamente após um delay para garantir que apareceu
              setTimeout(() => {
                loadBuildings();
                console.log('🔄 Recarregando edifícios após construção...');
              }, 1500);
              
              // Recarregar todos os NPCs para ver os construtores
              setTimeout(() => {
                loadAllNPCs();
              }, 1000);
              
              setBuildingModalOpen(false);
              setBuildingPosition(null);
              showSuccess(`✅ Edifício construído! O dinheiro foi deduzido da sua carteira. 10 NPCs construtores foram enviados.`);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

