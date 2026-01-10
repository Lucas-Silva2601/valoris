-- ============================================
-- Schema SQL para Supabase (PostgreSQL)
-- Valoris - Simulador Geopolítico
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- PostGIS não está disponível por padrão no Supabase, usando coordenadas DECIMAL

-- ============================================
-- TABELA: wallets (criar PRIMEIRO pois users referencia)
-- ============================================
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) UNIQUE NOT NULL, -- Aceita string para fase de teste
  balance DECIMAL(15, 2) DEFAULT 10000.00 CHECK (balance >= 0),
  total_earned DECIMAL(15, 2) DEFAULT 0.00,
  total_spent DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

-- ============================================
-- TABELA: users (criar DEPOIS de wallets)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'investor' CHECK (role IN ('investor', 'operational', 'admin')),
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_id ON users(wallet_id);

-- ============================================
-- INSERIR USUÁRIO DE TESTE PADRÃO
-- ============================================
-- Criar usuário de teste para fase de desenvolvimento
-- UUID fixo gerado a partir de "test-user-id" (UUID v5)
-- IMPORTANTE: Execute este INSERT manualmente se necessário, ou use o ensureTestUserExists no código
INSERT INTO users (id, username, email, password, role)
VALUES (
  '8c9ed232-914b-5c18-bd94-9af752e48a75', -- UUID v5 fixo para "test-user-id" (gerado deterministicamente)
  'testuser',
  'test@valoris.com',
  '$2b$10$dummyhashedpasswordfortesting', -- Senha dummy para fase de teste
  'investor'
)
ON CONFLICT (id) DO NOTHING; -- Não inserir se já existir

-- ============================================
-- TABELA: buildings (criar ANTES de npcs pois npcs referencia)
-- ============================================
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- ✅ Permitir NULL temporariamente para fase de teste
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('house', 'apartment', 'office', 'skyscraper', 'factory', 'mall')),
  name VARCHAR(255) NOT NULL,
  position_lat DECIMAL(10, 7) NOT NULL CHECK (position_lat >= -90 AND position_lat <= 90),
  position_lng DECIMAL(11, 7) NOT NULL CHECK (position_lng >= -180 AND position_lng <= 180),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  cost DECIMAL(15, 2) NOT NULL CHECK (cost >= 0),
  capacity INTEGER DEFAULT 10 CHECK (capacity >= 0),
  revenue_per_hour DECIMAL(15, 2) DEFAULT 0.00 CHECK (revenue_per_hour >= 0),
  condition INTEGER DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_building_id ON buildings(building_id);
CREATE INDEX IF NOT EXISTS idx_buildings_owner_id ON buildings(owner_id);
CREATE INDEX IF NOT EXISTS idx_buildings_country_id ON buildings(country_id);
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type);
-- Índice composto para queries geográficas (sem PostGIS)
CREATE INDEX IF NOT EXISTS idx_buildings_position ON buildings(position_lat, position_lng);

-- ============================================
-- TABELA: npcs (criar DEPOIS de buildings pois referencia)
-- ============================================
CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  position_lat DECIMAL(10, 7) NOT NULL CHECK (position_lat >= -90 AND position_lat <= 90),
  position_lng DECIMAL(11, 7) NOT NULL CHECK (position_lng >= -180 AND position_lng <= 180),
  target_position_lat DECIMAL(10, 7),
  target_position_lng DECIMAL(11, 7),
  home_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  work_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'walking', 'working', 'resting')),
  skin_color VARCHAR(20),
  current_task VARCHAR(20) DEFAULT 'idle' CHECK (current_task IN ('idle', 'walking', 'working', 'resting')),
  speed DECIMAL(5, 2) DEFAULT 5.00 CHECK (speed >= 0),
  direction DECIMAL(5, 2) DEFAULT 0 CHECK (direction >= 0 AND direction <= 360),
  last_movement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_action_time TIMESTAMP WITH TIME ZONE,
  npc_type VARCHAR(20) DEFAULT 'resident' CHECK (npc_type IN ('resident', 'worker', 'tourist', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_npcs_npc_id ON npcs(npc_id);
CREATE INDEX IF NOT EXISTS idx_npcs_country_id ON npcs(country_id);
CREATE INDEX IF NOT EXISTS idx_npcs_status ON npcs(status);
CREATE INDEX IF NOT EXISTS idx_npcs_home_building ON npcs(home_building_id);
CREATE INDEX IF NOT EXISTS idx_npcs_work_building ON npcs(work_building_id);
-- Índice composto para queries geográficas (sem PostGIS)
CREATE INDEX IF NOT EXISTS idx_npcs_position ON npcs(position_lat, position_lng);

-- ============================================
-- TABELA: country_ownership
-- ============================================
CREATE TABLE IF NOT EXISTS country_ownership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id VARCHAR(10) UNIQUE NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  total_shares INTEGER DEFAULT 100 CHECK (total_shares > 0),
  available_shares INTEGER DEFAULT 100 CHECK (available_shares >= 0),
  current_share_price DECIMAL(15, 2) DEFAULT 100.00 CHECK (current_share_price >= 0),
  total_invested DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_country_ownership_country_id ON country_ownership(country_id);

-- ============================================
-- TABELA: shareholders (relação N:N entre users e country_ownership)
-- ============================================
CREATE TABLE IF NOT EXISTS shareholders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_ownership_id UUID REFERENCES country_ownership(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shares INTEGER NOT NULL CHECK (shares > 0),
  purchase_price DECIMAL(15, 2) NOT NULL CHECK (purchase_price >= 0),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(country_ownership_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shareholders_country ON shareholders(country_ownership_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_user ON shareholders(user_id);

-- ============================================
-- TABELA: military_units
-- ============================================
CREATE TABLE IF NOT EXISTS military_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('soldier', 'tank', 'aircraft', 'ship')),
  position_lat DECIMAL(10, 7) NOT NULL CHECK (position_lat >= -90 AND position_lat <= 90),
  position_lng DECIMAL(11, 7) NOT NULL CHECK (position_lng >= -180 AND position_lng <= 180),
  target_position_lat DECIMAL(10, 7),
  target_position_lng DECIMAL(11, 7),
  health INTEGER DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  max_health INTEGER DEFAULT 100 CHECK (max_health > 0),
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'moving', 'attacking', 'defending', 'destroyed')),
  fuel DECIMAL(10, 2) DEFAULT 100.00 CHECK (fuel >= 0 AND fuel <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_military_units_unit_id ON military_units(unit_id);
CREATE INDEX IF NOT EXISTS idx_military_units_owner_id ON military_units(owner_id);
CREATE INDEX IF NOT EXISTS idx_military_units_country_id ON military_units(country_id);
CREATE INDEX IF NOT EXISTS idx_military_units_status ON military_units(status);
-- Índice composto para queries geográficas (sem PostGIS)
CREATE INDEX IF NOT EXISTS idx_military_units_position ON military_units(position_lat, position_lng);

-- ============================================
-- TABELA: combats
-- ============================================
CREATE TABLE IF NOT EXISTS combats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  combat_id VARCHAR(255) UNIQUE NOT NULL,
  attacker_country VARCHAR(10) NOT NULL,
  defender_country VARCHAR(10) NOT NULL,
  result VARCHAR(20) CHECK (result IN ('attacker_won', 'defender_won', 'draw', 'ongoing')),
  damage_dealt DECIMAL(15, 2) DEFAULT 0.00,
  units_involved JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_combats_combat_id ON combats(combat_id);
CREATE INDEX IF NOT EXISTS idx_combats_attacker ON combats(attacker_country);
CREATE INDEX IF NOT EXISTS idx_combats_defender ON combats(defender_country);

-- ============================================
-- TABELA: transactions
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

-- ============================================
-- TABELA: dividends
-- ============================================
CREATE TABLE IF NOT EXISTS dividends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  shares INTEGER NOT NULL CHECK (shares > 0),
  distributed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dividends_country_id ON dividends(country_id);
CREATE INDEX IF NOT EXISTS idx_dividends_user_id ON dividends(user_id);
CREATE INDEX IF NOT EXISTS idx_dividends_distributed_at ON dividends(distributed_at);

-- ============================================
-- TABELA: treasuries
-- ============================================
CREATE TABLE IF NOT EXISTS treasuries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id VARCHAR(10) UNIQUE NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  total_collected DECIMAL(15, 2) DEFAULT 0.00,
  total_spent DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasuries_country_id ON treasuries(country_id);

-- ============================================
-- TABELA: economic_metrics
-- ============================================
CREATE TABLE IF NOT EXISTS economic_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  health_score DECIMAL(5, 2) DEFAULT 50.00 CHECK (health_score >= 0 AND health_score <= 100),
  investment_level DECIMAL(5, 2) DEFAULT 0.00 CHECK (investment_level >= 0),
  political_stability DECIMAL(5, 2) DEFAULT 50.00 CHECK (political_stability >= 0 AND political_stability <= 100),
  gdp DECIMAL(15, 2) DEFAULT 0.00,
  population BIGINT DEFAULT 0,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_economic_metrics_country_id ON economic_metrics(country_id);
CREATE INDEX IF NOT EXISTS idx_economic_metrics_recorded_at ON economic_metrics(recorded_at);

-- ============================================
-- TABELA: market_orders
-- ============================================
CREATE TABLE IF NOT EXISTS market_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(255) UNIQUE NOT NULL,
  country_id VARCHAR(10) NOT NULL,
  seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('buy', 'sell')),
  shares INTEGER NOT NULL CHECK (shares > 0),
  price_per_share DECIMAL(15, 2) NOT NULL CHECK (price_per_share >= 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_orders_order_id ON market_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_market_orders_country_id ON market_orders(country_id);
CREATE INDEX IF NOT EXISTS idx_market_orders_seller_id ON market_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_market_orders_buyer_id ON market_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status);

-- ============================================
-- TABELA: missions
-- ============================================
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id VARCHAR(255) UNIQUE NOT NULL,
  investor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  operational_id UUID REFERENCES users(id) ON DELETE SET NULL,
  country_id VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  reward DECIMAL(15, 2) DEFAULT 0.00 CHECK (reward >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_missions_mission_id ON missions(mission_id);
CREATE INDEX IF NOT EXISTS idx_missions_investor_id ON missions(investor_id);
CREATE INDEX IF NOT EXISTS idx_missions_operational_id ON missions(operational_id);
CREATE INDEX IF NOT EXISTS idx_missions_country_id ON missions(country_id);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);

-- ============================================
-- TABELA: player_profiles
-- ============================================
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'investor',
  total_invested DECIMAL(15, 2) DEFAULT 0.00,
  total_earned DECIMAL(15, 2) DEFAULT 0.00,
  countries_owned INTEGER DEFAULT 0,
  units_created INTEGER DEFAULT 0,
  combats_won INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{}'::jsonb,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON player_profiles(user_id);

-- ============================================
-- TABELA: game_events
-- ============================================
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  country_id VARCHAR(10),
  event_type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_events_event_id ON game_events(event_id);
CREATE INDEX IF NOT EXISTS idx_game_events_user_id ON game_events(user_id);
CREATE INDEX IF NOT EXISTS idx_game_events_country_id ON game_events(country_id);
CREATE INDEX IF NOT EXISTS idx_game_events_event_type ON game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_created_at ON game_events(created_at);

-- ============================================
-- TABELA: country_defense
-- ============================================
CREATE TABLE IF NOT EXISTS country_defense (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_id VARCHAR(10) UNIQUE NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  defense_level INTEGER DEFAULT 0 CHECK (defense_level >= 0),
  defense_points DECIMAL(15, 2) DEFAULT 0.00,
  units_count INTEGER DEFAULT 0,
  last_attack_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_country_defense_country_id ON country_defense(country_id);

-- ============================================
-- TABELA: analytics_metrics
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  active_players INTEGER DEFAULT 0,
  new_players INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  total_transaction_value DECIMAL(15, 2) DEFAULT 0.00,
  total_combats INTEGER DEFAULT 0,
  total_investments DECIMAL(15, 2) DEFAULT 0.00,
  top_invested_countries JSONB DEFAULT '[]'::jsonb,
  units_created INTEGER DEFAULT 0,
  missions_created INTEGER DEFAULT 0,
  missions_completed INTEGER DEFAULT 0,
  dividends_distributed DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_metrics_date ON analytics_metrics(date);

-- ============================================
-- TRIGGERS para updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_ownership_updated_at BEFORE UPDATE ON country_ownership
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_military_units_updated_at BEFORE UPDATE ON military_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_market_orders_updated_at BEFORE UPDATE ON market_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treasuries_updated_at BEFORE UPDATE ON treasuries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_profiles_updated_at BEFORE UPDATE ON player_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_country_defense_updated_at BEFORE UPDATE ON country_defense
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) - Desabilitado por padrão
-- Descomente se quiser habilitar segurança por linha
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
-- ... (aplicar em todas as tabelas conforme necessário)

