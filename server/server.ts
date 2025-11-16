import express from 'express';
import cors from 'cors';
import Knex from 'knex';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';

const app = express();
const port = 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(cors());
// allow larger JSON payloads because PDFs are uploaded as base64 in the request body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically from /uploads
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// server origin used to build absolute URLs for uploaded files
const serverOrigin = `http://localhost:${port}`;

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

  const hasResultsTable = await knex.schema.hasTable('results');
  if (!hasResultsTable) {
    await knex.schema.createTable('results', table => {
      table.string('id').primary();
      table.string('job_title').notNullable();
      table.string('company_name').notNullable();
      table.text('resume').notNullable();
      table.text('cover_letter').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasWorkExperiencesTable = await knex.schema.hasTable('work_experiences');
  if (!hasWorkExperiencesTable) {
    await knex.schema.createTable('work_experiences', table => {
      table.string('id').primary();
      table.string('company').notNullable();
      table.string('role').notNullable();
      table.string('dates').notNullable();
      table.json('bullets'); // Array of bullet points
    });
  }

  const hasSkillsTable = await knex.schema.hasTable('skills');
  if (!hasSkillsTable) {
    await knex.schema.createTable('skills', table => {
      table.string('id').primary();
      table.string('skill_name').notNullable();
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

// Work Experiences
app.get('/api/work-experiences', async (req, res) => {
  const experiences = await knex('work_experiences').select('*');
  res.json(experiences.map(exp => ({ ...exp, bullets: JSON.parse(exp.bullets) })));
});

app.post('/api/work-experiences', async (req, res) => {
  const { bullets, ...rest } = req.body;
  const newExperience = {
    ...rest,
    id: `exp-${crypto.randomUUID()}`,
    bullets: JSON.stringify(bullets)
  };
  await knex('work_experiences').insert(newExperience);
  res.status(201).json({ ...newExperience, bullets });
});

app.put('/api/work-experiences/:id', async (req, res) => {
  const { id } = req.params;
  const { bullets, ...rest } = req.body;
  const updatedData = { ...rest, bullets: JSON.stringify(bullets) };
  await knex('work_experiences').where({ id }).update(updatedData);
  res.json({ id, ...req.body });
});

app.delete('/api/work-experiences/:id', async (req, res) => {
  const { id } = req.params;
  await knex('work_experiences').where({ id }).del();
  res.status(204).send();
});

// Skills
app.get('/api/skills', async (req, res) => {
  const skills = await knex('skills').select('*');
  res.json(skills);
});

app.post('/api/skills', async (req, res) => {
  const { skill_name } = req.body;
  const newSkill = {
    id: `skill-${crypto.randomUUID()}`,
    skill_name
  };
  await knex('skills').insert(newSkill);
  res.status(201).json(newSkill);
});

app.delete('/api/skills/:id', async (req, res) => {
  const { id } = req.params;
  await knex('skills').where({ id }).del();
  res.status(204).send();
});

// Bulk update skills (replace all)
app.put('/api/skills', async (req, res) => {
  const { skills } = req.body; // array of skill names
  
  // Delete all existing skills
  await knex('skills').del();
  
  // Insert new skills
  const newSkills = skills.map((skillName: string) => ({
    id: `skill-${crypto.randomUUID()}`,
    skill_name: skillName
  }));
  
  if (newSkills.length > 0) {
    await knex('skills').insert(newSkills);
  }
  
  res.json(newSkills);
});

// Results
app.get('/api/results', async (req, res) => {
  const results = await knex('results').select('*').orderBy('created_at', 'desc');
  res.json(results.map(r => ({
    id: r.id,
    jobTitle: r.job_title,
    companyName: r.company_name,
    resume: typeof r.resume === 'string' ? JSON.parse(r.resume) : r.resume,
    coverLetter: r.cover_letter,
    createdAt: r.created_at
  })));
});

app.post('/api/results', async (req, res) => {
  const { jobTitle, companyName, resume, coverLetter } = req.body;
  const id = `result-${crypto.randomUUID()}`;
  const newResult = {
    id,
    job_title: jobTitle,
    company_name: companyName,
    resume: JSON.stringify(resume), // Store as JSON string
    cover_letter: coverLetter,
    created_at: new Date().toISOString()
  };
  await knex('results').insert(newResult);
  res.status(201).json({
    id,
    jobTitle,
    companyName,
    resume,
    coverLetter,
    createdAt: newResult.created_at
  });
});

app.delete('/api/results/:id', async (req, res) => {
  const { id } = req.params;
  await knex('results').where({ id }).del();
  res.status(204).send();
});


// --- Server Start ---
app.listen(port, async () => {
  await initializeDatabase();
  console.log(`Server running at http://localhost:${port}`);
});
