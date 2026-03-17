// Vérification du token JWT dans le header Authorization

import { jwt } from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  // Recherche du header Authorization au format attendu
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou mal formaté' });
  }

  const token = authHeader.split(' ')[1]; //partie après Bearer

  try {
    // Vérification de la signature et de l'expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injection des infos dans req.user, qui sera ensuite accessible dans tous les controllers :
    // req.user.id, req.user.role
    req.user = decoded;

    next();
  } catch (error) {
    // jwt.verify lance une erreur si :
    // - la signature est invalide (token faslsifié)
    // - le token est expiré
    return res.status(401).json({ error: 'Token invalide ou expiré'})
  }
};