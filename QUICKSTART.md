# Quick Start Guide - LaTeX Export Feature

## Prerequisites

### 1. Install LaTeX Distribution
You need pdflatex installed on your system:

**Windows:**
```powershell
# Install MiKTeX (recommended)
# Download from: https://miktex.org/download
# Or use chocolatey:
choco install miktex
```

**Verify installation:**
```powershell
pdflatex --version
```

### 2. Install Python Dependencies
```powershell
cd server/resume_gen
pip install flask flask-cors jinja2
```

## Running the Application

You need to run **THREE** servers:

### Terminal 1: Flask Server (PDF Generation)
```powershell
cd server/resume_gen
python app.py
```
Should output: `Running on http://0.0.0.0:5000`

### Terminal 2: Node API Server
```powershell
cd server
npm run dev
```
Should output: `Server running at http://localhost:3001`

### Terminal 3: Frontend Dev Server
```powershell
npm run dev
```
Should output: Vite dev server URL

## Using the New Features

### 1. Optimize Your Resume
- Go to the **Optimizer** tab
- Paste job posting (or upload screenshot)
- Select base resume
- Choose 3-5 relevant projects
- Optionally add cover letter inspiration and personal notes
- Click **"Optimize My Application"**

### 2. Edit Your Resume
After optimization, you'll see your resume in structured sections:
- Click any text to edit it
- Add/remove bullet points with the + and × buttons
- **Protected fields** (education, company names, dates) are marked read-only

### 3. Export Options

**Export as .docx (Word):**
- Click the blue **.docx** button
- Works for both resume and cover letter
- Opens in Microsoft Word, Google Docs, etc.

**Export as .pdf (LaTeX):**
- Click the green **.pdf (LaTeX)** button (only visible on Resume tab)
- Generates professional PDF using your LaTeX template
- Requires Flask server to be running

## Troubleshooting

### PDF Export Fails
**Error: "Failed to generate PDF. Make sure the Flask server is running on port 5000."**

**Solutions:**
1. Check Flask server is running: `http://localhost:5000`
2. Verify pdflatex is installed: `pdflatex --version`
3. Check Flask logs for LaTeX compilation errors
4. Ensure no firewall blocking port 5000

### CORS Errors
**Error: CORS policy blocking requests**

**Solution:**
Make sure Flask server has `flask-cors` installed:
```powershell
pip install flask-cors
```

### Type Errors in Console
**Error: "Cannot read property 'summary' of undefined"**

**Solution:**
Your database might have old data in string format. Delete the database and restart:
```powershell
rm server/dev.sqlite3
# Restart the Node server - it will recreate the database
```

### LaTeX Template Not Found
**Error: "resume_template.tex not found"**

**Solution:**
Ensure the template exists at: `server/resume_gen/resume_template.tex`

## Features Summary

### AI Preservation Rules ✅
When optimizing, the AI will:
- ✅ **PRESERVE**: Company names, job titles, work dates
- ✅ **PRESERVE**: Education details (institution, degree, dates)
- ✅ **PRESERVE**: Contact information (email, phone, links)
- ✅ **MODIFY**: Only bullet point wording to match job keywords
- ✅ **TAILOR**: Project descriptions and subtitles

### Editable Fields ✏️
You can edit:
- ✏️ Professional summary
- ✏️ Work experience bullet points
- ✏️ Project subtitles and descriptions
- ✏️ Technical skills lists

### Protected Fields 🔒
These cannot be edited (by design):
- 🔒 Education section
- 🔒 Company names and job titles
- 🔒 Employment/project dates
- 🔒 Contact information

## File Structure

```
server/
├── resume_gen/
│   ├── app.py                 # Flask PDF generation server
│   └── resume_template.tex    # LaTeX template
├── server.ts                  # Node API server
└── dev.sqlite3               # SQLite database

services/
├── geminiService.ts          # AI optimization logic
├── latexService.ts           # LaTeX conversion & export
└── apiService.ts             # API communication

components/
├── ResumeEditor.tsx          # Structured resume editor
├── OutputSection.tsx         # Results display with export
└── ResultsViewer.tsx         # Saved results viewer
```

## Next Steps

Want to enhance the feature further? Consider:
1. **Save edited resumes** back to database with an "Update" button
2. **Preview LaTeX** source before exporting
3. **Multiple templates** - let users choose different LaTeX styles
4. **Batch export** - export all saved resumes at once
5. **Cover letter PDF** - add LaTeX support for cover letters too
