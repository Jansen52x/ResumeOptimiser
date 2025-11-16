import type { ResumeStructure } from '../types';

const API_BASE_URL = 'http://localhost:5000';

/**
 * Converts structured resume data to LaTeX format and generates a PDF
 * @param resume - The structured resume data
 * @param filename - The name of the output PDF file
 */
export const generateLatexPDF = async (resume: ResumeStructure, filename: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: resume.summary,
        work_experience: resume.workExperience,
        projects: resume.projects,
        skills: resume.skills,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Get the PDF blob from the response
    const blob = await response.blob();

    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to generate LaTeX PDF:', error);
    throw new Error('Failed to generate PDF. Make sure the Flask server is running on port 5000.');
  }
};

/**
 * Converts structured resume data to LaTeX string (for preview or debugging)
 */
export const convertToLatexString = (resume: ResumeStructure): string => {
  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
      .replace(/~/g, '\\textasciitilde{}')
      .replace(/\^/g, '\\textasciicircum{}');
  };

  let latex = `\\documentclass[a4paper,10pt]{article}
\\usepackage[margin=1cm]{geometry}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{setspace}
\\usepackage{hyperref}

\\setstretch{1.05}
\\pagenumbering{gobble}

% --- Section formatting ---
\\titleformat{\\section}{
  \\large\\bfseries
}{}{0em}{}[\\titlerule]

\\newcommand{\\workentry}[4]{%
  \\textbf{#1} \\hfill \\textit{#2}\\\\
  \\textit{#3}\\\\[-2pt]
  \\begin{itemize}[leftmargin=1em, noitemsep, topsep=0pt]
    #4
  \\end{itemize}
}

\\newcommand{\\projectentry}[4]{%
  \\textbf{#1} \\hfill \\textit{#2}\\\\
  \\textit{#3}\\\\[-4pt]
  \\begin{itemize}[leftmargin=1em, noitemsep, topsep=0pt]
    #4
  \\end{itemize}
}

\\newcommand{\\skillentry}[2]{%
  \\textbf{#1} {#2} \\\\
}

\\begin{document}

% ---------------- HEADER ----------------
{\\LARGE \\textbf{Teo Yong Ray}}\\\\[3pt]
${escapeLatex(resume.education.degree)}\\\\
\\href{mailto:${resume.links.email}}{${escapeLatex(resume.links.email)}} \\quad | \\quad ${escapeLatex(resume.links.phone)} \\quad | \\quad Singapore Citizen \\\\
\\href{${resume.links.portfolio}}{Portfolio} \\quad | \\quad \\href{${resume.links.github}}{Github} \\quad | \\quad \\href{${resume.links.linkedin}}{LinkedIn}\\\\[6pt]

% ---------------- SUMMARY ----------------
${escapeLatex(resume.summary)}\\\\[10pt]

% ---------------- EDUCATION ----------------
\\section*{Education}

\\textbf{${escapeLatex(resume.education.institution)}} \\hfill \\textit{${escapeLatex(resume.education.dates)}}\\\\
${escapeLatex(resume.education.degree)}\\\\
${resume.education.details.map(d => `• ${escapeLatex(d)}`).join('\\\\\n')}\\\\[6pt]

% ---------------- WORK EXPERIENCE ----------------
\\section*{Work Experience}
${resume.workExperience.map(exp => `
\\workentry
  { ${escapeLatex(exp.company)} }
  { ${escapeLatex(exp.dates)} }
  { ${escapeLatex(exp.role)} }
  {
    ${exp.bullets.map(b => `\\item ${escapeLatex(b)}`).join('\n    ')}
  }`).join('\n')}

\\newpage

% ---------------- NOTABLE PROJECTS ----------------
\\section*{Notable Projects (Refer to Portfolio for full list)}
${resume.projects.map(proj => `
\\projectentry
  { ${escapeLatex(proj.company)} }
  { ${escapeLatex(proj.dates)} }
  { ${escapeLatex(proj.minor_desc)} }
  {
    ${proj.bullets.map(b => `\\item ${escapeLatex(b)}`).join('\n    ')}
  }`).join('\n')}

% ---------------- SKILLS ----------------
\\section*{Skills}
${resume.skills.map(skill => `\\skillentry
    { ${escapeLatex(skill.title)}: } 
    { ${escapeLatex(skill.items)} }`).join('\n')}

\\textbf{Languages:} English, Mandarin\\\\

\\end{document}`;

  return latex;
};

/**
 * Generates a cover letter PDF
 * @param coverLetter - The cover letter text content
 * @param companyName - The company name for the cover letter
 * @param filename - The name of the output PDF file
 */
export const generateCoverLetterPDF = async (
  coverLetter: string,
  companyName: string,
  filename: string
): Promise<void> => {
  try {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const response = await fetch(`${API_BASE_URL}/generate-cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: dateString,
        company_name: companyName,
        body: coverLetter,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    // Get the PDF blob from the response
    const blob = await response.blob();

    // Create a download link and trigger it
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Failed to generate cover letter PDF:', error);
    throw new Error('Failed to generate cover letter PDF. Make sure the Flask server is running on port 5000.');
  }
};
