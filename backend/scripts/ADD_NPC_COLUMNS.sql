-- ═══════════════════════════════════════════════════════════
-- 🔧 ADICIONAR COLUNAS DE HIERARQUIA GEOGRÁFICA NOS NPCs
-- ═══════════════════════════════════════════════════════════

-- Adicionar city_id
ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS city_id VARCHAR(50);

-- Adicionar city_name
ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

-- Adicionar state_id
ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS state_id VARCHAR(50);

-- Adicionar state_name
ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS state_name VARCHAR(255);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_npcs_city_id ON npcs(city_id);
CREATE INDEX IF NOT EXISTS idx_npcs_state_id ON npcs(state_id);

-- Verificar (deve retornar 4 linhas)
SELECT 
  column_name, 
  data_type,
  '✅ COLUNA CRIADA COM SUCESSO!' as status
FROM information_schema.columns 
WHERE table_name = 'npcs' 
  AND column_name IN ('city_id', 'city_name', 'state_id', 'state_name')
ORDER BY column_name;

