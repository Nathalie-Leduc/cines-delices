import express from 'express';
import cors from 'cors'; // sur toutes les routes
import helmet from 'helmet'; // Sécurité HTTP headers sur toutes les routes
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';
import routes from './routes/index.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL;

app.use(helmet());
app.use(cors({
  origin:      CLIENT_URL,
  credentials: true,
}));
app.use(express.json());


// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', routes);

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

