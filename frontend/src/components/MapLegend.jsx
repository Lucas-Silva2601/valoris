import { useState } from 'react';

/**
 * ✅ FASE 18.6: Legenda Explicativa do Mapa
 * Mostra informações sobre os diferentes níveis administrativos e elementos visuais
 */
export default function MapLegend({ zoom }) {
  const [expanded, setExpanded] = useState(false);

  if (zoom < 6) {
    return null; // Não mostrar legenda em zoom muito baixo
  }

  return (
    <div className="absolute bottom-4 left-4 bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs shadow-lg z-[1000] max-w-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex justify-between items-center text-white font-semibold mb-2 hover:text-blue-400 transition-colors"
      >
        <span>📋 Legenda do Mapa</span>
        <span>{expanded ? '▼' : '▶'}</span>
      </button>
      
      {expanded && (
        <div className="space-y-3 text-gray-300">
          {/* Níveis Administrativos */}
          <div>
            <div className="font-semibold text-gray-200 mb-2">Níveis Administrativos</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 bg-blue-500 bg-opacity-10"></div>
                <span>País (sempre visível)</span>
              </div>
              {zoom >= 6 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 bg-blue-400 bg-opacity-10" style={{ borderStyle: 'dashed' }}></div>
                  <span>Estado (zoom ≥ 6)</span>
                </div>
              )}
              {zoom >= 10 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-green-500 bg-green-500 bg-opacity-15" style={{ borderStyle: 'dashed' }}></div>
                  <span>Cidade (zoom ≥ 10)</span>
                </div>
              )}
              {zoom >= 12 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Lote Vazio (zoom ≥ 12)</span>
                </div>
              )}
              {zoom >= 12 && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span>Lote Ocupado (zoom ≥ 12)</span>
                </div>
              )}
            </div>
          </div>

          {/* Cores de Cidades */}
          {zoom >= 10 && (
            <div>
              <div className="font-semibold text-gray-200 mb-2">Cores de Cidades</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 bg-opacity-20 border border-green-500"></div>
                  <span>Verde: Cidade Normal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 bg-opacity-20 border border-orange-500"></div>
                  <span>Laranja: População &gt; 1000</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 bg-opacity-25 border border-red-500"></div>
                  <span>Vermelho: Land Value &gt; 5000 VAL</span>
                </div>
              </div>
            </div>
          )}

          {/* NPCs */}
          {zoom >= 10 && (
            <div>
              <div className="font-semibold text-gray-200 mb-2">NPCs</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-2.5 bg-green-500"></div>
                  <span>Verde: Descansando</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-2.5 bg-orange-500"></div>
                  <span>Laranja: Indo para Trabalho</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-2.5 bg-blue-500"></div>
                  <span>Azul: Trabalhando</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-2.5 bg-purple-500"></div>
                  <span>Roxo: Voltando para Casa</span>
                </div>
              </div>
            </div>
          )}

          {/* Zoom Atual */}
          <div className="pt-2 border-t border-gray-700 text-center">
            <span className="text-gray-400">Zoom: {Math.round(zoom)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

