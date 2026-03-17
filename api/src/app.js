import express from 'express';
import cors from 'cors';
import routes from "./routes/index.js"

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
