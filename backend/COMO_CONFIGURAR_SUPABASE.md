# 🔑 Como Configurar as Chaves do Supabase

## 📋 Passo a Passo

### 1. Criar Projeto no Supabase

Se você ainda não tem um projeto no Supabase:

1. Acesse: https://app.supabase.com
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Preencha os dados do projeto:
   - **Name**: Nome do seu projeto (ex: "Valoris")
   - **Database Password**: Escolha uma senha forte
   - **Region**: Escolha a região mais próxima de você
   - **Pricing Plan**: Escolha o plano (Free tier é suficiente para começar)

5. Aguarde a criação do projeto (pode levar alguns minutos)

### 2. Obter as Chaves do Supabase

Depois que o projeto estiver criado:

1. No dashboard do Supabase, vá em **Settings** (ícone de engrenagem no menu lateral)
2. Clique em **API** no menu de configurações
3. Você verá três seções importantes:

#### 📍 **Project URL**
```
SUPABASE_URL=https://xxxxx.supabase.co
```
Copie a **Project URL** completa (começa com `https://`)

#### 🔑 **anon/public key**
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Esta é a chave pública/anônima. Copie toda a string (é longa, começa com `eyJ...`)

#### 🔐 **service_role key** (IMPORTANTE: Mantenha em segredo!)
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Esta é a chave de serviço (role). **⚠️ NÃO compartilhe esta chave publicamente!**

### 3. Configurar o arquivo .env

1. No diretório `backend/`, abra o arquivo `.env`
2. Substitua os valores das seguintes variáveis:

```env
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-key-aqui
```

**Exemplo** (substitua pelos seus valores reais):
```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.abc123def456...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM0NTY3ODkwLCJleHAiOjE5NTAxNDM4OTB9.xyz789uvw456...
```

### 4. Executar o Schema SQL no Supabase

Antes de usar o sistema, você precisa criar as tabelas no Supabase:

1. No dashboard do Supabase, vá em **SQL Editor** (ícone de terminal no menu lateral)
2. Clique em **New Query**
3. Abra o arquivo `backend/config/schema.sql` no seu editor de código
4. Copie TODO o conteúdo do arquivo `schema.sql`
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
7. Aguarde a execução (pode levar alguns segundos)
8. Verifique se apareceu a mensagem "Success. No rows returned"

### 5. Testar a Conexão

Depois de configurar tudo, teste a conexão:

```bash
cd backend
node scripts/test-supabase-connection.js
```

Ou simplesmente inicie o servidor:

```bash
npm run dev
```

Você deve ver mensagens como:
```
✅ Supabase conectado
📊 Projeto: https://seu-projeto-id.supabase.co
```

## ⚠️ Importante

- **NUNCA** compartilhe o arquivo `.env` publicamente
- **NUNCA** faça commit do arquivo `.env` no Git (ele já está no `.gitignore`)
- A chave `SUPABASE_SERVICE_ROLE_KEY` tem privilégios administrativos - mantenha-a segura
- A chave `SUPABASE_ANON_KEY` pode ser usada no frontend (é pública)

## 🆘 Problemas Comuns

### Erro: "Variáveis de ambiente do Supabase não configuradas"
- Verifique se o arquivo `.env` existe em `backend/.env`
- Verifique se as variáveis estão escritas corretamente (sem espaços extras)
- Reinicie o servidor após alterar o `.env`

### Erro: "PGRST116" ou "tabela não existe"
- Execute o schema SQL no Supabase (veja passo 4 acima)
- Verifique se todas as tabelas foram criadas no dashboard do Supabase (vá em **Table Editor**)

### Erro de conexão ou timeout
- Verifique se a `SUPABASE_URL` está correta
- Verifique se as chaves estão corretas (copie completamente, sem espaços)
- Verifique sua conexão com a internet
- Verifique se o projeto Supabase está ativo

## 📚 Recursos Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Início Rápido](https://supabase.com/docs/guides/getting-started)
- [API Reference](https://supabase.com/docs/reference/javascript/introduction)

