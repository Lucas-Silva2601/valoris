import crypto from 'crypto';

/**
 * Gera um UUID v5 (determinístico) a partir de uma string
 * Útil para converter userIds de teste em UUIDs válidos
 * @param {string} name - Nome/string para gerar UUID
 * @param {string} namespace - Namespace UUID (default: UUID do DNS)
 * @returns {string} UUID v5 válido
 */
export function stringToUUID(name, namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8') {
  if (!name || typeof name !== 'string') {
    throw new Error('Nome deve ser uma string válida');
  }

  // Converter namespace UUID para buffer
  const namespaceBytes = namespace.replace(/-/g, '').match(/.{1,2}/g).map(byte => parseInt(byte, 16));
  const namespaceBuffer = Buffer.from(namespaceBytes);

  // Criar hash SHA-1 do namespace + nome
  const hash = crypto.createHash('sha1');
  hash.update(namespaceBuffer);
  hash.update(name);
  const hashBytes = hash.digest();

  // Converter para UUID v5 format
  // UUID v5: version 5 (0101), variant RFC 4122 (10xx)
  hashBytes[6] = (hashBytes[6] & 0x0f) | 0x50; // Version 5
  hashBytes[8] = (hashBytes[8] & 0x3f) | 0x80; // Variant RFC 4122

  // Converter bytes para string UUID
  const uuid = [
    hashBytes.slice(0, 4).toString('hex'),
    hashBytes.slice(4, 6).toString('hex'),
    hashBytes.slice(6, 8).toString('hex'),
    hashBytes.slice(8, 10).toString('hex'),
    hashBytes.slice(10, 16).toString('hex')
  ].join('-');

  return uuid;
}

/**
 * Verifica se uma string é um UUID válido
 * @param {string} str - String para verificar
 * @returns {boolean} True se for UUID válido
 */
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Converte userId para UUID válido
 * Se já for UUID, retorna como está
 * Se for string, gera UUID determinístico
 * @param {string} userId - User ID (pode ser string ou UUID)
 * @returns {string} UUID válido
 */
export function ensureUUID(userId) {
  if (!userId) {
    throw new Error('userId não pode ser vazio');
  }

  // Se já for UUID válido, retornar como está
  if (isValidUUID(userId)) {
    return userId;
  }

  // Se for string, gerar UUID determinístico
  return stringToUUID(userId);
}

/**
 * UUID fixo para usuário de teste padrão
 * Este UUID é sempre o mesmo para "test-user-id"
 */
export const TEST_USER_UUID = stringToUUID('test-user-id');

