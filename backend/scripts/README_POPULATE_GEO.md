# 🗺️ POPULAR DADOS GEOGRÁFICOS

## 📋 Visão Geral

Este script popula automaticamente:
1. **Estados (states)** - 8 estados dos principais países
2. **Cidades (cities)** - 10 principais cidades mundiais
3. **NPCs com city_id** - Atribui NPCs às cidades mais próximas

---

## 🚀 Como Executar

### **Método 1: NPM Script (Recomendado)**

```bash
npm run populate:geo
```

ou

```bash
npm run setup:geo
```

### **Método 2: Node Direto**

```bash
node backend/scripts/populate-geographic-data.js
```

---

## 📊 Dados que Serão Inseridos

### **🗺️ Estados (8 total)**

| País | Estado | Código |
|------|--------|--------|
| 🇧🇷 Brasil | São Paulo | BRA-SP |
| 🇧🇷 Brasil | Rio de Janeiro | BRA-RJ |
| 🇧🇷 Brasil | Minas Gerais | BRA-MG |
| 🇺🇸 USA | California | USA-CA |
| 🇺🇸 USA | New York | USA-NY |
| 🇺🇸 USA | Texas | USA-TX |
| 🇨🇦 Canadá | Ontario | CAN-ON |
| 🇨🇦 Canadá | Quebec | CAN-QC |

### **🏙️ Cidades (10 total)**

| Cidade | Estado | População | Land Value |
|--------|--------|-----------|------------|
| São Paulo | BRA-SP | 12.3M | 5,000 VAL |
| Campinas | BRA-SP | 1.2M | 3,000 VAL |
| Rio de Janeiro | BRA-RJ | 6.7M | 4,500 VAL |
| Belo Horizonte | BRA-MG | 2.5M | 3,500 VAL |
| Los Angeles | USA-CA | 4.0M | 8,000 VAL |
| San Francisco | USA-CA | 0.9M | 10,000 VAL |
| New York City | USA-NY | 8.3M | 12,000 VAL |
| Houston | USA-TX | 2.3M | 4,000 VAL |
| Toronto | CAN-ON | 2.7M | 7,000 VAL |
| Montreal | CAN-QC | 1.7M | 6,000 VAL |

### **👥 NPCs**

- NPCs **sem city_id** serão atribuídos à cidade mais próxima
- Limite de distância: **500km**
- NPCs muito longe ficam **sem cidade** (podem ser nômades/rurais)

---

## 🔧 O Que o Script Faz

### **1. Popular Estados**
```sql
INSERT INTO states (state_id, name, code, country_id, country_name, geometry)
VALUES ('BRA-SP', 'São Paulo', 'SP', 'BRA', 'Brazil', {...})
```

### **2. Popular Cidades**
```sql
INSERT INTO cities (city_id, name, state_id, country_id, population, land_value, geometry)
VALUES ('BRA-SP-001', 'São Paulo', 'BRA-SP', 'BRA', 12325232, 5000, {...})
```

### **3. Atribuir NPCs às Cidades**
```sql
UPDATE npcs 
SET city_id = 'BRA-SP-001', city_name = 'São Paulo', state_id = 'BRA-SP'
WHERE position_lat BETWEEN ... AND position_lng BETWEEN ...
```

---

## ✅ Saída Esperada

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🗺️  POPULANDO DADOS GEOGRÁFICOS                         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🗺️  Populando estados...
   ✅ Estado inserido: São Paulo (BRA-SP)
   ✅ Estado inserido: Rio de Janeiro (BRA-RJ)
   ✅ Estado inserido: Minas Gerais (BRA-MG)
   ✅ Estado inserido: California (USA-CA)
   ✅ Estado inserido: New York (USA-NY)
   ✅ Estado inserido: Texas (USA-TX)
   ✅ Estado inserido: Ontario (CAN-ON)
   ✅ Estado inserido: Quebec (CAN-QC)

📊 Resumo Estados: 8 inseridos, 0 erros

🏙️  Populando cidades...
   ✅ Cidade inserida: São Paulo (BRA-SP-001)
   ✅ Cidade inserida: Campinas (BRA-SP-002)
   ✅ Cidade inserida: Rio de Janeiro (BRA-RJ-001)
   ✅ Cidade inserida: Belo Horizonte (BRA-MG-001)
   ✅ Cidade inserida: Los Angeles (USA-CA-001)
   ✅ Cidade inserida: San Francisco (USA-CA-002)
   ✅ Cidade inserida: New York City (USA-NY-001)
   ✅ Cidade inserida: Houston (USA-TX-001)
   ✅ Cidade inserida: Toronto (CAN-ON-001)
   ✅ Cidade inserida: Montreal (CAN-QC-001)

📊 Resumo Cidades: 10 inseridos, 0 erros

👥 Atribuindo city_id aos NPCs...
📊 Encontrados 996 NPCs sem city_id
   ✅ NPC npc_001 → São Paulo (45.3km)
   ✅ NPC npc_002 → Rio de Janeiro (23.1km)
   ⏭️  NPC npc_003 muito longe de qualquer cidade (856.2km)
   ...

📊 Resumo NPCs: 234 atualizados, 762 pulados

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ✅ POPULAÇÃO DE DADOS CONCLUÍDA COM SUCESSO!            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🎯 Próximos passos:
   1. Reinicie o backend (npm run dev)
   2. Recarregue o navegador (Ctrl+Shift+R)
   3. Clique em um país para ver os Estados!
   4. Dê zoom para ver as Cidades!
   5. NPCs devem aparecer nas cidades! 🎉
```

---

## ⚠️ Notas Importantes

### **Dados Já Existem?**
- Se você executar o script **2x**, registros duplicados serão **ignorados**
- Mensagem: `⚠️  Estado São Paulo já existe`

### **NPCs Longe de Cidades**
- NPCs a mais de **500km** de qualquer cidade **não serão** atribuídos
- Isso é **normal** - podem ser NPCs rurais ou nômades

### **Geometrias Simplificadas**
- Estados usam **bounding boxes** (retângulos) por simplicidade
- Para produção, use dados reais do Natural Earth ou similar

---

## 🔄 Re-executar o Script

Você pode executar **múltiplas vezes** sem problemas:

```bash
npm run populate:geo
```

- Registros existentes: **Ignorados**
- Novos registros: **Inseridos**
- NPCs já com city_id: **Não atualizados**

---

## 🧹 Limpar Dados (Opcional)

Se quiser **resetar** tudo:

```sql
-- NO SUPABASE SQL EDITOR:
DELETE FROM cities;
DELETE FROM states;
UPDATE npcs SET city_id = NULL, city_name = NULL, state_id = NULL, state_name = NULL;
```

Depois execute o script novamente:

```bash
npm run populate:geo
```

---

## 🎯 O Que Você Vai Ver no Mapa

### **Antes do Script:**
- ❌ Estados não aparecem
- ❌ Cidades não aparecem
- ❌ NPCs pulados (996/996)

### **Depois do Script:**
- ✅ **8 Estados** aparecem ao clicar em Brasil/USA/Canadá
- ✅ **10 Cidades** aparecem ao dar zoom
- ✅ **~200-300 NPCs** aparecem nas cidades! 🎉

---

## 📚 Adicionar Mais Dados (Futuro)

Para adicionar mais estados/cidades, edite o arquivo:

```
backend/scripts/populate-geographic-data.js
```

Adicione ao array `STATES_DATA` ou `CITIES_DATA`:

```javascript
{
  state_id: 'BRA-BA',
  name: 'Bahia',
  code: 'BA',
  country_id: 'BRA',
  country_name: 'Brazil',
  geometry: { ... }
}
```

---

## 🚀 Pronto para Popular!

Execute agora:

```bash
npm run populate:geo
```

**Tempo estimado:** 30 segundos

**Resultado:** Estados, Cidades e NPCs 100% funcionais! 🎉

