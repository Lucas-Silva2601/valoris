# 📋 Como Executar o Schema SQL no Supabase

## ⚠️ Erro Atual

Você está recebendo o erro:
```
Could not find the table 'public.users' in the schema cache
Código: PGRST205
```

Isso significa que:
- ✅ A conexão com o Supabase está funcionando
- ❌ As tabelas ainda não foram criadas no banco de dados

## 🔧 Solução: Executar o Schema SQL

### Passo 1: Acessar o Supabase Dashboard

1. Abra seu navegador
2. Acesse: https://app.supabase.com
3. Faça login na sua conta
4. Selecione o projeto que você configurou (o que tem a URL: `https://qbubpkztlgsmiuxfbbha.supabase.co`)

### Passo 2: Abrir o SQL Editor

1. No menu lateral esquerdo, procure por **"SQL Editor"** (ícone de terminal/banco de dados)
2. Clique em **"SQL Editor"**
3. Clique no botão **"New query"** (ou "Nova query")

### Passo 3: Copiar o Schema SQL

1. Abra o arquivo `backend/config/schema.sql` no seu editor de código (VS Code, etc.)
2. Selecione **TODO** o conteúdo do arquivo (Ctrl+A / Cmd+A)
3. Copie (Ctrl+C / Cmd+C)

### Passo 4: Colar e Executar no Supabase

1. No SQL Editor do Supabase, cole o conteúdo que você copiou (Ctrl+V / Cmd+V)
2. Verifique se o conteúdo foi colado completamente
3. Clique no botão **"Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
4. Aguarde alguns segundos enquanto o SQL é executado

### Passo 5: Verificar se Funcionou

Você deve ver uma mensagem de sucesso como:
```
Success. No rows returned
```

Ou ver mensagens de criação de tabelas:
```
CREATE TABLE
CREATE INDEX
```

### Passo 6: Verificar as Tabelas Criadas

1. No menu lateral, clique em **"Table Editor"** (ou "Editor de Tabelas")
2. Você deve ver todas as tabelas criadas:
   - users
   - wallets
   - npcs
   - buildings
   - transactions
   - e outras...

### Passo 7: Testar Novamente

Volte ao terminal e execute novamente:

```bash
cd backend
node scripts/test-supabase-connection.js
```

Agora você deve ver:
```
✅ Conexão estabelecida com sucesso!
✅ Tabelas já existem no banco de dados!

🔍 Verificando tabelas...

   ✅ Tabela "wallets" existe
   ✅ Tabela "npcs" existe
   ✅ Tabela "buildings" existe
```

## 🆘 Problemas Comuns

### Erro: "syntax error" ou "unexpected token"
- **Causa**: O conteúdo não foi copiado completamente
- **Solução**: Certifique-se de copiar TODO o arquivo `schema.sql`, do início ao fim

### Erro: "permission denied"
- **Causa**: Você não tem permissão para executar SQL
- **Solução**: Certifique-se de estar logado como proprietário do projeto ou ter permissões de administrador

### Erro: "relation already exists"
- **Causa**: As tabelas já foram criadas anteriormente
- **Solução**: Isso não é um problema! O schema usa `CREATE TABLE IF NOT EXISTS`, então as tabelas já existentes não causam erro. Você pode continuar.

### Nenhuma mensagem após executar
- **Causa**: O SQL está processando (pode demorar alguns segundos)
- **Solução**: Aguarde alguns segundos e verifique o status. Se não aparecer nada, tente executar novamente.

## ✅ Próximos Passos

Depois que as tabelas forem criadas:

1. **Iniciar o servidor**:
   ```bash
   npm run dev
   ```

2. **Verificar logs**: Você deve ver:
   ```
   ✅ Supabase conectado
   📊 Projeto: https://qbubpkztlgsmiuxfbbha.supabase.co
   ```

3. **Testar funcionalidades**: 
   - Criar NPCs
   - Criar edifícios
   - Verificar carteiras

## 📝 Nota Importante

O arquivo `schema.sql` é grande (criará muitas tabelas). Se houver algum erro específico, copie apenas a parte que deu erro e execute novamente. Mas normalmente, executar tudo de uma vez funciona perfeitamente.

