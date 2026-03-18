import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173'
}));

app.use(express.json());

app.use("/api", routes);

// Routes
app.use('/api/auth', authRoutes)

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
