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
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import EventLog from '../components/EventLog';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../hooks/useSocket';
import { getCountryId, getCountryName } from '../utils/countryUtils';
import { identifyCountryFromMapClick, identifyHierarchyFromMapClickImmediate } from '../utils/mapClickUtils';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { getApiUrl, isConfigLoaded, initializeConfig } from '../config/api';

export default function GamePage() {
  // ✅ NOVO: Estado para controlar quando a configuração está pronta
  const [isConfigReady, setIsConfigReady] = useState(false);
  
  const [countriesData, setCountriesData] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCountryData, setSelectedCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userUnits, setUserUnits] = useState([]);
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [investmentCountry, setInvestmentCountry] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [buildingPosition, setBuildingPosition] = useState(null);
  const [locationHierarchy, setLocationHierarchy] = useState({
    world: { id: 'world', name: 'Mundo' },
    country: null,
    state: null,
    city: null,
  });

  const realtimeUpdates = useRealtimeUpdates(selectedCountry);
  const { toasts, removeToast, showSuccess } = useToast();
  const { socket } = useSocket();
  
  // ✅ CORREÇÃO CRÍTICA: Aguardar configuração estar pronta antes de renderizar
  useEffect(() => {
    const initConfig = async () => {
      console.log('🚀 GamePage: Aguardando configuração da API...');
      try {
        await initializeConfig();
        console.log('✅ GamePage: Configuração pronta!');
        setIsConfigReady(true);
      } catch (err) {
        console.error('❌ GamePage: Erro ao inicializar configuração:', err);
        // Mesmo com erro, permitir renderização (usará fallback)
        setIsConfigReady(true);
      }
    };
    
    initConfig();
  }, []);

  // Carregar unidades do usuário
  useEffect(() => {
    loadUserUnits();
  }, []);

  const [backendAvailable, setBackendAvailable] = useState(true);

  // Carregar edifícios quando backend fica disponível e periodicamente
  useEffect(() => {
    if (backendAvailable) {
      loadBuildings();
    } else {
      setBuildings([]);
    }
  }, [backendAvailable]);
  
  // Recarregar edifícios periodicamente
  useEffect(() => {
    if (!backendAvailable) return;
    
    const interval = setInterval(() => {
      loadBuildings();
    }, 10000); // Recarregar a cada 10 segundos
    
    return () => clearInterval(interval);
  }, [backendAvailable]);


  // Escutar edifícios criados via Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleBuildingCreated = (data) => {
      if (data.building) {
        setBuildings(prev => {
          // Evitar duplicatas
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
          
          // Validar posição antes de adicionar
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
        
        // Recarregar lista após delay para sincronização
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
      
      const apiUrl = await getApiUrl();
      const response = await fetchWithTimeout(
        `${apiUrl}/military/units`,
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
    // Sempre carregar todos os edifícios do usuário para mostrar no mapa
    try {
      const apiUrl = await getApiUrl();
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const response = await fetch(`${apiUrl}/buildings/user/${userId}`, {
        headers: {
          'user-id': userId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const buildingsList = data.buildings || data || [];
        
        // Validar e filtrar edifícios com posição válida
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
        // ✅ FASE 19.1: Fallback - retornar array vazio se API falhar
        console.warn('API de edifícios retornou erro, usando fallback []');
        setBuildings([]);
      }
    } catch (error) {
      // ✅ FASE 19.1: Fallback - retornar array vazio se fetch falhar
      console.warn('Erro ao carregar edifícios, usando fallback []:', error.message);
      setBuildings([]);
    }
  };


  // 🚨 CORREÇÃO: Aguardar configuração do backend antes de carregar
  useEffect(() => {
    const loadCountriesData = async () => {
      try {
        console.log('🗺️  GamePage: Iniciando carregamento de países...');
        
        // ✅ Aguardar configuração do backend
        const apiUrl = await getApiUrl();
        console.log('📡 API URL:', `${apiUrl}/countries/geojson`);
        
        setLoading(true);
        const response = await fetch(`${apiUrl}/countries/geojson`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Backend não está respondendo JSON');
        }
        
        const data = await response.json();
        console.log(`✅ Países carregados: ${data.features?.length || 0} features`);
        setCountriesData(data);
        setError(null);
        setBackendAvailable(true);
      } catch (err) {
        // ✅ FALLBACK RESILIENTE: Mapa vazio mas funcional
        console.error('❌ Erro ao carregar países:', err.message);
        console.warn('⚠️  Usando fallback: mapa sem países (apenas camada base)');
        setError(null); // Não mostrar erro visual, apenas log
        setBackendAvailable(false);
        
        // Fallback: GeoJSON vazio mas válido
        setCountriesData({
          type: 'FeatureCollection',
          features: []
        });
        
        // Tentar reconectar após 5 segundos
        setTimeout(() => {
          console.log('🔄 Tentando reconectar backend...');
          loadCountriesData();
        }, 5000);
      } finally {
        setLoading(false);
        console.log('✅ GamePage: Carregamento finalizado');
      }
    };

    loadCountriesData();
  }, []);

  const handleCountryClick = (feature, countryId) => {
    const extractedCountryId = getCountryId(feature);
    const extractedCountryName = getCountryName(feature);
    let validCountryId = extractedCountryId || countryId;
    
    // Gerar ID baseado no nome se necessário
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
    // Atualizar hierarquia de localização
    setLocationHierarchy(prev => ({
      ...prev,
      country: { id: validCountryId, name: extractedCountryName, feature: feature },
      state: null,
      city: null,
    }));
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


  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-900 overflow-hidden">
        {/* Mapa - Ocupa a maior parte da tela */}
        <div className="flex-1 relative">
          {/* Barra de busca no topo */}
          <div className="absolute top-4 left-4 z-[1000] w-80">
            <CountrySearch
              countriesData={countriesData}
              onCountrySelect={handleCountryClick}
            />
          </div>

          {/* Breadcrumbs de Localização */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
            <BreadcrumbNavigation
              hierarchy={locationHierarchy}
              onBreadcrumbClick={(level, id) => {
                if (level === 'world') {
                  setSelectedCountry(null);
                  setSelectedCountryData(null);
                  setLocationHierarchy({
                    world: { id: 'world', name: 'Mundo' },
                    country: null,
                    state: null,
                    city: null,
                  });
                } else if (level === 'country' && locationHierarchy.country?.id === id) {
                  // Já está no país, não faz nada ou reseta estado/cidade
                  setLocationHierarchy(prev => ({
                    ...prev,
                    state: null,
                    city: null,
                  }));
                } else if (level === 'country') {
                  // Lógica para selecionar país (pode ser necessário buscar feature)
                  const countryFeature = countriesData?.features?.find(f => getCountryId(f) === id);
                  if (countryFeature) {
                    handleCountryClick(countryFeature, id);
                  }
                }
              }}
            />
          </div>

          <ErrorBoundary 
            message="Erro ao carregar o mapa. O componente será reiniciado automaticamente."
            autoReset={true}
            autoResetDelay={3000}
            showReload={false}
          >
            <WorldMap
              countriesData={countriesData}
              selectedCountry={selectedCountry}
              selectedCountryFeature={selectedCountryData}
              onCountryClick={handleCountryClick}
              onInvestmentClick={handleInvestmentClick}
              units={userUnits}
              unitPositions={realtimeUpdates.unitPositions}
              buildings={buildings}
              socket={socket}
              selectedStateId={locationHierarchy?.state?.id}
              selectedCityId={locationHierarchy?.city?.id}
            onMapClick={async (e) => {
              // Verificar se já há um modal de construção aberto
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
              
              const clickedPosition = {
                lat: e.latlng.lat,
                lng: e.latlng.lng
              };
              
              // Identificar país usando o GeoJSON carregado
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
              
              // Só abrir modal se país foi identificado
              if (!countryInfo.valid || !countryInfo.countryId || countryInfo.countryId === 'UNK' || countryInfo.countryId === 'XXX') {
                console.warn('⚠️  País não identificado no clique:', {
                  coordenadas: clickedPosition,
                  countryInfo,
                  hasFeatures: countriesData?.features?.length
                });
                alert('⚠️ Não foi possível identificar o país neste local.\n\n💡 Dica: Clique diretamente sobre a área colorida de um país no mapa.\n\nO sistema precisa identificar em qual país você está construindo.');
                return; // Não abrir modal se país não foi identificado
              }
              
              // Tentar identificar hierarquia completa (país, estado, cidade)
              try {
                const hierarchyInfo = await identifyHierarchyFromMapClickImmediate(e.latlng);
                if (hierarchyInfo.valid) {
                  setLocationHierarchy({
                    world: { id: 'world', name: 'Mundo' },
                    country: hierarchyInfo.country ? {
                      id: hierarchyInfo.country.id,
                      name: hierarchyInfo.country.name,
                      feature: countryInfo.feature
                    } : null,
                    state: hierarchyInfo.state ? {
                      id: hierarchyInfo.state.id,
                      name: hierarchyInfo.state.name
                    } : null,
                    city: hierarchyInfo.city ? {
                      id: hierarchyInfo.city.id,
                      name: hierarchyInfo.city.name
                    } : null,
                  });
                } else {
                  // Se não conseguir identificar hierarquia, pelo menos definir o país
                  setLocationHierarchy(prev => ({
                    ...prev,
                    country: {
                      id: countryInfo.countryId,
                      name: countryInfo.countryName || 'País Selecionado',
                      feature: countryInfo.feature
                    },
                    state: null,
                    city: null,
                  }));
                }
              } catch (hierarchyError) {
                console.warn('⚠️ Erro ao identificar hierarquia completa:', hierarchyError);
                // Continuar mesmo se falhar a identificação da hierarquia
                setLocationHierarchy(prev => ({
                  ...prev,
                  country: {
                    id: countryInfo.countryId,
                    name: countryInfo.countryName || 'País Selecionado',
                    feature: countryInfo.feature
                  },
                  state: null,
                  city: null,
                }));
              }
              
              // Definir posição e país antes de abrir modal
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
          </ErrorBoundary>
        </div>

        {/* Painel lateral */}
        <ErrorBoundary
          message="Erro ao carregar o painel lateral. O componente será reiniciado automaticamente."
          autoReset={true}
          autoResetDelay={3000}
          showReload={false}
        >
          <CountryPanel
            country={selectedCountryData}
            onClose={() => {
              setSelectedCountry(null);
              setSelectedCountryData(null);
            }}
          />
        </ErrorBoundary>

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
            countryGeometry={selectedCountryData?.geometry}
            cityId={locationHierarchy?.city?.id || null}
            onBuild={(building) => {
              console.log('🏗️ Edifício construído, recarregando lista...', building);
              loadBuildings();
              setTimeout(() => {
                loadBuildings();
              }, 1500);
              setBuildingModalOpen(false);
              setBuildingPosition(null);
              showSuccess(`✅ Edifício construído! O dinheiro foi deduzido da sua carteira. 10 NPCs construtores foram enviados.`);
            }}
          />
        )}

        {/* ✅ FASE 19.4: Log de Eventos (apenas em desenvolvimento) */}
        <EventLog />
      </div>
    </ErrorBoundary>
  );
}

