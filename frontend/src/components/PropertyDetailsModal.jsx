import { useState, useEffect } from 'react';
import { API_BASE_URL, apiRequest } from '../config/api';
import { useToast } from '../hooks/useToast';

/**
 * ✅ FASE 18.6: Modal de Detalhes do Imóvel com Processo de Compra
 */
export default function PropertyDetailsModal({ listing, onClose, onPurchaseSuccess }) {
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);
  const { showSuccess, showError } = useToast();

  const building = listing.building || {};
  const buildingTypeLabels = {
    house: '🏠 Casa',
    apartment: '🏢 Apartamento',
    office: '🏛️ Escritório',
    skyscraper: '🏙️ Arranha-céu',
    factory: '🏭 Fábrica',
    mall: '🏬 Shopping'
  };

  // Carregar saldo da carteira
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const userId = localStorage.getItem('userId') || 'test-user-id';
        const response = await fetch(`${API_BASE_URL}/wallet/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.balance || 0);
        }
      } catch (error) {
        console.error('Erro ao carregar carteira:', error);
      }
    };
    loadWallet();
  }, []);

  const handlePurchase = async () => {
    if (!listing.listingId && !listing.id) {
      showError('ID da listagem não encontrado');
      return;
    }

    setLoading(true);
    try {
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const listingId = listing.listingId || listing.id;
      
      const { data } = await apiRequest(`/property-marketplace/listings/${listingId}/purchase`, {
        method: 'POST',
        body: JSON.stringify({ buyerId: userId })
      });

      if (data.success || data.transaction) {
        showSuccess(`✅ Imóvel comprado com sucesso por ${parseFloat(listing.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL!`);
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        onClose();
      } else {
        showError(data.error || 'Erro ao comprar imóvel');
      }
    } catch (error) {
      console.error('Erro ao comprar imóvel:', error);
      showError(error.message || 'Erro ao processar compra');
    } finally {
      setLoading(false);
    }
  };

  const canAfford = walletBalance !== null && walletBalance >= parseFloat(listing.price || 0);
  const price = parseFloat(listing.price || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-4">
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Detalhes do Imóvel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Informações do Edifício */}
        <div className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">
                {buildingTypeLabels[building.type] || building.type || 'Edifício'}
                {building.level && ` Nível ${building.level}`}
              </h3>
              <div className="text-2xl font-bold text-green-400">
                {price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">Localização:</span>
                <p className="text-white font-semibold">
                  {building.cityName || 'Cidade desconhecida'}
                  {building.countryName && `, ${building.countryName}`}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Condição:</span>
                <p className="text-white font-semibold">{building.condition || 100}%</p>
              </div>
              {building.yieldRate && (
                <div>
                  <span className="text-gray-400">Yield Atual:</span>
                  <p className="text-green-400 font-semibold">
                    {parseFloat(building.yieldRate).toFixed(2)} VAL/h
                  </p>
                </div>
              )}
              {building.capacity && (
                <div>
                  <span className="text-gray-400">Capacidade:</span>
                  <p className="text-white font-semibold">{building.capacity} pessoas</p>
                </div>
              )}
            </div>
          </div>

          {listing.description && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Descrição</h4>
              <p className="text-gray-300 text-sm">{listing.description}</p>
            </div>
          )}

          {/* Informações de Compra */}
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700">
            <h4 className="text-sm font-semibold text-blue-300 mb-2">Informações de Compra</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Preço do Imóvel:</span>
                <span className="text-white font-semibold">{price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Taxa de Corretagem (5%):</span>
                <span className="text-yellow-400 font-semibold">{(price * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-800">
                <span className="text-blue-300 font-semibold">Total a Pagar:</span>
                <span className="text-blue-400 font-bold text-lg">{price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL</span>
              </div>
              {walletBalance !== null && (
                <div className="flex justify-between pt-2 border-t border-blue-800">
                  <span className="text-gray-300">Seu Saldo:</span>
                  <span className={`font-semibold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                    {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Avisos */}
          {walletBalance !== null && !canAfford && (
            <div className="bg-red-900 bg-opacity-30 rounded-lg p-3 border border-red-700 text-sm text-red-300">
              ⚠️ Saldo insuficiente. Você precisa de mais {(price - walletBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL para comprar este imóvel.
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading || (walletBalance !== null && !canAfford)}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
          >
            {loading ? '⏳ Processando...' : '💰 Comprar Imóvel'}
          </button>
        </div>
      </div>
    </div>
  );
}

