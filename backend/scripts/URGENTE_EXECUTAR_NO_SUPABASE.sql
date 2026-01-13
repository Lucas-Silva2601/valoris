-- ═══════════════════════════════════════════════════════════
-- 🚨 URGENTE: EXECUTAR NO SUPABASE SQL EDITOR
-- ═══════════════════════════════════════════════════════════
-- 
-- ⚠️  SEM EXECUTAR ESTE SQL, O SISTEMA NÃO VAI FUNCIONAR!
--
-- INSTRUÇÕES:
-- 1. Abra https://supabase.com/dashboard
-- 2. Selecione o projeto VALORIS
-- 3. Menu lateral → SQL Editor
-- 4. Cole TODO este arquivo
-- 5. Clique em RUN ou Ctrl+Enter
-- 6. Confirme que retornou 2 linhas (city_id, city_name)
-- 7. Recarregue o navegador (Ctrl+Shift+R)
--
-- ═══════════════════════════════════════════════════════════

-- 1️⃣  Adicionar colunas na tabela 'buildings'
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS city_id VARCHAR(50);

ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

-- 2️⃣  Adicionar coluna na tabela 'shareholders'
ALTER TABLE shareholders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3️⃣  Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_buildings_city_id ON buildings(city_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_updated_at ON shareholders(updated_at);

-- 4️⃣  Verificar se funcionou (DEVE RETORNAR 2 LINHAS)
SELECT 
  column_name, 
  data_type,
  is_nullable,
  '✅ COLUNA CRIADA COM SUCESSO!' as status
FROM information_schema.columns 
WHERE table_name = 'buildings' 
  AND column_name IN ('city_id', 'city_name')
ORDER BY column_name;

-- ═══════════════════════════════════════════════════════════
-- ✅ RESULTADO ESPERADO:
-- ═══════════════════════════════════════════════════════════
--
-- | column_name | data_type          | is_nullable | status                      |
-- |-------------|--------------------|-------------|----------------------------|
-- | city_id     | character varying  | YES         | ✅ COLUNA CRIADA COM SUCESSO! |
-- | city_name   | character varying  | YES         | ✅ COLUNA CRIADA COM SUCESSO! |
--
-- ═══════════════════════════════════════════════════════════
-- 🎯 DEPOIS DE EXECUTAR:
-- ═══════════════════════════════════════════════════════════
--
-- 1. Recarregue o navegador (Ctrl+Shift+R)
-- 2. Tente construir um prédio novamente
-- 3. Deve funcionar sem erro! 🚀
--
-- ═══════════════════════════════════════════════════════════

