import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import authRoutes from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());


// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);

// Erreur 404 - route non trouvée
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});


// Middleware d'erreur globAL (toujours en dernier)


// Démarrage 
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});


