# 🚀 Guia de Migração: MongoDB → Supabase

Este guia explica como migrar o projeto Valoris de MongoDB para Supabase (PostgreSQL).

## 📋 Pré-requisitos

1. Conta no Supabase (https://supabase.com)
2. Projeto criado no Supabase
3. Credenciais do projeto (URL e API Key)

## 🔧 Passo 1: Configurar Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:
```bash
cp backend/env.example backend/.env
```

2. Edite o arquivo `.env` e adicione suas credenciais do Supabase:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-key
```

## 🗄️ Passo 2: Criar Schema no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Copie todo o conteúdo do arquivo `backend/config/schema.sql`
4. Cole no editor SQL e execute

Isso criará todas as tabelas necessárias no banco de dados.

## 🔄 Passo 3: Atualizar Código

O código já foi atualizado para usar Supabase. As principais mudanças:

### Arquivos Atualizados:
- ✅ `backend/config/supabase.js` - Nova configuração de conexão
- ✅ `backend/config/schema.sql` - Schema SQL completo
- ✅ `backend/repositories/` - Repositórios para substituir Mongoose
- ✅ `backend/utils/seedDatabase.js` - Atualizado para Supabase
- ✅ `backend/server.js` - Usa Supabase em vez de MongoDB

### Repositórios Criados:
- `baseRepository.js` - Classe base com métodos CRUD
- `walletRepository.js` - Repositório para carteiras
- `npcRepository.js` - Repositório para NPCs

## 📝 Passo 4: Migrar Dados (Opcional)

Se você já tem dados no MongoDB e quer migrá-los:

1. Exporte os dados do MongoDB
2. Converta para formato compatível com Supabase
3. Use scripts de migração (a serem criados conforme necessário)

## ✅ Passo 5: Testar

1. Inicie o servidor:
```bash
cd backend
npm start
```

2. Verifique os logs para confirmar conexão com Supabase
3. Teste as funcionalidades principais

## 🔍 Diferenças Principais

### MongoDB → Supabase

| MongoDB | Supabase |
|---------|----------|
| `mongoose.model()` | `BaseRepository` |
| `Model.findOne()` | `repository.findOne()` |
| `Model.find()` | `repository.find()` |
| `Model.create()` | `repository.create()` |
| `Model.updateOne()` | `repository.update()` |
| `Model.deleteOne()` | `repository.delete()` |
| `ObjectId` | `UUID` |
| `_id` | `id` (com `_id` para compatibilidade) |

## 🛠️ Próximos Passos

1. Criar repositórios para todos os models restantes
2. Atualizar todos os serviços para usar repositórios
3. Remover dependência do Mongoose (opcional)
4. Testar todas as funcionalidades

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

