import React, { useState } from 'react';
import type { SavedResult, ResumeStructure } from '../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { generateAndDownloadDocx } from '../utils/fileUtils';
import { generateLatexPDF } from '../services/latexService';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { ResumeEditor } from './ResumeEditor';

interface ResultsViewerProps {
  results: SavedResult[];
  refreshResults: () => Promise<void>;
}

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

export const ResultsViewer: React.FC<ResultsViewerProps> = ({ results, refreshResults }) => {
  const [selectedResult, setSelectedResult] = useState<SavedResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resultToDelete, setResultToDelete] = useState<SavedResult | null>(null);
  const [editedResume, setEditedResume] = useState<ResumeStructure | null>(null);

  const handleResultSelect = (result: SavedResult) => {
    setSelectedResult(result);
    setEditedResume(result.resume);
  };

  const handleDelete = async (result: SavedResult) => {
    setResultToDelete(result);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!resultToDelete) return;
    
    try {
      const { deleteResult } = await import('../services/apiService');
      await deleteResult(resultToDelete.id);
      
      if (selectedResult?.id === resultToDelete.id) {
        setSelectedResult(null);
        setEditedResume(null);
      }
      
      await refreshResults();
      setDeleteModalOpen(false);
      setResultToDelete(null);
    } catch (error) {
      console.error('Failed to delete result:', error);
      alert('Failed to delete result. Please try again.');
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

  const handleDownloadDocx = async () => {
    if (!selectedResult || !editedResume) return;
    
    setIsDownloading(true);
    
    try {
      if (activeTab === 'resume') {
        const markdownContent = convertResumeToMarkdown(editedResume);
        await generateAndDownloadDocx(markdownContent, `${selectedResult.companyName}-Resume.docx`);
      } else {
        await generateAndDownloadDocx(selectedResult.coverLetter, `${selectedResult.companyName}-Cover-Letter.docx`);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedResult || !editedResume) return;
    
    setIsDownloading(true);
    
    try {
      if (activeTab === 'resume') {
        await generateLatexPDF(editedResume, `${selectedResult.companyName}-Resume.pdf`);
      } else {
        await generateAndDownloadDocx(selectedResult.coverLetter, `${selectedResult.companyName}-Cover-Letter.docx`);
      }
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Make sure the Flask server is running on port 5000.');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <DocumentIcon className="w-16 h-16 mx-auto text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-slate-400 mb-2">No Results Yet</h3>
        <p className="text-slate-500">
          Your optimized applications will appear here after you run the optimizer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Saved Results</h2>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {results.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedResult?.id === result.id
                    ? 'bg-cyan-500/20 border-cyan-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => handleResultSelect(result)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-200 truncate">
                      {result.jobTitle}
                    </h3>
                    <p className="text-sm text-cyan-400 truncate">{result.companyName}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(result);
                    }}
                    className="ml-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                    title="Delete result"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">{formatDate(result.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Result Viewer */}
        <div className="lg:col-span-2">
          {selectedResult ? (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-200">{selectedResult.jobTitle}</h2>
                <p className="text-cyan-400">{selectedResult.companyName}</p>
                <p className="text-sm text-slate-500 mt-1">
                  Created: {formatDate(selectedResult.createdAt)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <TabButton active={activeTab === 'resume'} onClick={() => setActiveTab('resume')}>
                    Resume
                  </TabButton>
                  <TabButton active={activeTab === 'coverLetter'} onClick={() => setActiveTab('coverLetter')}>
                    Cover Letter
                  </TabButton>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadDocx}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50"
                  >
                    <DocumentIcon className="w-5 h-5" />
                    {isDownloading ? 'Downloading...' : '.docx'}
                  </button>
                  {activeTab === 'resume' && editedResume && (
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isDownloading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-slate-900 rounded-lg font-semibold hover:bg-green-400 transition-colors disabled:opacity-50"
                    >
                      <DocumentIcon className="w-5 h-5" />
                      {isDownloading ? 'Generating...' : '.pdf (LaTeX)'}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 rounded-lg p-6 max-h-[500px] overflow-y-auto">
                {activeTab === 'resume' && editedResume ? (
                  <ResumeEditor resume={editedResume} onChange={setEditedResume} />
                ) : activeTab === 'coverLetter' ? (
                  <MarkdownRenderer content={selectedResult.coverLetter} />
                ) : null}
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-12 text-center">
              <DocumentIcon className="w-12 h-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">Select a result from the list to view details</p>
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen && resultToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setResultToDelete(null);
          }}
          onConfirm={confirmDelete}
          itemName={`${resultToDelete.jobTitle} at ${resultToDelete.companyName}`}
        />
      )}
    </div>
  );
};
