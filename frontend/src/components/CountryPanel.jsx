import { useState, useEffect } from 'react';
import InvestmentModal from './InvestmentModal';
import MilitaryUnitModal from './MilitaryUnitModal';
import WalletDisplay from './WalletDisplay';
import UserProfile from './UserProfile';
import ShareholdersList from './ShareholdersList';
import EconomicChart from './EconomicChart';
import MissionsPanel from './MissionsPanel';
import InvestmentHistory from './InvestmentHistory';
import DefenseInfo from './DefenseInfo';
import BuildingModal from './BuildingModal';
import { isValidCountryId } from '../utils/countryUtils';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CountryPanel({ country, onClose }) {
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showMilitaryModal, setShowMilitaryModal] = useState(false);
  const [ownershipInfo, setOwnershipInfo] = useState(null);
  const [economicMetrics, setEconomicMetrics] = useState(null);
  const [treasuryInfo, setTreasuryInfo] = useState(null);
  const [economicData, setEconomicData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);

  useEffect(() => {
    if (country) {
      loadCountryData();
    }
  }, [country]);

  const loadCountryData = async () => {
    if (!country) return;

    setLoading(true);
    try {
      const [ownershipRes, economicRes, treasuryRes, economicDataRes] = await Promise.all([
        fetchWithTimeout(`${API_URL}/ownership/${country.id}/info`, {}, 3000).catch(() => null),
        fetchWithTimeout(`${API_URL}/economic/${country.id}`, {}, 3000).catch(() => null),
        fetchWithTimeout(`${API_URL}/treasury/${country.id}`, {}, 3000).catch(() => null),
        fetchWithTimeout(`${API_URL}/countries/${country.id}/economic`, {}, 3000).catch(() => null)
      ]);

      if (ownershipRes?.ok) {
        const data = await ownershipRes.json();
        setOwnershipInfo(data);
        // Se vier dados econômicos na resposta
        if (data.economicData) {
          setEconomicData(data.economicData);
        }
      }

      if (economicRes?.ok) {
        const data = await economicRes.json();
        setEconomicMetrics(data);
      }

      if (treasuryRes?.ok) {
        const data = await treasuryRes.json();
        setTreasuryInfo(data);
      }

      if (economicDataRes?.ok) {
        const data = await economicDataRes.json();
        setEconomicData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do país:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentSuccess = () => {
    loadCountryData();
  };

  if (!country) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto">
        <div className="text-center text-gray-400 mt-20">
          <p className="text-lg mb-2">🗺️</p>
          <p>Selecione um país no mapa</p>
          <p className="text-sm mt-2 text-gray-500">
            Clique em qualquer país para ver detalhes
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{country.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Perfil do Usuário */}
        <div className="mb-4">
          <UserProfile />
        </div>

        {/* Carteira */}
        <div className="mb-4">
          <WalletDisplay />
        </div>

        <div className="space-y-4 flex-1">
          {/* Informações básicas */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Informações do País</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">Código:</span>
                <span className="text-white ml-2">{country.id}</span>
              </div>
              {economicData && (
                <>
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Economia:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        economicData.multiplier >= 3.0 ? 'bg-red-900 text-red-200' :
                        economicData.multiplier >= 2.0 ? 'bg-orange-900 text-orange-200' :
                        economicData.multiplier >= 1.0 ? 'bg-yellow-900 text-yellow-200' :
                        'bg-green-900 text-green-200'
                      }`}>
                        {economicData.costCategory}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <span className="text-gray-400 text-xs">PIB:</span>
                        <span className="text-white ml-1 block text-xs">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'USD',
                            notation: 'compact',
                            maximumFractionDigits: 1
                          }).format(economicData.gdp * 1000000)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">IDH:</span>
                        <span className="text-white ml-1 block text-xs">{economicData.hdi.toFixed(3)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 text-xs">Categoria:</span>
                        <span className="text-white ml-1 text-xs">{economicData.category}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 text-xs">Custo de investimento:</span>
                        <span className="text-yellow-400 ml-1 font-bold text-xs">
                          {economicData.multiplier.toFixed(1)}x o preço base
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status do país */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Status do País</h3>
            {loading ? (
              <div className="text-gray-400 text-sm">Carregando...</div>
            ) : (
              <div className="space-y-2 text-sm">
                {ownershipInfo && (
                  <>
                    <div>
                      <span className="text-gray-400">Preço por ação:</span>
                      <span className="text-white ml-2">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'VAL'
                        }).format(ownershipInfo.currentSharePrice)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Ações disponíveis:</span>
                      <span className="text-white ml-2">{ownershipInfo.availableShares.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total investido:</span>
                      <span className="text-white ml-2">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'VAL'
                        }).format(ownershipInfo.totalInvested)}
                      </span>
                    </div>
                  </>
                )}
                {economicMetrics && (
                  <>
                    <div>
                      <span className="text-gray-400">Saúde Econômica:</span>
                      <span className="text-white ml-2">{economicMetrics.healthScore.toFixed(1)}/100</span>
                    </div>
                    <div className="mt-2">
                      <EconomicChart countryId={country.id} />
                    </div>
                  </>
                )}
                {treasuryInfo && (
                  <div>
                    <span className="text-gray-400">Tesouro Nacional:</span>
                    <span className="text-white ml-2">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'VAL'
                      }).format(treasuryInfo.balance)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Informações de Defesa */}
          <DefenseInfo countryId={country.id} />

          {/* Lista de acionistas */}
          {ownershipInfo && (
            <div className="bg-gray-700 rounded-lg p-4">
              <ShareholdersList countryId={country.id} />
            </div>
          )}

          {/* Painel de missões */}
          <div className="bg-gray-700 rounded-lg p-4">
            <MissionsPanel />
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <button
              onClick={() => setShowInvestmentModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Investir em Ações
            </button>
            <button
              onClick={() => setShowMilitaryModal(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Comprar Unidades
            </button>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Atacar
            </button>
            <button
              onClick={() => {
                if (!country || !isValidCountryId(country.id)) {
                  alert('Por favor, selecione um país válido no mapa antes de construir.');
                  console.error('País inválido ao tentar construir:', country);
                  return;
                }
                setShowBuildingModal(true);
              }}
              disabled={!country || !isValidCountryId(country.id)}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              🏗️ Construir Edifício
            </button>
          </div>

          {/* Histórico de Investimentos */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Histórico de Investimentos</h3>
            <InvestmentHistory />
          </div>
        </div>
      </div>

      {showInvestmentModal && (
        <InvestmentModal
          country={country}
          onClose={() => setShowInvestmentModal(false)}
          onSuccess={handleInvestmentSuccess}
        />
      )}

      {showMilitaryModal && (
        <MilitaryUnitModal
          country={country}
          onClose={() => setShowMilitaryModal(false)}
          onSuccess={handleInvestmentSuccess}
        />
      )}

      {showBuildingModal && country && isValidCountryId(country.id) && (
        <BuildingModal
          isOpen={showBuildingModal}
          onClose={() => setShowBuildingModal(false)}
          countryId={country.id}
          countryName={country.name || 'País Desconhecido'}
          position={null} // Será definido quando o usuário clicar no mapa
          onBuild={(building) => {
            handleInvestmentSuccess(); // Recarregar dados
            setShowBuildingModal(false);
          }}
        />
      )}
    </>
  );
}

