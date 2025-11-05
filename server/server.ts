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

  const hasDocumentsTable = await knex.schema.hasTable('documents');
  if (!hasDocumentsTable) {
    await knex.schema.createTable('documents', table => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.text('content');
      table.string('type').notNullable(); // 'resume' or 'coverLetter'
      table.string('file_path'); // optional path to stored PDF (e.g. /uploads/doc-...pdf)
    });
  }
  else {
    // ensure file_path column exists for older DBs
    const hasFilePath = await knex.schema.hasColumn('documents', 'file_path');
    if (!hasFilePath) {
      await knex.schema.table('documents', table => {
        table.string('file_path');
      });
    }
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
  const resumesDb = await knex('documents').where({ type: 'resume' }).select('*');
  const coverLettersDb = await knex('documents').where({ type: 'coverLetter' }).select('*');

  // map file_path -> filePath for client-friendly casing
  const mapRow = (r: any) => ({ id: r.id, name: r.name, content: r.content, filePath: r.file_path, type: r.type });
  res.json({ resumes: resumesDb.map(mapRow), coverLetters: coverLettersDb.map(mapRow) });
});

app.post('/api/documents', async (req, res) => {
  const { type, fileBase64, ...docData } = req.body;
  const id = `doc-${crypto.randomUUID()}`;
  let filePath: string | null = null;

  // if a base64 PDF was provided, decode and write to uploads directory
  if (fileBase64) {
    try {
      // strip data URL prefix if present
      const base64 = (fileBase64 as string).startsWith('data:') ? (fileBase64 as string).split(',')[1] : fileBase64 as string;
      const buffer = Buffer.from(base64, 'base64');
  const filename = `${id}.pdf`;
  const outPath = path.join(uploadsDir, filename);
  await fs.writeFile(outPath, buffer);
  // return an absolute URL so clients can directly fetch the PDF from the backend
  filePath = `${serverOrigin}/uploads/${filename}`;
    } catch (e) {
      console.error('Failed to write uploaded file', e);
      return res.status(500).json({ error: 'Failed to save uploaded file' });
    }
  }

  const newDoc = { ...docData, id, type, file_path: filePath } as any;
  await knex('documents').insert(newDoc);

  // return client-friendly shape
  res.status(201).json({ id, ...docData, type, filePath });
});

app.delete('/api/documents/:type/:id', async (req, res) => {
  const { id } = req.params;
  // get file_path if any and delete file
  const row = await knex('documents').where({ id }).first();
  if (row && row.file_path) {
    try {
      // row.file_path may be an absolute URL (e.g. http://host/uploads/filename.pdf)
      // or a relative path (/uploads/filename.pdf). Extract the pathname to compute
      // the filesystem path to the stored file.
      let pathname = row.file_path;
      try {
        const u = new URL(row.file_path);
        pathname = u.pathname; // e.g. /uploads/filename.pdf
      } catch (e) {
        // not a valid URL, assume it's already a path
      }
      const full = path.join(__dirname, pathname.replace(/^\//, ''));
      if (existsSync(full)) {
        await fs.unlink(full);
      }
    } catch (e) {
      console.error('Failed to remove file for document', id, e);
    }
  }
  await knex('documents').where({ id }).del();
  res.status(204).send();
});


// --- Server Start ---
app.listen(port, async () => {
  await initializeDatabase();
  console.log(`Server running at http://localhost:${port}`);
});
