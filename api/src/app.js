import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes)

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
