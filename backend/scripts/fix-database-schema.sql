-- ✅ CORREÇÃO URGENTE: Adicionar colunas faltantes no banco de dados
-- Data: 12/01/2026
-- Problema: Colunas city_id e updated_at não existem

-- 🔧 1. Adicionar city_id na tabela buildings (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'buildings' 
        AND column_name = 'city_id'
    ) THEN
        ALTER TABLE buildings ADD COLUMN city_id TEXT;
        RAISE NOTICE '✅ Coluna city_id adicionada à tabela buildings';
    ELSE
        RAISE NOTICE '⚠️  Coluna city_id já existe na tabela buildings';
    END IF;
END $$;

-- 🔧 2. Adicionar city_name na tabela buildings (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'buildings' 
        AND column_name = 'city_name'
    ) THEN
        ALTER TABLE buildings ADD COLUMN city_name TEXT;
        RAISE NOTICE '✅ Coluna city_name adicionada à tabela buildings';
    ELSE
        RAISE NOTICE '⚠️  Coluna city_name já existe na tabela buildings';
    END IF;
END $$;

-- 🔧 3. Adicionar updated_at na tabela shareholders (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'shareholders' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE shareholders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE '✅ Coluna updated_at adicionada à tabela shareholders';
    ELSE
        RAISE NOTICE '⚠️  Coluna updated_at já existe na tabela shareholders';
    END IF;
END $$;

-- 🔧 4. Criar índices para melhor performance (se não existirem)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'buildings' 
        AND indexname = 'idx_buildings_city_id'
    ) THEN
        CREATE INDEX idx_buildings_city_id ON buildings(city_id);
        RAISE NOTICE '✅ Índice idx_buildings_city_id criado';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'shareholders' 
        AND indexname = 'idx_shareholders_updated_at'
    ) THEN
        CREATE INDEX idx_shareholders_updated_at ON shareholders(updated_at);
        RAISE NOTICE '✅ Índice idx_shareholders_updated_at criado';
    END IF;
END $$;

-- ✅ Script concluído
SELECT 'Script de correção executado com sucesso!' AS status;

