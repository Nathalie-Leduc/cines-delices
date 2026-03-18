import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin non autorisée: ${origin}`));
  }
}));

app.use(express.json());

app.use("/api", routes);

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
