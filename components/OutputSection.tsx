
import React, { useState } from 'react';
import type { OptimizedResult, ResumeStructure } from '../types';
import { generateAndDownloadDocx } from '../utils/fileUtils';
import { generateLatexPDF } from '../services/latexService';
import { DocumentIcon } from './icons/DocumentIcon';
import { ResumeEditor } from './ResumeEditor';

type Tab = 'resume' | 'coverLetter';

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            active
                ? 'bg-cyan-500 text-slate-900'
                : 'text-slate-300 hover:bg-slate-700'
        }`}
    >
        {children}
    </button>
);


const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Basic markdown to HTML conversion for display
    const htmlContent = content
        .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-cyan-400 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-100 mt-6 mb-3 border-b border-slate-700 pb-2">$1</h2>')
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-white mt-8 mb-4">$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/(\n<li>.*<\/li>)/gs, '<ul>$1\n</ul>')
        .replace(/\n/g, '<br />')
        .replace(/<br \/><ul>/g, '<ul>')
        .replace(/<\/ul><br \/>/g, '</ul>');


    return <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export const OutputSection: React.FC<{ result: OptimizedResult }> = ({ result }) => {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [isDownloading, setIsDownloading] = useState(false);
  const [editedResume, setEditedResume] = useState<ResumeStructure>(result.resume);

  const handleDownloadDocx = async () => {
    setIsDownloading(true);
    
    try {
        if (activeTab === 'resume') {
            // Convert structured resume to markdown for .docx export
            const markdownContent = convertResumeToMarkdown(editedResume);
            await generateAndDownloadDocx(markdownContent, 'Optimized-Resume.docx');
        } else {
            await generateAndDownloadDocx(result.coverLetter, 'Generated-Cover-Letter.docx');
        }
    } catch (error) {
        console.error("Failed to generate DOCX:", error);
        alert("Sorry, there was an error generating the Word document.");
    } finally {
        setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
        if (activeTab === 'resume') {
            await generateLatexPDF(editedResume, 'Optimized-Resume.pdf');
        } else {
            // For cover letter, we'll still use docx
            await generateAndDownloadDocx(result.coverLetter, 'Generated-Cover-Letter.docx');
        }
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Make sure the Flask server is running on port 5000.");
    } finally {
        setIsDownloading(false);
    }
  };

  const convertResumeToMarkdown = (resume: ResumeStructure): string => {
    let md = `# ${resume.links.email}\n\n`;
    md += `**Phone:** ${resume.links.phone} | **Portfolio:** ${resume.links.portfolio}\n`;
    md += `**GitHub:** ${resume.links.github} | **LinkedIn:** ${resume.links.linkedin}\n\n`;
    md += `## Professional Summary\n\n${resume.summary}\n\n`;
    
    md += `## Education\n\n`;
    md += `**${resume.education.institution}** - ${resume.education.dates}\n\n`;
    md += `${resume.education.degree}\n\n`;
    resume.education.details.forEach(d => md += `- ${d}\n`);
    md += `\n`;
    
    md += `## Work Experience\n\n`;
    resume.workExperience.forEach(exp => {
      md += `### ${exp.company} - ${exp.dates}\n\n`;
      md += `*${exp.role}*\n\n`;
      exp.bullets.forEach(b => md += `- ${b}\n`);
      md += `\n`;
    });
    
    md += `## Notable Projects\n\n`;
    resume.projects.forEach(proj => {
      md += `### ${proj.company} - ${proj.dates}\n\n`;
      md += `*${proj.minor_desc}*\n\n`;
      proj.bullets.forEach(b => md += `- ${b}\n`);
      md += `\n`;
    });
    
    md += `## Technical Skills\n\n`;
    resume.skills.forEach(skill => {
      md += `**${skill.title}:** ${skill.items}\n\n`;
    });
    
    return md;
  };

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-center mb-6 text-slate-100">Your Optimized Application</h2>
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl shadow-slate-950/50 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
          <div className="flex space-x-2">
            <TabButton active={activeTab === 'resume'} onClick={() => setActiveTab('resume')}>
              Optimized Resume
            </TabButton>
            <TabButton active={activeTab === 'coverLetter'} onClick={() => setActiveTab('coverLetter')}>
              Generated Cover Letter
            </TabButton>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadDocx}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 bg-cyan-400 rounded-md hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-wait"
            >
              <DocumentIcon className="w-4 h-4" />
              {isDownloading ? 'Downloading...' : '.docx'}
            </button>
            {activeTab === 'resume' && (
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 bg-green-400 rounded-md hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                <DocumentIcon className="w-4 h-4" />
                {isDownloading ? 'Generating...' : '.pdf (LaTeX)'}
              </button>
            )}
          </div>
        </div>
        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto">
            {activeTab === 'resume' && <ResumeEditor resume={editedResume} onChange={setEditedResume} />}
            {activeTab === 'coverLetter' && <MarkdownRenderer content={result.coverLetter} />}
        </div>
      </div>
    </div>
  );
};
