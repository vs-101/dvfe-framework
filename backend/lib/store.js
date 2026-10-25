import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FRAMEWORK_FILE = path.join(DATA_DIR, 'framework.json');
const IDEAS_DIR = path.join(DATA_DIR, 'ideas');

async function ensureDirs() {
  await fs.mkdir(IDEAS_DIR, { recursive: true });
}

export async function readFramework() {
  await ensureDirs();
  const raw = await fs.readFile(FRAMEWORK_FILE, 'utf-8');
  return JSON.parse(raw);
}

export async function writeFramework(framework) {
  await ensureDirs();
  framework.updatedAt = new Date().toISOString();
  await fs.writeFile(FRAMEWORK_FILE, JSON.stringify(framework, null, 2));
  return framework;
}

export async function listIdeas() {
  await ensureDirs();
  const files = (await fs.readdir(IDEAS_DIR)).filter((f) => f.endsWith('.json'));
  const ideas = await Promise.all(
    files.map(async (f) => JSON.parse(await fs.readFile(path.join(IDEAS_DIR, f), 'utf-8')))
  );
  return ideas.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function readIdea(id) {
  await ensureDirs();
  const file = path.join(IDEAS_DIR, `${id}.json`);
  const raw = await fs.readFile(file, 'utf-8');
  return JSON.parse(raw);
}

export async function writeIdea(idea) {
  await ensureDirs();
  idea.updatedAt = new Date().toISOString();
  const file = path.join(IDEAS_DIR, `${idea.id}.json`);
  await fs.writeFile(file, JSON.stringify(idea, null, 2));
  return idea;
}

export async function deleteIdea(id) {
  await ensureDirs();
  const file = path.join(IDEAS_DIR, `${id}.json`);
  await fs.unlink(file);
}
