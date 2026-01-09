/**
 * Textos de ajuda contextual para tooltips
 */

export const helpTexts = {
  // Carteira
  walletBalance: 'Seu saldo atual em VAL (moeda virtual do jogo). Use para investir em países ou criar unidades militares.',
  walletTransactions: 'Histórico de todas as suas transações, incluindo investimentos, dividendos e compras.',
  
  // Investimentos
  sharePrice: 'Preço atual de uma ação deste país. O preço varia com a demanda e escassez de ações.',
  availableShares: 'Quantidade de ações ainda disponíveis para compra neste país.',
  totalShares: 'Total de ações do país (sempre 100).',
  currentOwnership: 'Sua participação atual nas ações deste país.',
  dividendInfo: 'Dividendos são calculados diariamente às 00:00 e distribuídos proporcionalmente às suas ações.',
  
  // Saúde Econômica
  healthScore: 'Indicador da saúde econômica do país (0-100). Valores mais altos indicam melhor economia e maiores dividendos.',
  politicalStability: 'Nível de estabilidade política (0-100). Países instáveis podem ter eventos negativos.',
  infrastructure: 'Nível e condição da infraestrutura. Infraestrutura danificada reduz a capacidade de gerar recursos.',
  resources: 'Recursos virtuais disponíveis. Mais recursos = maiores dividendos potenciais.',
  
  // Unidades Militares
  unitType: 'Tipo de unidade: Tanque (terrestre), Navio (marítimo) ou Avião (aéreo).',
  unitHealth: 'Saúde atual da unidade. Quando chega a 0, a unidade é destruída.',
  unitAttack: 'Poder de ataque da unidade. Quanto maior, mais dano causa em combate.',
  unitDefense: 'Poder de defesa da unidade. Reduz o dano recebido em combate.',
  unitSpeed: 'Velocidade de movimento da unidade no mapa.',
  unitCost: 'Custo em VAL para criar esta unidade.',
  
  // Combate
  defenseLevel: 'Nível de defesa do país (1-10). Países com defesa alta são mais difíceis de conquistar.',
  defensePower: 'Poder total de defesa, incluindo unidades defensivas e sistema de defesa.',
  combatResult: 'Resultado do combate. Vitória do atacante ou defensor.',
  
  // Tesouro
  treasuryBalance: 'Saldo do tesouro nacional. Usado para melhorar defesas e infraestrutura.',
  treasuryReserve: 'Porcentagem dos dividendos que vai para o tesouro nacional (5%).',
  
  // Missões
  missionType: 'Tipo de missão: Ataque, Defesa ou Exploração.',
  missionReward: 'Recompensa em VAL oferecida pelo investidor para completar a missão.',
  missionStatus: 'Status da missão: Disponível, Em Progresso ou Concluída.',
  
  // Geral
  countrySelection: 'Clique em um país no mapa para ver informações detalhadas e interagir.',
  realTimeUpdates: 'Atualizações em tempo real via WebSocket. Você verá mudanças instantaneamente.',
  playerRole: 'Seu papel no jogo: Investidor (foca em economia) ou Operacional (foca em combate).'
};

/**
 * Obter texto de ajuda por chave
 */
export const getHelpText = (key) => {
  return helpTexts[key] || 'Informação não disponível.';
};

