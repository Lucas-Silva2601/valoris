import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * ✅ FASE 18.6: Componente de Breadcrumbs de Localização
 * Exibe hierarquia: Mundo > País > Estado > Cidade
 */
export default function BreadcrumbNavigation({ 
  countryId, 
  countryName, 
  stateId, 
  stateName, 
  cityId, 
  cityName,
  onNavigate 
}) {
  const [hierarchy, setHierarchy] = useState({
    country: countryName ? { id: countryId, name: countryName } : null,
    state: stateName ? { id: stateId, name: stateName } : null,
    city: cityName ? { id: cityId, name: cityName } : null
  });

  // Carregar hierarquia completa se apenas IDs forem fornecidos
  useEffect(() => {
    const loadHierarchy = async () => {
      const newHierarchy = { ...hierarchy };

      // Carregar estado se tiver stateId mas não stateName
      if (stateId && !stateName) {
        try {
          const response = await fetch(`${API_BASE_URL}/geography/states/${stateId}`);
          if (response.ok) {
            const data = await response.json();
            newHierarchy.state = { id: stateId, name: data.name || stateId };
          }
        } catch (error) {
          console.error('Erro ao carregar estado:', error);
        }
      }

      // Carregar cidade se tiver cityId mas não cityName
      if (cityId && !cityName) {
        try {
          const response = await fetch(`${API_BASE_URL}/geography/cities/${cityId}`);
          if (response.ok) {
            const data = await response.json();
            newHierarchy.city = { id: cityId, name: data.name || cityId };
          }
        } catch (error) {
          console.error('Erro ao carregar cidade:', error);
        }
      }

      setHierarchy(newHierarchy);
    };

    if (stateId || cityId) {
      loadHierarchy();
    }
  }, [stateId, stateName, cityId, cityName]);

  const handleClick = (level, id) => {
    if (onNavigate) {
      onNavigate(level, id);
    }
  };

  const breadcrumbs = [
    { level: 'world', name: 'Mundo', id: null, clickable: false }
  ];

  if (hierarchy.country) {
    breadcrumbs.push({
      level: 'country',
      name: hierarchy.country.name,
      id: hierarchy.country.id,
      clickable: true
    });
  }

  if (hierarchy.state) {
    breadcrumbs.push({
      level: 'state',
      name: hierarchy.state.name,
      id: hierarchy.state.id,
      clickable: true
    });
  }

  if (hierarchy.city) {
    breadcrumbs.push({
      level: 'city',
      name: hierarchy.city.name,
      id: hierarchy.city.id,
      clickable: true
    });
  }

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-4 py-2" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="text-gray-500 mx-2">/</span>
            )}
            {crumb.clickable ? (
              <button
                onClick={() => handleClick(crumb.level, crumb.id)}
                className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                title={`Navegar para ${crumb.name}`}
              >
                {crumb.name}
              </button>
            ) : (
              <span className="text-gray-300">{crumb.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

