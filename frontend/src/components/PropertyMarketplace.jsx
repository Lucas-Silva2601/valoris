import { useState, useEffect } from 'react';
import { API_BASE_URL, apiRequest } from '../config/api';
import PropertyDetailsModal from './PropertyDetailsModal';

/**
 * ✅ FASE 18.6: Interface de Marketplace Imobiliário
 * Listagem de imóveis à venda com filtros e busca
 */
export default function PropertyMarketplace({ onClose }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filtros
  const [filters, setFilters] = useState({
    buildingType: '',
    cityId: '',
    minPrice: '',
    maxPrice: '',
    search: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.buildingType) queryParams.append('buildingType', filters.buildingType);
      if (filters.cityId) queryParams.append('cityId', filters.cityId);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
      
      // ✅ FASE 18.7: Adicionar paginação aos query params
      queryParams.append('page', filters.page || 1);
      queryParams.append('limit', filters.limit || 20);
      
      const url = `${API_BASE_URL}/property-marketplace/listings${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const { data } = await apiRequest(url);
      
      let filteredListings = data.listings || data || [];
      
      // ✅ FASE 18.7: Armazenar informações de paginação
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      // Busca por texto (nome, cidade, país)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredListings = filteredListings.filter(listing => 
          listing.building?.name?.toLowerCase().includes(searchLower) ||
          listing.building?.cityName?.toLowerCase().includes(searchLower) ||
          listing.building?.countryName?.toLowerCase().includes(searchLower) ||
          listing.description?.toLowerCase().includes(searchLower)
        );
      }
      
      setListings(filteredListings);
    } catch (err) {
      console.error('Erro ao carregar listagens:', err);
      setError('Não foi possível carregar as listagens de imóveis.');
    } finally {
      setLoading(false);
    }
  };

  const handleListingClick = (listing) => {
    setSelectedListing(listing);
    setShowDetailsModal(true);
  };

  const handlePurchaseSuccess = () => {
    loadListings(); // Recarregar após compra
    setShowDetailsModal(false);
  };

  const buildingTypeLabels = {
    house: '🏠 Casa',
    apartment: '🏢 Apartamento',
    office: '🏛️ Escritório',
    skyscraper: '🏙️ Arranha-céu',
    factory: '🏭 Fábrica',
    mall: '🏬 Shopping'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div 
        className="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] border border-gray-700 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">🏘️ Marketplace Imobiliário</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-gray-700 rounded-lg p-4 mb-4 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Edifício</label>
              <select
                value={filters.buildingType}
                onChange={(e) => setFilters({ ...filters, buildingType: e.target.value })}
                className="w-full bg-gray-600 text-white rounded-lg p-2 text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(buildingTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preço Mínimo (VAL)</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="w-full bg-gray-600 text-white rounded-lg p-2 text-sm"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Preço Máximo (VAL)</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="w-full bg-gray-600 text-white rounded-lg p-2 text-sm"
                placeholder="Sem limite"
              />
            </div>
          </div>
          
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">Buscar</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full bg-gray-600 text-white rounded-lg p-2 text-sm"
              placeholder="Buscar por nome, cidade ou país..."
            />
          </div>
        </div>

        {/* Lista de Imóveis */}
        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Carregando imóveis...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-lg mb-2">Nenhum imóvel encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou verifique novamente mais tarde.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((listing) => (
                <div
                  key={listing.id || listing.listingId}
                  onClick={() => handleListingClick(listing)}
                  className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-blue-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {buildingTypeLabels[listing.building?.type] || listing.building?.type || 'Edifício'}
                        {listing.building?.level && ` Nível ${listing.building.level}`}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {listing.building?.cityName || 'Cidade desconhecida'}
                        {listing.building?.countryName && `, ${listing.building.countryName}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-400">
                        {parseFloat(listing.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL
                      </div>
                    </div>
                  </div>
                  
                  {listing.description && (
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">{listing.description}</p>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                    <span>Listado em: {new Date(listing.createdAt || listing.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded">Ver Detalhes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-4 pt-4 border-t border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>
              {listings.length} imóvel{listings.length !== 1 ? 'eis' : ''} encontrado{listings.length !== 1 ? 's' : ''}
              {pagination && ` (Página ${pagination.page} de ${pagination.totalPages || 1})`}
            </span>
            <div className="flex gap-2 items-center">
              {pagination && pagination.page > 1 && (
                <button
                  onClick={() => {
                    setFilters({ ...filters, page: filters.page - 1 });
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors text-xs"
                >
                  ← Anterior
                </button>
              )}
              {pagination && pagination.page < (pagination.totalPages || 1) && (
                <button
                  onClick={() => {
                    setFilters({ ...filters, page: filters.page + 1 });
                  }}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white transition-colors text-xs"
                >
                  Próxima →
                </button>
              )}
              <button
                onClick={loadListings}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                🔄 Atualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedListing && (
        <PropertyDetailsModal
          listing={selectedListing}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedListing(null);
          }}
          onPurchaseSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  );
}

