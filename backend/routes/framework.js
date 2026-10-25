import express from 'express';
import { nanoid } from 'nanoid';
import { readFramework, writeFramework } from '../lib/store.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const framework = await readFramework();
  res.json(framework);
});

router.put('/', async (req, res) => {
  const incoming = req.body;
  // Assign ids to any newly-added pillars/subcriteria that don't have one yet.
  incoming.pillars.forEach((p) => {
    if (!p.id) p.id = nanoid(8);
    p.subcriteria.forEach((s) => {
      if (!s.id) s.id = nanoid(8);
    });
  });
  const saved = await writeFramework(incoming);
  res.json(saved);
});

export default router;
