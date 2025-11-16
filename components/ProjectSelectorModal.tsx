import React, { useState, useMemo } from 'react';
import type { Project } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ProjectSelectorModalProps {
  allProjects: Project[];
  selectedIds: string[];
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
  onSuggestProjects: () => void;
  isSuggestingProjects: boolean;
  hasJobPosting: boolean;
}

const ProjectSelectItem: React.FC<{
  project: Project;
  isSelected: boolean;
  onToggle: (id: string) => void;
}> = ({ project, isSelected, onToggle }) => (
  <li className="p-4 bg-slate-800 rounded-lg border border-slate-700 transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-bold text-cyan-400">{project.title}</h4>
        <p className="text-sm text-slate-400">{project.subtitle}</p>
      </div>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(project.id)}
        className="form-checkbox h-5 w-5 bg-slate-900 border-slate-600 text-cyan-500 rounded focus:ring-cyan-500 cursor-pointer flex-shrink-0 ml-4"
      />
    </div>
  </li>
);

export const ProjectSelectorModal: React.FC<ProjectSelectorModalProps> = ({
  allProjects,
  selectedIds,
  onClose,
  onSave,
  onSuggestProjects,
  isSuggestingProjects,
  hasJobPosting
}) => {
  const [currentSelectedIds, setCurrentSelectedIds] = useState(selectedIds);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with parent when selectedIds change (for AI suggestions)
  React.useEffect(() => {
    setCurrentSelectedIds(selectedIds);
  }, [selectedIds]);

  const handleToggle = (id: string) => {
    setCurrentSelectedIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return allProjects;
    return allProjects.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProjects, searchTerm]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Select Projects</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="button"
              onClick={onSuggestProjects}
              disabled={!hasJobPosting || isSuggestingProjects}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-md hover:from-cyan-500 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={!hasJobPosting ? "Add a job posting first" : "Let AI suggest relevant projects"}
            >
              <SparklesIcon className="w-4 h-4" />
              {isSuggestingProjects ? 'Suggesting...' : 'Suggest Projects'}
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {filteredProjects.length > 0 ? (
            <ul className="space-y-4">
              {filteredProjects.map(p => (
                <ProjectSelectItem
                    key={p.id}
                    project={p}
                    isSelected={currentSelectedIds.includes(p.id)}
                    onToggle={handleToggle}
                />
              ))}
            </ul>
          ) : (
            <p className="text-center text-slate-500 py-8">No projects match your search.</p>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(currentSelectedIds)}
            className="px-4 py-2 text-sm font-semibold text-slate-900 bg-cyan-400 rounded-md hover:bg-cyan-300"
          >
            Save Selections ({currentSelectedIds.length})
          </button>
        </footer>
      </div>
    </div>
  );
};