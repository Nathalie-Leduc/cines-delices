// Ordres des middlewares sur chaque route :
//   1. validate(schema)   → Zod vérifie et nettoie les données
//   2. authMiddleware     → JWT vérifie l'identité (si besoin)
//   3. controller         → logique métier (données déjà propres)

import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateMe,
  updateMyPassword,
  deleteMe,
} from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
  updatePasswordSchema,
} from "../validators/authValidator.js";

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

router.get('/logout', logout);

router.get('/me', authMiddleware, getMe);

router.put('/me', authMiddleware, validate(updateMeSchema), updateMe);

router.patch('/me', authMiddleware, validate(updateMeSchema), updateMe);

router.put('/me/password', authMiddleware, validate(updatePasswordSchema), updateMyPassword);

router.delete('/me', authMiddleware, deleteMe);

export default router;
