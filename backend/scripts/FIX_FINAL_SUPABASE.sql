-- ═══════════════════════════════════════════════════════════
-- 🚨 FIX FINAL - ADICIONAR TODAS AS COLUNAS FALTANTES
-- ═══════════════════════════════════════════════════════════
-- 
-- ⚠️  EXECUTE ESTE SQL NO SUPABASE SQL EDITOR AGORA!
--
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo (Ctrl+A → Ctrl+C)
-- 2. Abra https://supabase.com/dashboard
-- 3. Selecione o projeto VALORIS
-- 4. Menu lateral → SQL Editor
-- 5. Cole TODO o conteúdo
-- 6. Clique em RUN ou Ctrl+Enter
-- 7. Confirme que retornou 4 linhas (state_id, state_name, city_id, city_name)
-- 8. Recarregue o navegador (Ctrl+Shift+R)
--
-- ═══════════════════════════════════════════════════════════

-- 1️⃣  Adicionar TODAS as colunas de hierarquia geográfica na tabela 'buildings'
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS state_id VARCHAR(50);

ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS state_name VARCHAR(255);

ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS city_id VARCHAR(50);

ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

-- 2️⃣  Adicionar coluna na tabela 'shareholders'
ALTER TABLE shareholders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3️⃣  Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_buildings_state_id ON buildings(state_id);
CREATE INDEX IF NOT EXISTS idx_buildings_city_id ON buildings(city_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_updated_at ON shareholders(updated_at);

-- 4️⃣  Verificar se funcionou (DEVE RETORNAR 4 LINHAS)
SELECT 
  column_name, 
  data_type,
  is_nullable,
  '✅ COLUNA CRIADA COM SUCESSO!' as status
FROM information_schema.columns 
WHERE table_name = 'buildings' 
  AND column_name IN ('state_id', 'state_name', 'city_id', 'city_name')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════
-- ✅ RESULTADO ESPERADO:
-- ═══════════════════════════════════════════════════════════
--
-- | column_name | data_type          | is_nullable | status                      |
-- |-------------|--------------------|-------------|----------------------------|
-- | city_id     | character varying  | YES         | ✅ COLUNA CRIADA COM SUCESSO! |
-- | city_name   | character varying  | YES         | ✅ COLUNA CRIADA COM SUCESSO! |
-- | state_id    | character varying  | YES         | ✅ COLUNA CRIADA COM SUCESSO! |
-- | state_name  | character varying  | YES         | ✅ COLUNA CRIADA COM SUCESSO! |
--
-- ═══════════════════════════════════════════════════════════
-- 🎯 DEPOIS DE EXECUTAR:
-- ═══════════════════════════════════════════════════════════
--
-- 1. Recarregue o navegador (Ctrl+Shift+R)
-- 2. Tente construir um prédio novamente
-- 3. DEVE FUNCIONAR SEM ERRO! 🚀
--
-- ═══════════════════════════════════════════════════════════

