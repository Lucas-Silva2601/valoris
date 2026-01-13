import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';



export default function InvestmentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${await getApiUrl()}/wallet/transactions?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar apenas transações de investimento
        const investments = (data.transactions || []).filter(
          t => t.type === 'purchase' && t.relatedCountry
        );
        setTransactions(investments);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-400 text-sm">Carregando histórico...</div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-gray-400 text-sm">Nenhum investimento realizado</div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {transactions.map((transaction, index) => (
        <div
          key={index}
          className="bg-gray-700 rounded p-2 text-sm"
        >
          <div className="flex justify-between items-center">
            <div>
              <div className="text-white font-medium">
                {transaction.description}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(transaction.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>
            <div className="text-red-400 font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'VAL'
              }).format(Math.abs(transaction.amount))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

