-- ============================================
-- Script SQL para Resetar Banco de Dados
-- Valoris - Simulador Geopolítico
-- ============================================
-- Este script deleta TODOS os dados das tabelas
-- Execute no SQL Editor do Supabase
-- ============================================

-- ⚠️ AVISO: Este script vai deletar TODOS os dados!
-- Faça backup antes de executar se necessário

BEGIN;

-- Deletar dados respeitando ordem de dependências (foreign keys)

-- 1. Deletar registros que dependem de outras tabelas
DELETE FROM npcs;
DELETE FROM buildings;
DELETE FROM transactions;
DELETE FROM dividends;
DELETE FROM shareholders;
DELETE FROM military_units;
DELETE FROM combats;
DELETE FROM market_orders;
DELETE FROM missions;
DELETE FROM player_profiles;
DELETE FROM game_events;
DELETE FROM analytics_metrics;

-- 2. Deletar tabelas intermediárias
DELETE FROM country_ownership;
DELETE FROM country_defense;
DELETE FROM economic_metrics;
DELETE FROM treasuries;

-- 3. Deletar usuários e carteiras (se quiser resetar tudo)
DELETE FROM users WHERE id != '8c9ed232-914b-5c18-bd94-9af752e48a75'; -- Mantém usuário de teste
DELETE FROM wallets WHERE user_id != 'test-user-id'; -- Mantém carteira de teste

-- Alternativa: Se quiser deletar TUDO, inclusive usuário de teste:
-- DELETE FROM users;
-- DELETE FROM wallets;

COMMIT;

-- ============================================
-- Para recriar o schema completo, execute:
-- backend/config/schema.sql
-- ============================================

-- Verificar que está tudo limpo
SELECT 
  'users' as tabela, COUNT(*) as registros FROM users
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'npcs', COUNT(*) FROM npcs
UNION ALL
SELECT 'buildings', COUNT(*) FROM buildings
UNION ALL
SELECT 'country_ownership', COUNT(*) FROM country_ownership
ORDER BY tabela;

