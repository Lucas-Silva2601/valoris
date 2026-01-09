/**
 * Validadores para entrada de dados
 */

/**
 * Validar email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validar username
 */
export const validateUsername = (username) => {
  if (!username || username.length < 3 || username.length > 20) {
    return false;
  }
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};

/**
 * Validar senha
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validar coordenadas
 */
export const validateCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
};

/**
 * Validar quantidade de ações
 */
export const validateShares = (shares) => {
  return (
    typeof shares === 'number' &&
    shares > 0 &&
    shares <= 100
  );
};

/**
 * Validar tipo de unidade
 */
export const validateUnitType = (type) => {
  return ['tank', 'ship', 'plane'].includes(type);
};

/**
 * Validar país ID (aceita qualquer ID válido, não apenas ISO_A3)
 * Agora aceita IDs flexíveis gerados pelo frontend para países sem código ISO padrão
 */
export const validateCountryId = (countryId) => {
  return countryId && typeof countryId === 'string' && countryId.length > 0 && countryId.length <= 10;
};

/**
 * Validar valor monetário
 */
export const validateAmount = (amount) => {
  return (
    typeof amount === 'number' &&
    amount >= 0 &&
    isFinite(amount)
  );
};

/**
 * Sanitizar string (remover caracteres perigosos)
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  return str
    .trim()
    .replace(/[<>]/g, '') // Remover < e >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, ''); // Remover event handlers
};

/**
 * Sanitizar número
 */
export const sanitizeNumber = (num) => {
  const parsed = parseFloat(num);
  return isNaN(parsed) ? 0 : parsed;
};

