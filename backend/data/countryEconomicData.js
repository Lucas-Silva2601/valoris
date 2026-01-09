/**
 * Dados econômicos reais dos países
 * Baseado em PIB, IDH e desenvolvimento econômico real
 * 
 * Multiplicador de custo:
 * - Países desenvolvidos (alto PIB): 2.0x - 5.0x (mais caro)
 * - Países em desenvolvimento: 1.0x - 2.0x (médio)
 * - Países subdesenvolvidos: 0.3x - 1.0x (mais barato)
 */

export const countryEconomicData = {
  // Países desenvolvidos - ALTO CUSTO (2.0x - 5.0x)
  'USA': { name: 'Estados Unidos', gdp: 23315000, hdi: 0.921, multiplier: 5.0, category: 'Desenvolvido' },
  'CHN': { name: 'China', gdp: 17963000, hdi: 0.768, multiplier: 3.5, category: 'Desenvolvido' },
  'JPN': { name: 'Japão', gdp: 4937400, hdi: 0.925, multiplier: 4.5, category: 'Desenvolvido' },
  'DEU': { name: 'Alemanha', gdp: 4072200, hdi: 0.947, multiplier: 4.0, category: 'Desenvolvido' },
  'GBR': { name: 'Reino Unido', gdp: 3070700, hdi: 0.929, multiplier: 4.2, category: 'Desenvolvido' },
  'FRA': { name: 'França', gdp: 2937400, hdi: 0.903, multiplier: 4.0, category: 'Desenvolvido' },
  'IND': { name: 'Índia', gdp: 3385100, hdi: 0.633, multiplier: 1.5, category: 'Em Desenvolvimento' },
  'ITA': { name: 'Itália', gdp: 2107700, hdi: 0.895, multiplier: 3.5, category: 'Desenvolvido' },
  'CAN': { name: 'Canadá', gdp: 1983400, hdi: 0.936, multiplier: 4.0, category: 'Desenvolvido' },
  'KOR': { name: 'Coreia do Sul', gdp: 1803500, hdi: 0.925, multiplier: 3.8, category: 'Desenvolvido' },
  'AUS': { name: 'Austrália', gdp: 1542700, hdi: 0.951, multiplier: 4.2, category: 'Desenvolvido' },
  'ESP': { name: 'Espanha', gdp: 1427200, hdi: 0.904, multiplier: 3.2, category: 'Desenvolvido' },
  'NLD': { name: 'Holanda', gdp: 1008000, hdi: 0.941, multiplier: 3.8, category: 'Desenvolvido' },
  'SAU': { name: 'Arábia Saudita', gdp: 833540, hdi: 0.875, multiplier: 2.5, category: 'Em Desenvolvimento' },
  'CHE': { name: 'Suíça', gdp: 812870, hdi: 0.962, multiplier: 4.8, category: 'Desenvolvido' },
  'TUR': { name: 'Turquia', gdp: 819030, hdi: 0.838, multiplier: 1.8, category: 'Em Desenvolvimento' },
  'POL': { name: 'Polônia', gdp: 679440, hdi: 0.880, multiplier: 2.0, category: 'Em Desenvolvimento' },
  'BEL': { name: 'Bélgica', gdp: 578600, hdi: 0.937, multiplier: 3.8, category: 'Desenvolvido' },
  'SWE': { name: 'Suécia', gdp: 591000, hdi: 0.947, multiplier: 4.0, category: 'Desenvolvido' },
  'NOR': { name: 'Noruega', gdp: 482420, hdi: 0.961, multiplier: 4.5, category: 'Desenvolvido' },
  'DNK': { name: 'Dinamarca', gdp: 398300, hdi: 0.948, multiplier: 4.0, category: 'Desenvolvido' },
  'FIN': { name: 'Finlândia', gdp: 297300, hdi: 0.940, multiplier: 3.8, category: 'Desenvolvido' },
  'ISR': { name: 'Israel', gdp: 481590, hdi: 0.919, multiplier: 3.5, category: 'Desenvolvido' },
  'IRL': { name: 'Irlanda', gdp: 504180, hdi: 0.955, multiplier: 4.0, category: 'Desenvolvido' },
  'SGP': { name: 'Singapura', gdp: 396990, hdi: 0.939, multiplier: 4.2, category: 'Desenvolvido' },
  'NZL': { name: 'Nova Zelândia', gdp: 249850, hdi: 0.937, multiplier: 3.8, category: 'Desenvolvido' },
  'ARE': { name: 'Emirados Árabes', gdp: 421140, hdi: 0.911, multiplier: 3.0, category: 'Desenvolvido' },
  'QAT': { name: 'Catar', gdp: 183470, hdi: 0.855, multiplier: 2.8, category: 'Em Desenvolvimento' },
  'KWT': { name: 'Kuwait', gdp: 183470, hdi: 0.831, multiplier: 2.5, category: 'Em Desenvolvimento' },
  
  // Países em desenvolvimento - CUSTO MÉDIO (1.0x - 2.0x)
  'BRA': { name: 'Brasil', gdp: 1608900, hdi: 0.754, multiplier: 1.5, category: 'Em Desenvolvimento' },
  'MEX': { name: 'México', gdp: 1293200, hdi: 0.758, multiplier: 1.6, category: 'Em Desenvolvimento' },
  'IDN': { name: 'Indonésia', gdp: 1186100, hdi: 0.705, multiplier: 1.2, category: 'Em Desenvolvimento' },
  'RUS': { name: 'Rússia', gdp: 1835000, hdi: 0.822, multiplier: 1.8, category: 'Em Desenvolvimento' },
  'ZAF': { name: 'África do Sul', gdp: 419950, hdi: 0.713, multiplier: 1.3, category: 'Em Desenvolvimento' },
  'ARG': { name: 'Argentina', gdp: 487230, hdi: 0.842, multiplier: 1.5, category: 'Em Desenvolvimento' },
  'THA': { name: 'Tailândia', gdp: 505980, hdi: 0.800, multiplier: 1.4, category: 'Em Desenvolvimento' },
  'EGY': { name: 'Egito', gdp: 469090, hdi: 0.731, multiplier: 1.1, category: 'Em Desenvolvimento' },
  'PAK': { name: 'Paquistão', gdp: 348260, hdi: 0.540, multiplier: 0.8, category: 'Em Desenvolvimento' },
  'BGD': { name: 'Bangladesh', gdp: 416260, hdi: 0.661, multiplier: 0.9, category: 'Em Desenvolvimento' },
  'VNM': { name: 'Vietnã', gdp: 362640, hdi: 0.703, multiplier: 1.1, category: 'Em Desenvolvimento' },
  'PHL': { name: 'Filipinas', gdp: 394090, hdi: 0.699, multiplier: 1.2, category: 'Em Desenvolvimento' },
  'MYS': { name: 'Malásia', gdp: 406310, hdi: 0.803, multiplier: 1.6, category: 'Em Desenvolvimento' },
  'CHL': { name: 'Chile', gdp: 317060, hdi: 0.855, multiplier: 1.8, category: 'Em Desenvolvimento' },
  'COL': { name: 'Colômbia', gdp: 314460, hdi: 0.752, multiplier: 1.3, category: 'Em Desenvolvimento' },
  'PER': { name: 'Peru', gdp: 240990, hdi: 0.762, multiplier: 1.2, category: 'Em Desenvolvimento' },
  'ROU': { name: 'Romênia', gdp: 284090, hdi: 0.821, multiplier: 1.5, category: 'Em Desenvolvimento' },
  'CZE': { name: 'República Tcheca', gdp: 290920, hdi: 0.889, multiplier: 2.0, category: 'Em Desenvolvimento' },
  'HUN': { name: 'Hungria', gdp: 181850, hdi: 0.846, multiplier: 1.8, category: 'Em Desenvolvimento' },
  'GRC': { name: 'Grécia', gdp: 214870, hdi: 0.887, multiplier: 2.0, category: 'Em Desenvolvimento' },
  'PRT': { name: 'Portugal', gdp: 251030, hdi: 0.866, multiplier: 2.0, category: 'Em Desenvolvimento' },
  
  // Países subdesenvolvidos - BAIXO CUSTO (0.3x - 1.0x)
  'NGA': { name: 'Nigéria', gdp: 440830, hdi: 0.535, multiplier: 0.7, category: 'Subdesenvolvido' },
  'ETH': { name: 'Etiópia', gdp: 111270, hdi: 0.498, multiplier: 0.4, category: 'Subdesenvolvido' },
  'KEN': { name: 'Quênia', gdp: 110350, hdi: 0.601, multiplier: 0.6, category: 'Subdesenvolvido' },
  'TZA': { name: 'Tanzânia', gdp: 75230, hdi: 0.549, multiplier: 0.5, category: 'Subdesenvolvido' },
  'UGA': { name: 'Uganda', gdp: 45680, hdi: 0.544, multiplier: 0.4, category: 'Subdesenvolvido' },
  'GHA': { name: 'Gana', gdp: 77350, hdi: 0.632, multiplier: 0.7, category: 'Subdesenvolvido' },
  'MOZ': { name: 'Moçambique', gdp: 15930, hdi: 0.446, multiplier: 0.3, category: 'Subdesenvolvido' },
  'MDG': { name: 'Madagascar', gdp: 14760, hdi: 0.501, multiplier: 0.4, category: 'Subdesenvolvido' },
  'ZWE': { name: 'Zimbábue', gdp: 28370, hdi: 0.593, multiplier: 0.5, category: 'Subdesenvolvido' },
  'MWI': { name: 'Malawi', gdp: 12520, hdi: 0.512, multiplier: 0.4, category: 'Subdesenvolvido' },
  'ZMB': { name: 'Zâmbia', gdp: 29050, hdi: 0.565, multiplier: 0.5, category: 'Subdesenvolvido' },
  'SEN': { name: 'Senegal', gdp: 27380, hdi: 0.512, multiplier: 0.5, category: 'Subdesenvolvido' },
  'MLI': { name: 'Mali', gdp: 19320, hdi: 0.410, multiplier: 0.3, category: 'Subdesenvolvido' },
  'BFA': { name: 'Burkina Faso', gdp: 18980, hdi: 0.449, multiplier: 0.3, category: 'Subdesenvolvido' },
  'NER': { name: 'Níger', gdp: 15030, hdi: 0.400, multiplier: 0.3, category: 'Subdesenvolvido' },
  'TCD': { name: 'Chade', gdp: 11780, hdi: 0.394, multiplier: 0.3, category: 'Subdesenvolvido' },
  'AFG': { name: 'Afeganistão', gdp: 20100, hdi: 0.478, multiplier: 0.4, category: 'Subdesenvolvido' },
  'YEM': { name: 'Iêmen', gdp: 21060, hdi: 0.470, multiplier: 0.4, category: 'Subdesenvolvido' },
  'HTI': { name: 'Haiti', gdp: 20850, hdi: 0.535, multiplier: 0.5, category: 'Subdesenvolvido' },
  'MMR': { name: 'Mianmar', gdp: 76180, hdi: 0.585, multiplier: 0.6, category: 'Subdesenvolvido' },
  'KHM': { name: 'Camboja', gdp: 26950, hdi: 0.593, multiplier: 0.6, category: 'Subdesenvolvido' },
  'LAO': { name: 'Laos', gdp: 18930, hdi: 0.607, multiplier: 0.6, category: 'Subdesenvolvido' },
  'NPL': { name: 'Nepal', gdp: 36330, hdi: 0.602, multiplier: 0.6, category: 'Subdesenvolvido' },
  'LKA': { name: 'Sri Lanka', gdp: 88810, hdi: 0.782, multiplier: 1.0, category: 'Em Desenvolvimento' },
  'BOL': { name: 'Bolívia', gdp: 40410, hdi: 0.692, multiplier: 0.8, category: 'Em Desenvolvimento' },
  'PRY': { name: 'Paraguai', gdp: 41420, hdi: 0.717, multiplier: 0.9, category: 'Em Desenvolvimento' },
  'GTM': { name: 'Guatemala', gdp: 85990, hdi: 0.663, multiplier: 0.9, category: 'Em Desenvolvimento' },
  'HND': { name: 'Honduras', gdp: 31090, hdi: 0.621, multiplier: 0.7, category: 'Subdesenvolvido' },
  'NIC': { name: 'Nicarágua', gdp: 15650, hdi: 0.667, multiplier: 0.7, category: 'Subdesenvolvido' },
  'SLV': { name: 'El Salvador', gdp: 28720, hdi: 0.675, multiplier: 0.8, category: 'Subdesenvolvido' },
  'DOM': { name: 'República Dominicana', gdp: 94240, hdi: 0.767, multiplier: 1.1, category: 'Em Desenvolvimento' },
  'JAM': { name: 'Jamaica', gdp: 15710, hdi: 0.709, multiplier: 0.9, category: 'Em Desenvolvimento' },
  'CUB': { name: 'Cuba', gdp: 107180, hdi: 0.764, multiplier: 1.0, category: 'Em Desenvolvimento' },
};

/**
 * Obter dados econômicos de um país
 * @param {string} countryId - Código ISO_A3 do país
 * @returns {Object} Dados econômicos ou valores padrão
 */
export function getCountryEconomicData(countryId) {
  const data = countryEconomicData[countryId];
  
  if (data) {
    return data;
  }
  
  // Valores padrão para países não listados
  // Baseado na média de países em desenvolvimento
  return {
    name: 'País Desconhecido',
    gdp: 50000,
    hdi: 0.650,
    multiplier: 1.0,
    category: 'Em Desenvolvimento'
  };
}

/**
 * Calcular preço base de investimento baseado na economia
 * @param {string} countryId - Código ISO_A3 do país
 * @param {number} basePrice - Preço base (padrão: 1000)
 * @returns {number} Preço ajustado
 */
export function calculateInvestmentPrice(countryId, basePrice = 1000) {
  const economicData = getCountryEconomicData(countryId);
  return Math.round(basePrice * economicData.multiplier);
}

/**
 * Obter categoria de custo do país
 * @param {string} countryId - Código ISO_A3 do país
 * @returns {string} Categoria de custo
 */
export function getCostCategory(countryId) {
  const data = getCountryEconomicData(countryId);
  const multiplier = data.multiplier;
  
  if (multiplier >= 3.0) return 'Muito Caro';
  if (multiplier >= 2.0) return 'Caro';
  if (multiplier >= 1.5) return 'Moderado';
  if (multiplier >= 1.0) return 'Acessível';
  if (multiplier >= 0.5) return 'Barato';
  return 'Muito Barato';
}

