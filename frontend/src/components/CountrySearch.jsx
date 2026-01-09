import { useState, useEffect } from 'react';

export default function CountrySearch({ countriesData, onCountrySelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!countriesData || !countriesData.features || searchTerm.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = countriesData.features
      .filter(feature => {
        const name = feature.properties.NAME || 
                    feature.properties.NAME_EN || 
                    feature.properties.ADMIN || 
                    '';
        return name.toLowerCase().includes(searchLower);
      })
      .slice(0, 10); // Limitar a 10 resultados

    setResults(filtered);
    setShowResults(filtered.length > 0);
  }, [searchTerm, countriesData]);

  const handleSelect = (feature) => {
    const countryId = feature.properties.ISO_A3 || feature.properties.ADM0_A3;
    setSearchTerm('');
    setShowResults(false);
    if (onCountrySelect) {
      onCountrySelect(feature, countryId);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          placeholder="Buscar país..."
          className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((feature, index) => {
            const countryName = feature.properties.NAME || 
                               feature.properties.NAME_EN || 
                               feature.properties.ADMIN || 
                               'País Desconhecido';
            const countryId = feature.properties.ISO_A3 || feature.properties.ADM0_A3;

            return (
              <button
                key={index}
                onClick={() => handleSelect(feature)}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
              >
                <div className="text-white font-medium">{countryName}</div>
                {countryId && (
                  <div className="text-xs text-gray-400">{countryId}</div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

