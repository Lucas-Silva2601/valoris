import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * PAINEL DE MODO DEUS - PARA TESTES
 * 
 * Este componente permite:
 * - Definir saldo de um usuário
 * - Adicionar saldo a um usuário
 * - Listar usuários e seus saldos
 */
export default function GodModePanel({ userId: currentUserId, onBalanceUpdate }) {
  const [mode, setMode] = useState('set'); // 'set' ou 'add'
  const [targetUserId, setTargetUserId] = useState(currentUserId || 'test-user-id');
  const [amount, setAmount] = useState(100000);
  const [reason, setReason] = useState('Modo Deus - Teste');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [users, setUsers] = useState([]);
  const [showUsersList, setShowUsersList] = useState(false);

  // Carregar lista de usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithTimeout(
        `${API_URL}/admin/users`,
        {
          headers: {
            'Content-Type': 'application/json',
            'user-id': currentUserId || 'test-user-id'
          }
        },
        5000
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  // Definir ou adicionar saldo
  const handleSetBalance = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const endpoint = mode === 'set' 
        ? '/admin/wallet/set-balance'
        : '/admin/wallet/add-balance';

      const body = mode === 'set'
        ? { userId: targetUserId, balance: amount, reason }
        : { userId: targetUserId, amount, reason };

      const response = await fetchWithTimeout(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': currentUserId || 'test-user-id'
          },
          body: JSON.stringify(body)
        },
        5000
      );

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message || 'Saldo atualizado com sucesso!'
        });

        // Atualizar saldo no componente pai
        if (onBalanceUpdate) {
          onBalanceUpdate(targetUserId, data.wallet?.balance);
        }

        // Recarregar lista de usuários
        if (showUsersList) {
          loadUsers();
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Erro ao atualizar saldo'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Erro de conexão: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Valores rápidos
  const quickAmounts = [
    { label: '10K', value: 10000 },
    { label: '50K', value: 50000 },
    { label: '100K', value: 100000 },
    { label: '500K', value: 500000 },
    { label: '1M', value: 1000000 },
    { label: '10M', value: 10000000 }
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-yellow-600 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
          <span>⚡</span>
          Modo Deus - Painel de Testes
        </h3>
        <button
          onClick={() => setShowUsersList(!showUsersList)}
          className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
        >
          {showUsersList ? 'Ocultar' : 'Mostrar'} Usuários
        </button>
      </div>

      {/* Modo: Set ou Add */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('set')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            mode === 'set'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Definir Saldo
        </button>
        <button
          onClick={() => setMode('add')}
          className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
            mode === 'add'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Adicionar Saldo
        </button>
      </div>

      {/* User ID */}
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-1">User ID</label>
        <input
          type="text"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="test-user-id"
        />
      </div>

      {/* Amount */}
      <div className="mb-3">
        <label className="block text-sm text-gray-300 mb-1">
          {mode === 'set' ? 'Novo Saldo' : 'Quantidade'} (VAL)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="100000"
          min="0"
          step="1000"
        />
        
        {/* Botões rápidos */}
        <div className="flex flex-wrap gap-2 mt-2">
          {quickAmounts.map(({ label, value }) => (
            <button
              key={label}
              onClick={() => setAmount(value)}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Motivo (opcional)</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="Modo Deus - Teste"
        />
      </div>

      {/* Botão de ação */}
      <button
        onClick={handleSetBalance}
        disabled={loading || !targetUserId || amount <= 0}
        className="w-full py-2 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded transition-colors mb-3"
      >
        {loading ? 'Processando...' : mode === 'set' ? 'Definir Saldo' : 'Adicionar Saldo'}
      </button>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`p-3 rounded text-sm mb-3 ${
          message.type === 'success'
            ? 'bg-green-900 text-green-200 border border-green-700'
            : 'bg-red-900 text-red-200 border border-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Lista de usuários */}
      {showUsersList && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-300">Usuários</h4>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Atualizar
            </button>
          </div>
          
          {users.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">Nenhum usuário encontrado</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {users.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs hover:bg-gray-600 cursor-pointer transition-colors"
                  onClick={() => {
                    setTargetUserId(user.userId);
                    setShowUsersList(false);
                  }}
                >
                  <div className="flex-1 truncate mr-2">
                    <div className="text-white font-medium truncate">{user.userId}</div>
                    <div className="text-gray-400 text-xs">
                      Ganho: {user.totalEarned?.toLocaleString('pt-BR') || 0} | 
                      Gasto: {user.totalSpent?.toLocaleString('pt-BR') || 0}
                    </div>
                  </div>
                  <div className="text-yellow-400 font-bold text-sm whitespace-nowrap">
                    {user.balance?.toLocaleString('pt-BR') || 0} VAL
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

