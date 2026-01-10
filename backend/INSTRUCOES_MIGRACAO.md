# 🚀 Instruções de Migração MongoDB → Supabase

## ✅ O que já foi feito

1. **Dependências instaladas**
   - ✅ `@supabase/supabase-js` instalado

2. **Configuração criada**
   - ✅ `backend/config/supabase.js` - Configuração de conexão
   - ✅ `backend/config/schema.sql` - Schema completo do banco
   - ✅ `backend/env.example` - Atualizado com variáveis do Supabase

3. **Repositórios criados**
   - ✅ `backend/repositories/baseRepository.js` - Classe base
   - ✅ `backend/repositories/walletRepository.js` - Carteiras
   - ✅ `backend/repositories/npcRepository.js` - NPCs

4. **Serviços atualizados**
   - ✅ `backend/services/npcService.js` - Migrado para Supabase
   - ✅ `backend/utils/seedDatabase.js` - Migrado para Supabase

5. **Server atualizado**
   - ✅ `backend/server.js` - Configurado para usar Supabase

## 📋 Passos para Completar a Migração

### 1. Configurar Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Anote as credenciais:
   - **Project URL** (SUPABASE_URL)
   - **anon/public key** (SUPABASE_ANON_KEY)
   - **service_role key** (SUPABASE_SERVICE_ROLE_KEY)

### 2. Configurar Variáveis de Ambiente

1. Copie `backend/env.example` para `backend/.env`:
```bash
cp backend/env.example backend/.env
```

2. Edite `backend/.env` e adicione:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-key
```

### 3. Criar Schema no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **New Query**
4. Abra o arquivo `backend/config/schema.sql`
5. Copie TODO o conteúdo
6. Cole no editor SQL do Supabase
7. Clique em **Run** (ou pressione Ctrl+Enter)

Isso criará todas as tabelas, índices e triggers necessários.

### 4. Testar Conexão

1. Inicie o servidor:
```bash
cd backend
npm start
```

2. Verifique os logs - deve aparecer:
```
✅ Supabase conectado
📊 Projeto: https://seu-projeto.supabase.co
```

3. Se aparecer erro, verifique:
   - Variáveis de ambiente configuradas corretamente
   - Schema SQL executado no Supabase
   - Projeto Supabase está ativo

## 🔄 Próximos Passos (Opcional - para migração completa)

Para migrar completamente todos os serviços, você precisará:

1. **Criar repositórios faltando** (veja `backend/STATUS_MIGRACAO.md`)
2. **Atualizar serviços restantes** para usar repositórios
3. **Atualizar controllers** para usar repositórios
4. **Testar todas as funcionalidades**

## 📝 Notas Importantes

- O código ainda tem algumas referências ao MongoDB/Mongoose
- Funcionalidades básicas (NPCs, Wallets, Seed) já estão migradas
- Outras funcionalidades podem precisar de atualização adicional
- O sistema funciona em "modo híbrido" - pode usar Supabase e MongoDB simultaneamente durante a transição

## 🆘 Troubleshooting

### Erro: "Supabase não está conectado"
- Verifique se as variáveis de ambiente estão configuradas
- Verifique se o schema SQL foi executado
- Verifique se o projeto Supabase está ativo

### Erro: "relation does not exist"
- Execute o schema SQL no Supabase Dashboard
- Verifique se todas as tabelas foram criadas

### Erro: "permission denied"
- Verifique se está usando a chave correta (ANON_KEY ou SERVICE_ROLE_KEY)
- Verifique as políticas RLS no Supabase (se habilitadas)

## 📚 Documentação

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- Veja `backend/STATUS_MIGRACAO.md` para status detalhado

