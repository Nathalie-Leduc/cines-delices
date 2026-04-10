import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { startInactivityCron } from './jobs/inactivityCheck.js';
import setupSwagger from './swagger/swagger.js';

const app = express();

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;

// Crée le dossier uploads au démarrage si absent
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Trust proxy — nécessaire pour Railway (rate limiting, IP réelle derrière le reverse proxy)
app.set('trust proxy', 1);

// Sécurité HTTP headers
app.use(helmet());

// CORS — autorise uniquement le front défini dans CLIENT_URL
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

// Parsing JSON
app.use(express.json());

// Fichiers uploadés — header CORP pour autoriser les images cross-origin
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

// Documentation Swagger — /api-docs et /api/docs
setupSwagger(app);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware d'erreur global (toujours en dernier)
app.use(errorMiddleware);

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Origine client autorisée : ${CLIENT_URL}`);
});

// Cron de vérification d'inactivité des comptes
startInactivityCron();
