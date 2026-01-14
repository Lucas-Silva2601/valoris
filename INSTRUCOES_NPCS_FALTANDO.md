# 🚨 NPCs NÃO APARECEM NO MAPA - SOLUÇÃO

## 🔍 Problema Identificado

O backend tem **996 NPCs** no banco, mas **TODOS estão sendo pulados** porque:

1. ❌ A tabela `npcs` não tem as colunas `city_id` e `state_id`
2. ❌ Os NPCs não têm `city_id` atribuído
3. ❌ Sem `city_id`, os NPCs não têm coordenadas válidas

**Log do backend mostra:**
```
⏭️  996 NPCs pulados (sem cidade e sem coordenadas)
```

---

## ✅ SOLUÇÃO EM 3 PASSOS

### **PASSO 1: Executar SQL no Supabase**

1. Acesse: **https://supabase.com/dashboard/project/_/sql**
2. Copie o conteúdo de: `backend/scripts/ADD_NPC_COLUMNS.sql`
3. Cole no editor SQL do Supabase
4. Clique em **RUN** ou pressione `Ctrl+Enter`
5. Aguarde a confirmação: **"✅ COLUNA CRIADA COM SUCESSO!"**

**Conteúdo do SQL:**
```sql
-- ═══════════════════════════════════════════════════════════
-- 🔧 ADICIONAR COLUNAS EM NPCS - PROJETO VALORIS
-- ═══════════════════════════════════════════════════════════

-- 1️⃣  Adicionar colunas de hierarquia na tabela 'npcs'
ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS state_id VARCHAR(50) REFERENCES states(state_id) ON DELETE SET NULL;

ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS state_name VARCHAR(255);

ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS city_id VARCHAR(50) REFERENCES cities(city_id) ON DELETE SET NULL;

ALTER TABLE npcs 
ADD COLUMN IF NOT EXISTS city_name VARCHAR(255);

-- 2️⃣  Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_npcs_state_id ON npcs(state_id);
CREATE INDEX IF NOT EXISTS idx_npcs_city_id ON npcs(city_id);

-- 3️⃣  Verificar se funcionou (deve retornar 4 linhas)
SELECT 
  column_name, 
  data_type,
  '✅ COLUNA CRIADA COM SUCESSO!' as status
FROM information_schema.columns 
WHERE table_name = 'npcs' 
  AND column_name IN ('state_id', 'state_name', 'city_id', 'city_name')
ORDER BY column_name;
```

---

### **PASSO 2: Executar Script de População**

Depois de executar o SQL acima, volte ao terminal do projeto e execute:

```powershell
npm run populate:geo
```

**O que esse script faz:**
- ✅ Atribui `city_id` aos NPCs baseado no `country_id` deles
- ✅ Atribui `city_name` para cada NPC
- ✅ Distribui NPCs pelas cidades criadas

**Output esperado:**
```
✅ Estados inseridos
✅ Cidades inseridas
📊 Resumo NPCs: 996 atualizados
```

---

### **PASSO 3: Reiniciar e Verificar**

1. **Reinicie o backend:**
   ```powershell
   # No terminal onde o backend está rodando:
   Ctrl+C (parar)
   npm run dev (reiniciar)
   ```

2. **Limpe o cache do navegador:**
   - Pressione `Ctrl+Shift+R` (ou `Cmd+Shift+R` no Mac)
   - Ou: F12 → Aba Network → "Disable cache" → Recarregar

3. **Verifique o terminal do backend:**
   - Procure por: `✅ Processamento concluído: 996 processados` (em vez de "pulados")

4. **Verifique o mapa:**
   - Clique em um país (ex: BRA, USA)
   - Você deve ver pequenos **retângulos verticais coloridos** espalhados pelo mapa
   - Cores dos NPCs:
     - 🟢 Verde = Descansando
     - 🟠 Laranja = Indo para o trabalho
     - 🔵 Azul = Trabalhando
     - 🟣 Roxo = Voltando para casa

---

## 🎯 Resultado Final

Depois de seguir esses 3 passos, você verá:

✅ **996 NPCs espalhados pelo mapa**  
✅ **NPCs se movem suavemente a cada 5 segundos**  
✅ **Cores mudam conforme a rotina deles**  
✅ **Zoom in/out não faz os NPCs sumirem**  
✅ **NPCs visíveis desde o zoom global (nível 2)**

---

## ⚠️ Se Ainda Não Funcionar

Se após os 3 passos os NPCs ainda não aparecerem:

1. **Verifique o console do navegador** (F12 → Console)
   - Procure por erros de `NPCMarkers`

2. **Verifique o terminal do backend**
   - Procure por: `⏭️ NPCs pulados`
   - Se ainda mostrar "pulados", o `city_id` não foi atribuído

3. **Verifique o SQL no Supabase**
   - Execute: `SELECT city_id, city_name FROM npcs LIMIT 10;`
   - Se retornar valores NULL, o script de população não funcionou

4. **Me envie:**
   - ✅ Output do `npm run populate:geo`
   - ✅ Console do navegador
   - ✅ Últimas 50 linhas do terminal do backend

---

## 📝 Resumo Visual

```
┌─────────────────────────────────────────────────────┐
│  ANTES (996 NPCs pulados)                           │
│  ❌ Mapa vazio, sem NPCs                            │
└─────────────────────────────────────────────────────┘
                     ↓
          ┌──────────────────────┐
          │  PASSO 1: SQL        │
          │  Adiciona colunas    │
          └──────────────────────┘
                     ↓
          ┌──────────────────────┐
          │  PASSO 2: Script     │
          │  Popula city_id      │
          └──────────────────────┘
                     ↓
          ┌──────────────────────┐
          │  PASSO 3: Reiniciar  │
          │  Backend + Navegador │
          └──────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────┐
│  DEPOIS (996 NPCs processados)                      │
│  ✅ Mapa cheio de vida, NPCs se movendo! 🎉        │
└─────────────────────────────────────────────────────┘
```

---

**🚀 Comece pelo PASSO 1 agora!**

