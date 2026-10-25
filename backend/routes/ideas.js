import express from 'express';
import { nanoid } from 'nanoid';
import { readFramework, listIdeas, readIdea, writeIdea, deleteIdea } from '../lib/store.js';
import { evaluateIdea } from '../lib/scoring.js';

const router = express.Router();

function withEvaluation(idea) {
  const evaluation = evaluateIdea(idea.frameworkSnapshot, idea.scores);
  return { ...idea, evaluation };
}

router.get('/', async (req, res) => {
  const ideas = await listIdeas();
  res.json(ideas.map(withEvaluation));
});

router.post('/', async (req, res) => {
  const { name } = req.body;
  const framework = await readFramework();
  const now = new Date().toISOString();
  const idea = {
    id: nanoid(10),
    name: name || 'Untitled Idea',
    createdAt: now,
    updatedAt: now,
    frameworkSnapshot: framework,
    scores: {},
  };
  await writeIdea(idea);
  res.status(201).json(withEvaluation(idea));
});

router.get('/:id', async (req, res) => {
  try {
    const idea = await readIdea(req.params.id);
    res.json(withEvaluation(idea));
  } catch {
    res.status(404).json({ error: 'Idea not found' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await readIdea(req.params.id);
    const updated = {
      ...existing,
      name: req.body.name ?? existing.name,
      scores: req.body.scores ?? existing.scores,
    };
    await writeIdea(updated);
    res.json(withEvaluation(updated));
  } catch {
    res.status(404).json({ error: 'Idea not found' });
  }
});

router.post('/:id/duplicate', async (req, res) => {
  try {
    const existing = await readIdea(req.params.id);
    const now = new Date().toISOString();
    const copy = {
      ...existing,
      id: nanoid(10),
      name: `${existing.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    await writeIdea(copy);
    res.status(201).json(withEvaluation(copy));
  } catch {
    res.status(404).json({ error: 'Idea not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteIdea(req.params.id);
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Idea not found' });
  }
});

export default router;
