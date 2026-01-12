import { useState, useEffect } from 'react';
import { API_BASE_URL, apiRequest } from '../config/api';

/**
 * ✅ FASE 18.6: Histórico de Compras/Vendas do Jogador
 */
export default function PropertyHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'purchases', 'sales'

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const { data } = await apiRequest(`/property-marketplace/transactions?userId=${userId}`);
      
      let filteredTransactions = data.transactions || data || [];
      
      if (filter === 'purchases') {
        filteredTransactions = filteredTransactions.filter(t => t.buyerId === userId);
      } else if (filter === 'sales') {
        filteredTransactions = filteredTransactions.filter(t => t.sellerId === userId);
      }
      
      // Ordenar por data mais recente
      filteredTransactions.sort((a, b) => {
        const dateA = new Date(a.transactionDate || a.transaction_date || a.createdAt || a.created_at);
        const dateB = new Date(b.transactionDate || b.transaction_date || b.createdAt || b.created_at);
        return dateB - dateA;
      });
      
      setTransactions(filteredTransactions);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      setError('Não foi possível carregar o histórico de transações.');
    } finally {
      setLoading(false);
    }
  };

  const buildingTypeLabels = {
    house: '🏠 Casa',
    apartment: '🏢 Apartamento',
    office: '🏛️ Escritório',
    skyscraper: '🏙️ Arranha-céu',
    factory: '🏭 Fábrica',
    mall: '🏬 Shopping'
  };

  const getTransactionType = (transaction, userId) => {
    if (transaction.buyerId === userId) return 'purchase';
    if (transaction.sellerId === userId) return 'sale';
    return 'unknown';
  };

  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-300">Histórico de Transações Imobiliárias</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('purchases')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              filter === 'purchases' ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Compras
          </button>
          <button
            onClick={() => setFilter('sales')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              filter === 'sales' ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Vendas
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400 text-sm">Carregando histórico...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-400 text-sm">{error}</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-sm">
          <p>Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((transaction) => {
            const userId = localStorage.getItem('userId') || 'test-user-id';
            const type = getTransactionType(transaction, userId);
            const isPurchase = type === 'purchase';
            const isSale = type === 'sale';
            
            return (
              <div
                key={transaction.id || transaction.transactionId}
                className={`bg-gray-600 rounded-lg p-3 border-l-4 ${
                  isPurchase ? 'border-green-500' : isSale ? 'border-yellow-500' : 'border-gray-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        isPurchase ? 'bg-green-900 text-green-300' : isSale ? 'bg-yellow-900 text-yellow-300' : 'bg-gray-800 text-gray-300'
                      }`}>
                        {isPurchase ? '💰 Compra' : isSale ? '💵 Venda' : '📋 Transação'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {buildingTypeLabels[transaction.buildingType] || transaction.buildingType || 'Edifício'}
                      </span>
                    </div>
                    <p className="text-sm text-white font-semibold">
                      {transaction.cityName || 'Cidade desconhecida'}
                      {transaction.countryName && `, ${transaction.countryName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${isPurchase ? 'text-red-400' : 'text-green-400'}`}>
                      {isPurchase ? '-' : '+'}
                      {parseFloat(transaction.price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL
                    </div>
                    {transaction.brokerFee > 0 && (
                      <div className="text-xs text-gray-400">
                        Taxa: {parseFloat(transaction.brokerFee).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VAL
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(transaction.transactionDate || transaction.transaction_date || transaction.createdAt || transaction.created_at).toLocaleString('pt-BR')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

