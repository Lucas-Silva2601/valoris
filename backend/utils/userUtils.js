import { checkConnection, getSupabase } from '../config/supabase.js';
import { ensureUUID, TEST_USER_UUID } from './uuidUtils.js';

/**
 * Garante que um usuário de teste existe no banco de dados
 * Cria automaticamente se não existir
 * @param {string} userId - ID do usuário (pode ser string ou UUID)
 * @returns {Promise<string>} UUID do usuário
 */
export async function ensureTestUserExists(userId = 'test-user-id') {
  if (!checkConnection()) {
    // Se não tiver conexão, retornar UUID gerado
    return ensureUUID(userId);
  }

  try {
    const supabase = getSupabase();
    const userUUID = ensureUUID(userId);

    // Verificar se usuário já existe
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userUUID)
      .single();

    if (existingUser && !fetchError) {
      // Usuário já existe
      return userUUID;
    }

    // Usuário não existe, criar
    // Para "test-user-id", criar um usuário padrão
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        id: userUUID,
        username: userId === 'test-user-id' ? 'testuser' : `user_${userId.substring(0, 8)}`,
        email: userId === 'test-user-id' ? 'test@valoris.com' : `${userId}@valoris.com`,
        password: '$2b$10$dummyhashedpasswordfortesting', // Senha dummy para fase de teste
        role: 'investor'
      })
      .select('id')
      .single();

    if (createError) {
      // Se erro for de violação de constraint única (username/email), tentar buscar novamente
      if (createError.code === '23505') {
        const { data: foundUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', userUUID)
          .single();
        
        if (foundUser) {
          return userUUID;
        }
      }
      
      console.error('Erro ao criar usuário de teste:', createError);
      // Retornar UUID mesmo assim (o edifício pode ser criado sem usuário se owner_id permitir NULL)
      return userUUID;
    }

    return newUser?.id || userUUID;
  } catch (error) {
    console.error('Erro ao garantir usuário de teste:', error);
    // Retornar UUID mesmo assim
    return ensureUUID(userId);
  }
}

