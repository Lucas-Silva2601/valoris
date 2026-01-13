import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';



export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${await getApiUrl()}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-gray-400 text-sm">Carregando perfil...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Perfil</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-gray-400">Role:</span>
          <span className="text-white ml-2 capitalize">{profile.role}</span>
        </div>
        
        <div className="border-t border-gray-700 pt-2 mt-2">
          <div className="text-xs font-semibold text-gray-400 mb-1">Estatísticas</div>
          <div className="space-y-1">
            <div>
              <span className="text-gray-400">Total Investido:</span>
              <span className="text-white ml-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'VAL'
                }).format(profile.statistics.totalInvested)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Total Ganho:</span>
              <span className="text-white ml-2">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'VAL'
                }).format(profile.statistics.totalEarned)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Países Possuídos:</span>
              <span className="text-white ml-2">{profile.statistics.countriesOwned}</span>
            </div>
            <div>
              <span className="text-gray-400">Unidades Criadas:</span>
              <span className="text-white ml-2">{profile.statistics.unitsCreated}</span>
            </div>
            <div>
              <span className="text-gray-400">Combates Vencidos:</span>
              <span className="text-white ml-2">{profile.statistics.combatsWon}</span>
            </div>
            <div>
              <span className="text-gray-400">Missões Completadas:</span>
              <span className="text-white ml-2">{profile.statistics.missionsCompleted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

