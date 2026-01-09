import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function WalletDisplay() {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || 'test-user-id';
      const headers = {
        'Content-Type': 'application/json',
        'user-id': userId // Sempre enviar user-id para fase de teste
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const [balanceRes, transactionsRes] = await Promise.all([
        fetchWithTimeout(`${API_URL}/wallet/balance`, { headers }, 3000),
        fetchWithTimeout(`${API_URL}/wallet/transactions?limit=5`, { headers }, 3000)
      ]);

      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance || 0);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      }
    } catch (error) {
      // Silenciar erros de conexão
      setBalance(0);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'VAL', // Valoris Coin
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Carteira</h3>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                setLoading(true);
                const userId = localStorage.getItem('userId') || 'test-user-id';
                const headers = { 
                  'Content-Type': 'application/json',
                  'user-id': userId
                };
                
                const res = await fetchWithTimeout(`${API_URL}/wallet/faucet`, {
                  method: 'POST',
                  headers
                }, 5000);
                
                const data = await res.json();
                
                if (res.ok && data.success) {
                  // ✅ Atualizar saldo imediatamente sem refresh
                  setBalance(data.balance);
                  
                  // Mostrar notificação
                  alert(data.message || `💰 ${data.added.toLocaleString('pt-BR')} VAL adicionados!`);
                  
                  // Recarregar dados para atualizar transações
                  loadWalletData();
                } else {
                  alert(data.error || 'Erro ao adicionar saldo');
                }
              } catch (error) {
                console.error('Erro no faucet:', error);
                alert(`Erro: ${error.message}`);
              } finally {
                setLoading(false);
              }
            }}
            className="text-yellow-400 hover:text-yellow-300 transition-colors text-xs cursor-pointer disabled:opacity-50"
            title="Adicionar 100.000 VAL (Faucet)"
            disabled={loading}
          >
            💰
          </button>
          <button
            onClick={loadWalletData}
            className="text-gray-400 hover:text-white transition-colors"
            title="Atualizar"
          >
            🔄
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-2xl font-bold text-green-400">
          {formatCurrency(balance)}
        </div>
        <div className="text-xs text-gray-400 mt-1">Saldo disponível</div>
      </div>

      {transactions.length > 0 && (
        <div className="border-t border-gray-700 pt-3">
          <div className="text-xs font-semibold text-gray-400 mb-2">Últimas transações</div>
          <div className="space-y-2">
            {transactions.slice(0, 3).map((transaction, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-300 truncate flex-1">
                  {transaction.description}
                </span>
                <span className={`ml-2 ${
                  transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

