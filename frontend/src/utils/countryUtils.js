/**
 * Utilitários para manipulação de países e identificação
 */

/**
 * Gera um ID único para um país baseado nas propriedades disponíveis
 * Tenta usar código ISO primeiro, depois gera um hash do nome
 */
export function getCountryId(feature) {
  if (!feature || !feature.properties) {
    return null;
  }

  const props = feature.properties;

  // Tentar códigos ISO primeiro (prioridade)
  if (props.ISO_A3 && typeof props.ISO_A3 === 'string' && props.ISO_A3.trim().length === 3) {
    return props.ISO_A3.trim().toUpperCase();
  }
  
  if (props.ADM0_A3 && typeof props.ADM0_A3 === 'string' && props.ADM0_A3.trim().length === 3) {
    return props.ADM0_A3.trim().toUpperCase();
  }
  
  if (props.ISO3 && typeof props.ISO3 === 'string' && props.ISO3.trim().length === 3) {
    return props.ISO3.trim().toUpperCase();
  }

  // Tentar código ISO de 2 letras e expandir para 3
  if (props.ISO_A2 && typeof props.ISO_A2 === 'string' && props.ISO_A2.trim().length === 2) {
    return (props.ISO_A2.trim() + 'X').toUpperCase();
  }

  // Se não houver código ISO, gerar ID baseado no nome (sempre retornar algo válido)
  // Tentar várias propriedades de nome possíveis
  const countryName = props.name || props.Name || props.NAME || props.NAME_EN || props.NAME_LONG || props.NAME_ALT || props.ADMIN || null;
  
  if (countryName && typeof countryName === 'string' && countryName.trim().length > 0) {
    const id = generateShortId(countryName.trim());
    // Se gerou um ID válido (não é 'XXX'), retornar
    if (id && id !== 'XXX' && id.length === 3) {
      return id;
    }
  }

  // Fallback: usar uma propriedade única do feature como ID (hash simples)
  // Usar índice do feature se disponível, ou hash das coordenadas
  if (feature.geometry && feature.geometry.coordinates) {
    const coordsStr = JSON.stringify(feature.geometry.coordinates).substring(0, 50);
    let hash = 0;
    for (let i = 0; i < coordsStr.length; i++) {
      hash = ((hash << 5) - hash) + coordsStr.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const shortHash = Math.abs(hash).toString(36).substring(0, 3).toUpperCase().padEnd(3, 'X');
    return shortHash;
  }

  // Último fallback: retornar 'UNK' mas isso não deveria acontecer
  console.warn('⚠️ Não foi possível gerar ID para país:', props);
  return 'UNK';
}

/**
 * Gera um ID curto (3 caracteres) baseado em uma string
 */
function generateShortId(str) {
  if (!str || typeof str !== 'string') {
    return 'XXX';
  }

  // Normalizar string (remover acentos, converter para maiúsculas)
  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  // Se a string normalizada tiver 3 ou mais caracteres, usar os primeiros 3
  if (normalized.length >= 3) {
    return normalized.substring(0, 3);
  }

  // Se tiver menos de 3, preencher com X
  return (normalized + 'XXX').substring(0, 3);
}

/**
 * Obtém o nome do país de um feature
 * Verifica múltiplas propriedades possíveis do GeoJSON
 */
export function getCountryName(feature) {
  if (!feature || !feature.properties) {
    return 'País Desconhecido';
  }

  const props = feature.properties;
  
  // Tentar várias propriedades possíveis (em ordem de prioridade)
  // IMPORTANTE: O GeoJSON atual usa "name" (minúscula), então verificamos primeiro
  const possibleNames = [
    props.name,           // minúscula (COMUM NO GEOJSON ATUAL) - PRIMEIRO!
    props.Name,           // primeira letra maiúscula
    props.NAME,           // Nome padrão (Natural Earth)
    props.NAME_EN,        // Nome em inglês
    props.NAME_LONG,      // Nome longo
    props.NAME_ALT,       // Nome alternativo
    props.NAME_SORT,      // Nome para ordenação
    props.NAME_LOCAL,     // Nome local
    props.NAME_CIAWF,     // Nome CIA World Factbook
    props.FORMAL_EN,      // Nome formal em inglês
    props.FORMAL_FR,      // Nome formal em francês
    props.ADMIN,          // Nome administrativo
    props.ADMIN_0,        // Nome administrativo nível 0
    props.SOVEREIGNT,     // Soberania
    props.COUNTRY,        // País (comum em alguns GeoJSONs)
    props.country,        // minúscula
    props.COUNTRY_NAME,   // Nome do país
    props.COUNTRYNAME,    // Nome do país sem underscore
    props.NAME_AR,        // Nome em árabe
    props.NAME_ES,        // Nome em espanhol
    props.NAME_FR,        // Nome em francês
    props.NAME_PT,        // Nome em português
    props.NAME_DE,        // Nome em alemão
    props.NAME_RU,        // Nome em russo
    props.NAME_ZH,        // Nome em chinês
    props.label,          // Label comum
    props.Label,          // Label com primeira maiúscula
    props.LABEL,          // Label maiúsculo
  ];

  // Encontrar o primeiro nome válido (não vazio, não nulo, não undefined)
  for (const name of possibleNames) {
    if (name && typeof name === 'string' && name.trim().length > 0) {
      // Se o nome for muito curto (menos de 2 caracteres), pular
      if (name.trim().length >= 2) {
        return name.trim();
      }
    }
  }

  // Se não encontrou nenhum nome válido, logar TODAS as propriedades para debug
  // Filtrar apenas propriedades que podem ser nomes (strings não muito longas)
  const allStringProperties = Object.entries(props)
    .filter(([key, value]) => {
      return typeof value === 'string' && 
             value.length >= 2 && 
             value.length < 200 &&
             value.trim().length > 0 &&
             !key.match(/^(ISO|ADM|GU|GEO|SCALE|LABEL|POP|GDP|GINI|WB|NAME)_/i) || // Excluir códigos técnicos
             key.match(/^(NAME|name|Name|COUNTRY|country|Country|ADMIN|SOVEREIGNT)/i); // Mas incluir nomes
    })
    .slice(0, 30); // Limitar a 30 propriedades

  // Logar apenas uma vez por tipo de propriedade (evitar spam)
  const uniqueLogKey = Object.keys(props).sort().join(',');
  if (!window._countryNameLogs) {
    window._countryNameLogs = new Set();
  }
  
  if (!window._countryNameLogs.has(uniqueLogKey)) {
    window._countryNameLogs.add(uniqueLogKey);
    
    if (allStringProperties.length > 0) {
      console.warn('⚠️ País sem nome identificado. Propriedades de string disponíveis:', 
        Object.fromEntries(allStringProperties)
      );
      console.log('💡 Todas as chaves de propriedades:', Object.keys(props).slice(0, 50));
    } else {
      console.error('❌ País sem propriedades de string válidas! Todas as propriedades:', props);
    }
  }

  return 'País Desconhecido';
}

/**
 * Valida se um countryId é válido (aceita qualquer string não vazia)
 */
export function isValidCountryId(countryId) {
  return countryId && typeof countryId === 'string' && countryId.length > 0;
}

