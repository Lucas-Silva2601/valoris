# 🔍 Problemas Comuns com o Mapa Leaflet

## Erro: "Map container is already initialized"

### Causa
Este erro acontece quando o Leaflet tenta inicializar o mesmo container do mapa mais de uma vez. Isso pode ocorrer por:

1. **Re-renderizações do React**: O componente `MapContainer` é renderizado novamente com a mesma referência de DOM
2. **Key instável**: Se a `key` do `MapContainer` mudar a cada render, o React destrói e recria o componente
3. **Múltiplas inicializações**: O mapa tenta ser criado antes que o anterior seja destruído

### Solução Aplicada
- ✅ Key estável usando `useMemo` (mas precisa ser corrigido - está gerando nova key)
- ✅ Verificação `mapReady` antes de renderizar marcadores
- ✅ Callback `whenCreated` para garantir inicialização única

## Problema Atual no Código

### Linha 188 do WorldMap.jsx:
```javascript
const mapKey = useMemo(() => `map-${Date.now()}`, []);
```

**PROBLEMA**: `Date.now()` é executado uma vez, mas se o componente for desmontado e remontado, uma nova key será gerada, causando o erro.

### Correção Necessária
Usar uma key verdadeiramente estável ou remover a key completamente.

## Outros Problemas Possíveis

### 1. InvestmentMarkers tentando acessar mapa antes de estar pronto
- ✅ Já corrigido com verificação `mapReady`

### 2. TileLayer removido
- O mapa pode não renderizar corretamente sem um TileLayer
- Solução: Adicionar TileLayer com opacidade baixa ou usar um fundo sólido

### 3. GeoJSON muito grande
- Se o GeoJSON tiver muitos países, pode causar lentidão
- Solução: Usar lazy loading ou simplificar geometrias

## Como Verificar o Erro

1. Abra o Console do Navegador (F12)
2. Procure por erros em vermelho
3. Verifique se há "Map container is already initialized"
4. Verifique se há erros de renderização do React

