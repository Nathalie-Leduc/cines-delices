import express from 'express';
import setupSwagger from './swagger.js';
import cors from 'cors'; // sur toutes les routes
import helmet from 'helmet'; // Sécurité HTTP headers sur toutes les routes
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import routes from './routes/index.js'
import { errorMiddleware } from './middlewares/errorMiddleware.js';

const app = express();
// AJOUT À FAIRE DANS app.js — trust proxy
// ============================================================
// À ajouter APRÈS la ligne : const app = express();
// et AVANT : app.use(helmet());


const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;
const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

// AJOUT À FAIRE DANS app.js — trust proxy
// ============================================================
// À ajouter APRÈS la ligne : const app = express();
// et AVANT : app.use(helmet());
app.set('trust proxy', 1);


// Sécurité et parsing
app.use(helmet());
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Swagger docs
setupSwagger(app);


// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes); // auth : register; login, me...
app.use('/api', routes);          // tmdb, users, admin, recipes

// Erreur 404 - route non trouvée
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});


// Middleware d'erreur globaL (toujours en dernier)
app.use(errorMiddleware);


// Démarrage 
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Origine client autorisée : ${CLIENT_URL}`);
});


