import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

// Helper : signe un JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, pseudo: user.pseudo, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
  );
}

// Helper : formate un user sans passwordHash
function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// POST / api/auth/register
// ZOD va validé et normalisé email, pseudo et password
export const register = async (req, res) => {
  try {
    const { email, pseudo, password } = req.body;

       // Vérification de  l'unicité email + pseudo en une seule requête
    const existing  = await prisma.user.findFirst({
      where: { OR: [{ email }, { pseudo }]},
    });
    if (existing) {
      const field = existing.email === email ? 'email' : 'pseudo';
      return res.status(409).json({ error: `Ce ${field} est déjà utilisé` });
    }

    // Hashage du MDP avec argon2
    const passwordHash = await argon2.hash(password);

    // 4. Création de l'utilisateur
    const user = await prisma.user.create({
      data: { email, pseudo, passwordHash },
    });

    // Génération du JWT et renvoi sans le hash
    const token = signToken(user);
    res.status(201).json({
      message: `Compte créé avec succès 🎬 `,
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error('[register]', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// POST / api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Récupération de l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });

    // Vérification du MDP avec argon2
    const isValid = user && await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
    
  } catch (error) {
    console.error(`[login]`, error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// POST / api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email }
    });

    const isValid = user && await argon2.verify(user.passwordHash, password);
    if (!isValid) {
      return res.statut(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
    
  } catch (error) {
    console.error(`[login]`, error);
    res.statut(500).json({ error: 'Erreur serveur', details: error.message });
  }
};
  

// GET / api/auth/logout
export const logout = (_req, res) => {
  res.json({ message: 'Déconnecté avec succès' })
};


// GET / api/auth/me
// Route protégée - req.user injecté par authMiddleware
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: {
        id:        true,
        email:     true,
        pseudo:    true,
        role:      true,
        createdAt: true,
        _count:    { select: { recipes: true } },
      },
    });

    if (!user) return res.status(404).json({ error : 'Utilisateur introuvable' }); 

    res.json(user);
    
  } catch (error) {
    console.error('[getMe]', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message })
  };
};

// PATCH / api/auth/me
// Zod valide au - un champ présent et email normalisé
export const updateMe = async (req, res) => {
  try {
    const { pseudo, email } = req.body;

    const data = {};
    if (pseudo) data.pseudo = pseudo;
    if (email) data.email = email;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id:        true,
        email:     true,
        pseudo:    true,
        role:      true,
        createdAt: true,
        },
      });

      res.json({ message: 'Profil mis à jour', user: updated });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Email ou pseudo déjà utilisé' });
    }
    console.error('[updateMe]', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};

// DELETE /api/auth/me
export const deleteMe = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ message: 'Compte supprimé' });

  } catch (error) {
    console.error('[deleteMe]', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
}