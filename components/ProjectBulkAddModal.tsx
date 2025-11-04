import React, { useState } from 'react';
import type { Project } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddProjects: (projects: Omit<Project, 'id'>[]) => void;
  isLoading: boolean;
}

const parseProjects = (text: string): Omit<Project, 'id'>[] => {
    const projects: Omit<Project, 'id'>[] = [];
    const projectBlocks = text.trim().split(/\n\s*\n/);

    projectBlocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length === 0) return;

        const firstLine = lines.shift() || '';
        const yearMatch = firstLine.match(/\s+(\d{4})$/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
        const title = yearMatch ? firstLine.substring(0, yearMatch.index).trim() : firstLine.trim();
        
        const subtitle = lines.length > 0 && !lines[0].trim().startsWith('-') && !lines[0].trim().startsWith('*') ? (lines.shift() || '').trim() : '';
        const description = lines.map(line => line.trim().replace(/^-|^\*/, '').trim()).filter(Boolean);

        if (title) {
            projects.push({
                title,
                year,
                subtitle,
                description,
            });
        }
    });

    return projects;
};


export const ProjectBulkAddModal: React.FC<Props> = ({ isOpen, onClose, onAddProjects, isLoading }) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = async () => {
    setError(null);
    const projects = parseProjects(text);
    if (projects.length > 0) {
      try {
        await onAddProjects(projects);
        setText('');
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      }
    } else {
      setError("No projects were found in the text. Please check the formatting.");
    }
  };

  const handleClose = () => {
    setError(null);
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6 w-full max-w-2xl text-slate-200">
        <h2 className="text-xl font-bold mb-4">Add Projects in Bulk</h2>
        <p className="mb-4 text-sm text-slate-400">
          Paste your projects below. Separate each project with a blank line. The first line of each project should be the project name and year.
        </p>
        <textarea
          className="w-full h-64 p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 transition-colors placeholder:text-slate-500"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`DATA ANALYSIS ON SMU STUDENTS\t\t2025\nCustomer journey analysis and dashboarding\n\n- Conducted comprehensive customer journey analysis...\n- Integrated external datasets...`}
        />
        {error && <p className="mt-4 text-sm text-red-400 bg-red-900/20 p-3 rounded-md">{error}</p>}
        <div className="mt-4 flex justify-end space-x-2">
          <button onClick={handleClose} className="px-4 py-2 rounded text-slate-300 border border-slate-600 hover:bg-slate-700 transition-colors" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleAdd} className="px-4 py-2 rounded bg-cyan-600 text-white hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed" disabled={isLoading}>
            {isLoading ? 'Adding...' : `Add ${parseProjects(text).length} Projects`}
          </button>
        </div>
      </div>
    </div>
  );
};
