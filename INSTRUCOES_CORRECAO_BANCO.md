# 🔧 INSTRUÇÕES PARA CORREÇÃO DO BANCO DE DADOS VALORIS

**Data**: 12/01/2026  
**Problema**: Colunas `city_id`, `city_name` e `updated_at` não existem no banco Supabase

---

## 🐛 Erros Detectados

```
❌ Could not find the 'city_id' column of 'buildings'
❌ Could not find the 'updated_at' column of 'shareholders'
❌ Failed to fetch (porta 5000 em cache)
```

---

## ✅ SOLUÇÃO PARTE 1: Corrigir Banco de Dados

### 📋 Passo a Passo

1. **Acesse o Supabase Dashboard**:
   ```
   https://supabase.com/dashboard
   ```

2. **Selecione seu projeto VALORIS**

3. **Abra o SQL Editor**:
   - Menu lateral esquerdo
   - Clique em "**SQL Editor**" (ou "Database" → "SQL Editor")

4. **Cole e execute este SQL**:

```sql
-- ✅ CORREÇÃO VALORIS: Adicionar colunas faltantes
-- Execute este SQL no Supabase Dashboard → SQL Editor

-- 1. Adicionar city_id em buildings (se não existir)
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS city_id VARCHAR(50);

-- 2. Adicionar city_name em buildings (se não existir)
ALTER TABLE buildings 
ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

-- 3. Adicionar updated_at em shareholders (se não existir)
ALTER TABLE shareholders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_buildings_city_id ON buildings(city_id);
CREATE INDEX IF NOT EXISTS idx_shareholders_updated_at ON shareholders(updated_at);

-- 5. Verificar se as colunas foram criadas (query de confirmação)
SELECT 
    'buildings' as tabela,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'buildings' 
  AND column_name IN ('city_id', 'city_name')
UNION ALL
SELECT 
    'shareholders' as tabela,
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'shareholders' 
  AND column_name = 'updated_at';
```

5. **Clique em "RUN"** ou pressione `Ctrl+Enter`

6. **Resultado esperado**:
   ```
   ✅ ALTER TABLE (3x)
   ✅ CREATE INDEX (2x)
   
   Query final retorna:
   tabela        | column_name | data_type
   --------------|-------------|----------
   buildings     | city_id     | varchar
   buildings     | city_name   | varchar
   shareholders  | updated_at  | timestamptz
   ```

---

## ✅ SOLUÇÃO PARTE 2: Limpar Cache do Navegador

### 🌐 Problema: Porta 5000 em cache

**Sintoma**:
```
❌ http://localhost:5000/api/... (ERRADO)
✅ http://localhost:3002/api/... (CORRETO)
```

### 💡 Solução: Hard Reload

**Método 1 - DevTools**:
1. Pressione `F12` (abrir DevTools)
2. Clique com **botão direito** no ícone de "Reload" 🔄 (próximo à barra de URL)
3. Selecione "**Empty Cache and Hard Reload**"

**Método 2 - Limpar Cache Manual**:
1. Pressione `Ctrl+Shift+Delete`
2. Selecione "**Últimas 4 horas**"
3. Marque:
   - ✅ Cookies e outros dados de sites
   - ✅ Imagens e arquivos em cache
4. Clique em "**Limpar dados**"

**Método 3 - Atalho Direto**:
```
Ctrl+Shift+R  (Windows/Linux)
Cmd+Shift+R   (Mac)
```

---

## 🧪 Verificação Final

### Logs Esperados Após Correções

**Console do Navegador (F12)**:
```
✅ Configuração dinâmica carregada: {port: 3002}
✅ Países carregados: 177 features
✅ Socket.io CONECTADO
```

**Aba Network (F12 → Network)**:
```
✅ GET http://localhost:3002/api/countries/geojson → 200 OK
✅ GET http://localhost:3002/api/buildings → 200 OK
✅ POST http://localhost:3002/api/buildings → 201 Created
```

**NÃO deve aparecer**:
```
❌ http://localhost:5000/...
❌ Could not find the 'city_id' column
❌ Could not find the 'updated_at' column
❌ Failed to fetch
```

---

## 📊 Resumo das Correções

| Problema | Solução | Status |
|----------|---------|--------|
| Coluna `city_id` não existe | SQL ALTER TABLE | ⏳ Execute manualmente |
| Coluna `city_name` não existe | SQL ALTER TABLE | ⏳ Execute manualmente |
| Coluna `updated_at` não existe | SQL ALTER TABLE | ⏳ Execute manualmente |
| Cache porta 5000 | Hard reload (Ctrl+Shift+R) | ⏳ Execute no navegador |

---

## 🚀 Ordem de Execução

```
1. ✅ Execute SQL no Supabase Dashboard
   ↓
2. ✅ Verifique que query de confirmação retornou as 3 colunas
   ↓
3. ✅ Recarregue navegador (Ctrl+Shift+R)
   ↓
4. ✅ Teste construir edifício
   ↓
5. ✅ Teste comprar ações
   ↓
6. ✅ Teste faucet (saquinho de dinheiro)
   ↓
7. ✅ Sistema 100% funcional! 🎉
```

---

## 💡 Se Ainda Assim Der Erro

### Verificar schema no Supabase:
```sql
-- Ver todas as colunas da tabela buildings
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'buildings'
ORDER BY ordinal_position;

-- Ver todas as colunas da tabela shareholders
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shareholders'
ORDER BY ordinal_position;
```

### Verificar se backend está na porta correta:
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 3002

# Esperado: PID com node.exe
```

### Verificar arquivo de configuração:
```bash
# Abrir arquivo
cat frontend/public/backend-config.json

# Esperado:
{
  "port": 3002,
  "apiUrl": "http://localhost:3002/api",
  "socketUrl": "http://localhost:3002"
}
```

---

**✅ SIGA ESTES PASSOS E O SISTEMA FUNCIONARÁ PERFEITAMENTE!** 🎉

