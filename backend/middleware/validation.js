import { validateEmail, validateUsername, validatePassword, validateCoordinates, validateShares, validateUnitType, validateCountryId, validateAmount, sanitizeString, sanitizeNumber } from '../utils/validators.js';

/**
 * Middleware de validação para registro
 */
export const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;

  // Sanitizar inputs
  req.body.username = sanitizeString(username);
  req.body.email = sanitizeString(email).toLowerCase();

  // Validar
  if (!validateUsername(req.body.username)) {
    return res.status(400).json({ 
      error: 'Username inválido. Deve ter 3-20 caracteres e conter apenas letras, números e underscore.' 
    });
  }

  if (!validateEmail(req.body.email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  next();
};

/**
 * Middleware de validação para login
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  req.body.email = sanitizeString(email).toLowerCase();

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  if (!validateEmail(req.body.email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  next();
};

/**
 * Middleware de validação para compra de ações
 */
export const validateBuyShares = (req, res, next) => {
  const { countryId, countryName, shares } = req.body;

  req.body.countryId = sanitizeString(countryId);
  req.body.countryName = sanitizeString(countryName);
  req.body.shares = sanitizeNumber(shares);

  if (!validateCountryId(req.body.countryId)) {
    return res.status(400).json({ error: 'ID do país inválido' });
  }

  if (!validateShares(req.body.shares)) {
    return res.status(400).json({ error: 'Quantidade de ações inválida (0-100%)' });
  }

  next();
};

/**
 * Middleware de validação para criação de unidade
 */
export const validateCreateUnit = (req, res, next) => {
  const { countryId, type, position } = req.body;

  req.body.countryId = sanitizeString(countryId);
  req.body.type = sanitizeString(type);

  if (!validateCountryId(req.body.countryId)) {
    return res.status(400).json({ error: 'ID do país inválido' });
  }

  if (!validateUnitType(req.body.type)) {
    return res.status(400).json({ error: 'Tipo de unidade inválido' });
  }

  if (!position || !validateCoordinates(position.lat, position.lng)) {
    return res.status(400).json({ error: 'Coordenadas inválidas' });
  }

  req.body.position = {
    lat: sanitizeNumber(position.lat),
    lng: sanitizeNumber(position.lng)
  };

  next();
};

/**
 * Middleware de validação para movimento de unidade
 */
export const validateMoveUnit = (req, res, next) => {
  const { targetLat, targetLng } = req.body;

  if (!validateCoordinates(targetLat, targetLng)) {
    return res.status(400).json({ error: 'Coordenadas de destino inválidas' });
  }

  req.body.targetLat = sanitizeNumber(targetLat);
  req.body.targetLng = sanitizeNumber(targetLng);

  next();
};

