-- ═══════════════════════════════════════════════════════════
-- 🏗️ CRIAR TABELAS DE HIERARQUIA GEOGRÁFICA
-- ═══════════════════════════════════════════════════════════
-- 
-- ⚠️  EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
--
-- Este SQL cria as tabelas necessárias para a hierarquia:
-- 1. states (Estados/Províncias)
-- 2. cities (Cidades/Municípios)
--
-- ═══════════════════════════════════════════════════════════

-- 1️⃣  Criar tabela 'states' (Estados/Províncias)
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10),
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  geometry JSONB,
  treasury_balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (treasury_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_states_state_id ON states(state_id);
CREATE INDEX IF NOT EXISTS idx_states_country_id ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_states_code ON states(code);

-- 2️⃣  Criar tabela 'cities' (Cidades/Municípios)
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  state_id VARCHAR(50) NOT NULL REFERENCES states(state_id) ON DELETE CASCADE,
  state_name VARCHAR(255) NOT NULL,
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  geometry JSONB,
  land_value DECIMAL(15, 2) DEFAULT 1000.00 CHECK (land_value >= 0),
  population INTEGER DEFAULT 0 CHECK (population >= 0),
  treasury_balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (treasury_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cities_city_id ON cities(city_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);

-- 3️⃣  Atualizar referências na tabela 'buildings'
-- (As colunas já foram adicionadas pelo FIX_FINAL_SUPABASE.sql,
--  mas agora vamos adicionar as foreign keys)

-- Adicionar foreign key para state_id (se ainda não existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_buildings_state_id'
  ) THEN
    ALTER TABLE buildings 
    ADD CONSTRAINT fk_buildings_state_id 
    FOREIGN KEY (state_id) REFERENCES states(state_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar foreign key para city_id (se ainda não existe)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_buildings_city_id'
  ) THEN
    ALTER TABLE buildings 
    ADD CONSTRAINT fk_buildings_city_id 
    FOREIGN KEY (city_id) REFERENCES cities(city_id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4️⃣  Verificar se as tabelas foram criadas
SELECT 
  tablename as "Tabela Criada",
  '✅ SUCESSO!' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('states', 'cities')
ORDER BY tablename;

-- ═══════════════════════════════════════════════════════════
-- ✅ RESULTADO ESPERADO:
-- ═══════════════════════════════════════════════════════════
--
-- | Tabela Criada | status       |
-- |---------------|--------------|
-- | cities        | ✅ SUCESSO! |
-- | states        | ✅ SUCESSO! |
--
-- ═══════════════════════════════════════════════════════════
-- 📝 OBSERVAÇÃO IMPORTANTE:
-- ═══════════════════════════════════════════════════════════
--
-- As tabelas foram criadas VAZIAS!
-- 
-- Para o sistema funcionar completamente, você precisará:
-- 1. Popular a tabela 'states' com estados/províncias
-- 2. Popular a tabela 'cities' com cidades
--
-- POR ENQUANTO, o sistema vai funcionar assim:
-- - ✅ Você PODE construir edifícios
-- - ⚠️ Os campos state_id e city_id ficarão NULL
-- - ⚠️ O sistema não vai impedir a construção
--
-- ═══════════════════════════════════════════════════════════

