-- ============================================
-- Script de Migração: Adicionar colunas faltantes na tabela npcs
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Adicionar coluna virtual_hour se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'virtual_hour'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN virtual_hour INTEGER DEFAULT 8 CHECK (virtual_hour >= 0 AND virtual_hour <= 23);
        COMMENT ON COLUMN npcs.virtual_hour IS 'Hora virtual (0-23)';
        RAISE NOTICE 'Coluna virtual_hour adicionada';
    ELSE
        RAISE NOTICE 'Coluna virtual_hour já existe';
    END IF;
END $$;

-- Adicionar coluna state_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'state_id'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN state_id VARCHAR(50) REFERENCES states(state_id) ON DELETE SET NULL;
        COMMENT ON COLUMN npcs.state_id IS 'ID do estado';
        RAISE NOTICE 'Coluna state_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna state_id já existe';
    END IF;
END $$;

-- Adicionar coluna state_name se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'state_name'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN state_name VARCHAR(255);
        COMMENT ON COLUMN npcs.state_name IS 'Nome do estado';
        RAISE NOTICE 'Coluna state_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna state_name já existe';
    END IF;
END $$;

-- Adicionar coluna city_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'city_id'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN city_id VARCHAR(50) REFERENCES cities(city_id) ON DELETE SET NULL;
        COMMENT ON COLUMN npcs.city_id IS 'ID da cidade';
        RAISE NOTICE 'Coluna city_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna city_id já existe';
    END IF;
END $$;

-- Adicionar coluna city_name se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'city_name'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN city_name VARCHAR(255);
        COMMENT ON COLUMN npcs.city_name IS 'Nome da cidade';
        RAISE NOTICE 'Coluna city_name adicionada';
    ELSE
        RAISE NOTICE 'Coluna city_name já existe';
    END IF;
END $$;

-- Adicionar coluna home_building_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'home_building_id'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN home_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL;
        COMMENT ON COLUMN npcs.home_building_id IS 'ID do edifício onde o NPC mora';
        RAISE NOTICE 'Coluna home_building_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna home_building_id já existe';
    END IF;
END $$;

-- Adicionar coluna work_building_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'work_building_id'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN work_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL;
        COMMENT ON COLUMN npcs.work_building_id IS 'ID do edifício onde o NPC trabalha';
        RAISE NOTICE 'Coluna work_building_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna work_building_id já existe';
    END IF;
END $$;

-- Adicionar coluna routine_state se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'routine_state'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN routine_state VARCHAR(30) DEFAULT 'resting' 
        CHECK (routine_state IN ('resting', 'going_to_work', 'working', 'going_home'));
        COMMENT ON COLUMN npcs.routine_state IS 'Estado da rotina do NPC';
        RAISE NOTICE 'Coluna routine_state adicionada';
    ELSE
        RAISE NOTICE 'Coluna routine_state já existe';
    END IF;
END $$;

-- Adicionar coluna current_route se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'current_route'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN current_route JSONB DEFAULT '[]'::jsonb;
        COMMENT ON COLUMN npcs.current_route IS 'Rota urbana otimizada (array de pontos)';
        RAISE NOTICE 'Coluna current_route adicionada';
    ELSE
        RAISE NOTICE 'Coluna current_route já existe';
    END IF;
END $$;

-- Adicionar coluna route_index se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'npcs' AND column_name = 'route_index'
    ) THEN
        ALTER TABLE npcs 
        ADD COLUMN route_index INTEGER DEFAULT 0;
        COMMENT ON COLUMN npcs.route_index IS 'Índice atual na rota';
        RAISE NOTICE 'Coluna route_index adicionada';
    ELSE
        RAISE NOTICE 'Coluna route_index já existe';
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_npcs_state_id ON npcs(state_id);
CREATE INDEX IF NOT EXISTS idx_npcs_city_id ON npcs(city_id);
CREATE INDEX IF NOT EXISTS idx_npcs_home_building_id ON npcs(home_building_id);
CREATE INDEX IF NOT EXISTS idx_npcs_work_building_id ON npcs(work_building_id);
CREATE INDEX IF NOT EXISTS idx_npcs_routine_state ON npcs(routine_state);
CREATE INDEX IF NOT EXISTS idx_npcs_virtual_hour ON npcs(virtual_hour);

-- Mensagem final
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migração da tabela npcs concluída!';
END $$;

