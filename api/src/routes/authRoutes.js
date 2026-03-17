// Ordres des middlewares sur chaque route :
//   1. validate(schema)   → Zod vérifie et nettoie les données
//   2. authMiddleware     → JWT vérifie l'identité (si besoin)
//   3. controller         → logique métier (données déjà propres)

import { Router } from "express";
import { register, login, logout, getMe, updateMe, deleteMe } from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { registerSchema, loginSchema,updateMeSchema } from "../validators/auth.validator.js";

const router = Router;

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

router.get('/logout', logout);

router.get('/me', authMiddleware, getMe);

router.put('/me', authMiddleware, validate(updateMeSchema), updateMe);

router.delete('/me', authMiddleware, deleteMe);

export default router;
