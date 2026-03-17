import { Router } from "express";
import { register, login, logout, getMe, updateMe, deleteMe } from "../controllers/authController.js";
import { registerSchema, loginSchema,updateMeSchema } from "../validators/auth.validator.js";

const router = Router;

router.post('/register', register);

router.post('/login', login);

router.get('/logout', logout);

router.get('/me', getMe);

router.put('/me', updateMe);

router.delete('/me', deleteMe);

export default router;
