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
-- TABELA: states (criar ANTES de cities e buildings)
-- ============================================
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10),
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  geometry JSONB, -- GeoJSON do polígono do estado
  treasury_balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (treasury_balance >= 0), -- ✅ FASE 18.5: Saldo do tesouro estadual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_states_state_id ON states(state_id);
CREATE INDEX IF NOT EXISTS idx_states_country_id ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_states_code ON states(code);

-- ============================================
-- TABELA: cities (criar ANTES de buildings)
-- ============================================
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  state_id VARCHAR(50) NOT NULL REFERENCES states(state_id) ON DELETE CASCADE,
  state_name VARCHAR(255) NOT NULL,
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  geometry JSONB, -- GeoJSON do polígono da cidade
  land_value DECIMAL(15, 2) DEFAULT 1000.00 CHECK (land_value >= 0), -- Preço base da terra em Valions
  population INTEGER DEFAULT 0 CHECK (population >= 0),
  treasury_balance DECIMAL(15, 2) DEFAULT 0.00 CHECK (treasury_balance >= 0), -- ✅ FASE 18.5: Saldo do tesouro municipal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_city_id ON cities(city_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_cities_country_id ON cities(country_id);

-- ============================================
-- TABELA: lots (lotes dentro de cidades)
-- ============================================
CREATE TABLE IF NOT EXISTS lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lot_id VARCHAR(255) UNIQUE NOT NULL,
  city_id VARCHAR(50) NOT NULL REFERENCES cities(city_id) ON DELETE CASCADE,
  position_lat DECIMAL(10, 7) NOT NULL CHECK (position_lat >= -90 AND position_lat <= 90),
  position_lng DECIMAL(11, 7) NOT NULL CHECK (position_lng >= -180 AND position_lng <= 180),
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  is_occupied BOOLEAN DEFAULT FALSE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city_id, grid_x, grid_y) -- Um lote por posição na grade da cidade
);

CREATE INDEX IF NOT EXISTS idx_lots_lot_id ON lots(lot_id);
CREATE INDEX IF NOT EXISTS idx_lots_city_id ON lots(city_id);
CREATE INDEX IF NOT EXISTS idx_lots_building_id ON lots(building_id);
CREATE INDEX IF NOT EXISTS idx_lots_occupied ON lots(is_occupied);
CREATE INDEX IF NOT EXISTS idx_lots_grid ON lots(city_id, grid_x, grid_y);

-- ============================================
-- TABELA: buildings (criar DEPOIS de cities e states)
-- ============================================
CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL, -- ✅ Permitir NULL temporariamente para fase de teste
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  state_id VARCHAR(50) REFERENCES states(state_id) ON DELETE SET NULL, -- ✅ Novo campo FASE 18
  state_name VARCHAR(255), -- ✅ Novo campo FASE 18
  city_id VARCHAR(50) REFERENCES cities(city_id) ON DELETE SET NULL, -- ✅ Novo campo FASE 18
  city_name VARCHAR(255), -- ✅ Novo campo FASE 18
  lot_id UUID REFERENCES lots(id) ON DELETE SET NULL, -- ✅ Novo campo FASE 18
  type VARCHAR(20) NOT NULL CHECK (type IN ('house', 'apartment', 'office', 'skyscraper', 'factory', 'mall')),
  name VARCHAR(255) NOT NULL,
  position_lat DECIMAL(10, 7) NOT NULL CHECK (position_lat >= -90 AND position_lat <= 90),
  position_lng DECIMAL(11, 7) NOT NULL CHECK (position_lng >= -180 AND position_lng <= 180),
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  cost DECIMAL(15, 2) NOT NULL CHECK (cost >= 0),
  capacity INTEGER DEFAULT 10 CHECK (capacity >= 0),
  revenue_per_hour DECIMAL(15, 2) DEFAULT 0.00 CHECK (revenue_per_hour >= 0),
  yield_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (yield_rate >= 0), -- ✅ Taxa de retorno (FASE 18)
  condition INTEGER DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_building_id ON buildings(building_id);
CREATE INDEX IF NOT EXISTS idx_buildings_owner_id ON buildings(owner_id);
CREATE INDEX IF NOT EXISTS idx_buildings_country_id ON buildings(country_id);
CREATE INDEX IF NOT EXISTS idx_buildings_state_id ON buildings(state_id); -- ✅ Novo índice FASE 18
CREATE INDEX IF NOT EXISTS idx_buildings_city_id ON buildings(city_id); -- ✅ Novo índice FASE 18
CREATE INDEX IF NOT EXISTS idx_buildings_lot_id ON buildings(lot_id); -- ✅ Novo índice FASE 18
CREATE INDEX IF NOT EXISTS idx_buildings_type ON buildings(type);
-- Índice composto para queries geográficas (sem PostGIS)
CREATE INDEX IF NOT EXISTS idx_buildings_position ON buildings(position_lat, position_lng);

-- ============================================
-- TABELA: npcs (criar DEPOIS de buildings e cities pois referencia)
-- ✅ FASE 18.5: NPCs com hierarquia urbana e rotinas
-- ============================================
CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  country_id VARCHAR(10) NOT NULL,
  country_name VARCHAR(255) NOT NULL,
  state_id VARCHAR(50) REFERENCES states(state_id) ON DELETE SET NULL, -- ✅ FASE 18.5
  state_name VARCHAR(255), -- ✅ FASE 18.5
  city_id VARCHAR(50) REFERENCES cities(city_id) ON DELETE SET NULL, -- ✅ FASE 18.5: Cidade onde o NPC vive
  city_name VARCHAR(255), -- ✅ FASE 18.5
  position_lat DECIMAL(10, 7) NOT NULL CHECK (position_lat >= -90 AND position_lat <= 90),
  position_lng DECIMAL(11, 7) NOT NULL CHECK (position_lng >= -180 AND position_lng <= 180),
  target_position_lat DECIMAL(10, 7),
  target_position_lng DECIMAL(11, 7),
  home_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL, -- ✅ FASE 18.5: Casa do NPC
  work_building_id UUID REFERENCES buildings(id) ON DELETE SET NULL, -- ✅ FASE 18.5: Trabalho do NPC
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'walking', 'working', 'resting')),
  routine_state VARCHAR(30) DEFAULT 'resting' CHECK (routine_state IN ('resting', 'going_to_work', 'working', 'going_home')), -- ✅ FASE 18.5: Estado da rotina
  virtual_hour INTEGER DEFAULT 8 CHECK (virtual_hour >= 0 AND virtual_hour <= 23), -- ✅ FASE 18.5: Hora virtual (0-23)
  skin_color VARCHAR(20),
  current_task VARCHAR(20) DEFAULT 'idle' CHECK (current_task IN ('idle', 'walking', 'working', 'resting')),
  speed DECIMAL(5, 2) DEFAULT 5.00 CHECK (speed >= 0),
  direction DECIMAL(5, 2) DEFAULT 0 CHECK (direction >= 0 AND direction <= 360),
  current_route JSONB DEFAULT '[]'::jsonb, -- ✅ FASE 18.5: Rota urbana otimizada (array de pontos)
  route_index INTEGER DEFAULT 0, -- ✅ FASE 18.5: Índice atual na rota
  last_movement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  next_action_time TIMESTAMP WITH TIME ZONE,
  npc_type VARCHAR(20) DEFAULT 'resident' CHECK (npc_type IN ('resident', 'worker', 'tourist', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_npcs_npc_id ON npcs(npc_id);
CREATE INDEX IF NOT EXISTS idx_npcs_country_id ON npcs(country_id);
CREATE INDEX IF NOT EXISTS idx_npcs_city_id ON npcs(city_id); -- ✅ FASE 18.5
CREATE INDEX IF NOT EXISTS idx_npcs_state_id ON npcs(state_id); -- ✅ FASE 18.5
CREATE INDEX IF NOT EXISTS idx_npcs_status ON npcs(status);
CREATE INDEX IF NOT EXISTS idx_npcs_routine_state ON npcs(routine_state); -- ✅ FASE 18.5
CREATE INDEX IF NOT EXISTS idx_npcs_home_building ON npcs(home_building_id); -- ✅ FASE 18.5
CREATE INDEX IF NOT EXISTS idx_npcs_work_building ON npcs(work_building_id); -- ✅ FASE 18.5
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
-- ✅ FASE 19.3: FUNÇÕES DE TRANSAÇÃO ATÔMICA
-- ============================================

/**
 * Transação atômica: Comprar imóvel
 * Garante que subtração de saldo e transferência de propriedade ocorrem juntos ou nenhum ocorre
 */
CREATE OR REPLACE FUNCTION purchase_property_atomic(
  p_listing_id VARCHAR(255),
  p_buyer_id VARCHAR(255),
  p_price DECIMAL(15, 2),
  p_broker_fee DECIMAL(15, 2),
  p_net_amount DECIMAL(15, 2),
  p_building_id UUID,
  p_seller_id VARCHAR(255)
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_buyer_wallet_id UUID;
  v_seller_wallet_id UUID;
  v_buyer_balance DECIMAL(15, 2);
  v_seller_balance DECIMAL(15, 2);
  v_result JSONB;
BEGIN
  -- Iniciar transação implícita (PostgreSQL)
  
  -- 1. Buscar carteiras do comprador e vendedor
  SELECT id, balance INTO v_buyer_wallet_id, v_buyer_balance
  FROM wallets WHERE user_id = p_buyer_id;
  
  SELECT id, balance INTO v_seller_wallet_id, v_seller_balance
  FROM wallets WHERE user_id = p_seller_id;
  
  -- 2. Validar saldo do comprador
  IF v_buyer_balance < p_price THEN
    RAISE EXCEPTION 'Saldo insuficiente. Necessário: %, Disponível: %', p_price, v_buyer_balance;
  END IF;
  
  -- 3. Subtrair saldo do comprador
  UPDATE wallets 
  SET balance = balance - p_price,
      total_spent = COALESCE(total_spent, 0) + p_price,
      updated_at = NOW()
  WHERE id = v_buyer_wallet_id;
  
  -- 4. Adicionar saldo ao vendedor
  UPDATE wallets 
  SET balance = balance + p_net_amount,
      total_earned = COALESCE(total_earned, 0) + p_net_amount,
      updated_at = NOW()
  WHERE id = v_seller_wallet_id;
  
  -- 5. Transferir propriedade do edifício
  UPDATE buildings 
  SET owner_id = p_buyer_id,
      updated_at = NOW()
  WHERE id = p_building_id;
  
  -- 6. Marcar listagem como vendida
  UPDATE property_listings
  SET status = 'sold',
      updated_at = NOW()
  WHERE listing_id = p_listing_id;
  
  -- Retornar sucesso
  v_result := jsonb_build_object(
    'success', true,
    'buyer_new_balance', v_buyer_balance - p_price,
    'seller_new_balance', v_seller_balance + p_net_amount
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, PostgreSQL automaticamente faz ROLLBACK
    RAISE EXCEPTION 'Erro na transação de compra de imóvel: %', SQLERRM;
END;
$$;

/**
 * Transação atômica: Construir edifício
 * Garante que subtração de saldo e criação de edifício ocorrem juntos ou nenhum ocorre
 */
CREATE OR REPLACE FUNCTION build_building_atomic(
  p_user_id VARCHAR(255),
  p_cost DECIMAL(15, 2),
  p_building_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance DECIMAL(15, 2);
  v_building_id UUID;
  v_result JSONB;
BEGIN
  -- Iniciar transação implícita (PostgreSQL)
  
  -- 1. Buscar carteira do usuário
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM wallets WHERE user_id = p_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Carteira não encontrada para usuário: %', p_user_id;
  END IF;
  
  -- 2. Validar saldo
  IF v_balance < p_cost THEN
    RAISE EXCEPTION 'Saldo insuficiente. Necessário: %, Disponível: %', p_cost, v_balance;
  END IF;
  
  -- 3. Subtrair saldo
  UPDATE wallets 
  SET balance = balance - p_cost,
      total_spent = COALESCE(total_spent, 0) + p_cost,
      updated_at = NOW()
  WHERE id = v_wallet_id;
  
  -- 4. Criar edifício
  INSERT INTO buildings (
    building_id,
    owner_id,
    country_id,
    country_name,
    state_id,
    state_name,
    city_id,
    city_name,
    type,
    position_lat,
    position_lng,
    level,
    cost,
    name,
    capacity,
    revenue_per_hour,
    condition,
    created_at,
    updated_at
  ) VALUES (
    (p_building_data->>'buildingId')::VARCHAR(255),
    p_user_id,
    (p_building_data->>'countryId')::VARCHAR(10),
    (p_building_data->>'countryName')::VARCHAR(255),
    NULLIF(p_building_data->>'stateId', 'null')::VARCHAR(50),
    NULLIF(p_building_data->>'stateName', 'null')::VARCHAR(255),
    NULLIF(p_building_data->>'cityId', 'null')::VARCHAR(50),
    NULLIF(p_building_data->>'cityName', 'null')::VARCHAR(255),
    (p_building_data->>'type')::VARCHAR(50),
    (p_building_data->>'position')->>'lat'::DECIMAL(10, 7),
    (p_building_data->>'position')->>'lng'::DECIMAL(11, 7),
    COALESCE((p_building_data->>'level')::INTEGER, 1),
    p_cost,
    (p_building_data->>'name')::VARCHAR(255),
    COALESCE((p_building_data->>'capacity')::INTEGER, 10),
    COALESCE((p_building_data->>'revenuePerHour')::DECIMAL(10, 2), 0),
    COALESCE((p_building_data->>'condition')::INTEGER, 100),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_building_id;
  
  -- Retornar sucesso
  v_result := jsonb_build_object(
    'success', true,
    'building_id', v_building_id,
    'new_balance', v_balance - p_cost
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, PostgreSQL automaticamente faz ROLLBACK
    RAISE EXCEPTION 'Erro na transação de construção de edifício: %', SQLERRM;
END;
$$;

-- ============================================
-- RLS (Row Level Security) - Desabilitado por padrão
-- Descomente se quiser habilitar segurança por linha
-- ============================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
-- ... (aplicar em todas as tabelas conforme necessário)

