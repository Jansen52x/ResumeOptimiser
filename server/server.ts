import express from 'express';
import cors from 'cors';
import Knex from 'knex';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';

const app = express();
const port = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
app.use(express.json());

const knex = Knex({
  client: 'sqlite3',
  connection: {
    filename: path.resolve(__dirname, 'dev.sqlite3')
  },
  useNullAsDefault: true
});

// --- Database Schema Initialization ---
const initializeDatabase = async () => {
  const hasProjectsTable = await knex.schema.hasTable('projects');
  if (!hasProjectsTable) {
    await knex.schema.createTable('projects', table => {
      table.string('id').primary();
      table.string('title').notNullable();
      table.integer('year');
      table.string('subtitle');
      table.json('description');
    });
  }

  const hasDocumentsTable = await knex.schema.hasTable('documents');
  if (!hasDocumentsTable) {
    await knex.schema.createTable('documents', table => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.text('content');
      table.string('type').notNullable(); // 'resume' or 'coverLetter'
    });
  }
};

// --- API Routes ---

// Projects
app.get('/api/projects', async (req, res) => {
  const projects = await knex('projects').select('*');
  res.json(projects.map(p => ({ ...p, description: JSON.parse(p.description) })));
});

app.post('/api/projects', async (req, res) => {
  const { description, ...rest } = req.body;
  const newProject = { 
    ...rest, 
    id: `proj-${crypto.randomUUID()}`,
    description: JSON.stringify(description)
  };
  await knex('projects').insert(newProject);
  res.status(201).json({ ...newProject, description });
});

app.put('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { description, ...rest } = req.body;
  const updatedData = { ...rest, description: JSON.stringify(description) };
  await knex('projects').where({ id }).update(updatedData);
  res.json({ id, ...req.body });
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  await knex('projects').where({ id }).del();
  res.status(204).send();
});

// Documents
app.get('/api/documents', async (req, res) => {
  const resumes = await knex('documents').where({ type: 'resume' }).select('*');
  const coverLetters = await knex('documents').where({ type: 'coverLetter' }).select('*');
  res.json({ resumes, coverLetters });
});

app.post('/api/documents', async (req, res) => {
  const { type, ...docData } = req.body;
  const newDoc = { ...docData, id: `doc-${crypto.randomUUID()}`, type };
  await knex('documents').insert(newDoc);
  res.status(201).json(newDoc);
});

app.delete('/api/documents/:type/:id', async (req, res) => {
  const { id } = req.params;
  await knex('documents').where({ id }).del();
  res.status(204).send();
});


// --- Server Start ---
app.listen(port, async () => {
  await initializeDatabase();
  console.log(`Server running at http://localhost:${port}`);
});
