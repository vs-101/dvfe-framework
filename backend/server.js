import express from 'express';
import cors from 'cors';
import frameworkRoutes from './routes/framework.js';
import ideasRoutes from './routes/ideas.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/framework', frameworkRoutes);
app.use('/api/ideas', ideasRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`DVFE backend listening on http://localhost:${PORT}`);
});
