import React, { useState, useMemo } from 'react';
import type { Project } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface ProjectSelectorModalProps {
  allProjects: Project[];
  selectedIds: string[];
  jobPosting: string;
  isAdviceLoading: boolean;
  adviceText: string | null;
  currentAdviceProjectId: string | null;
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
  onGetAdvice: (project: Project) => void;
}

const ProjectSelectItem: React.FC<{
  project: Project;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onGetAdvice: (project: Project) => void;
  isAdviceLoading: boolean;
  adviceText: string | null;
  currentAdviceProjectId: string | null;
}> = ({ project, isSelected, onToggle, onGetAdvice, isAdviceLoading, adviceText, currentAdviceProjectId }) => (
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
    <div className="mt-3">
       <button
        type="button"
        onClick={() => onGetAdvice(project)}
        disabled={(isAdviceLoading && currentAdviceProjectId === project.id)}
        className="text-xs font-semibold text-teal-400 hover:text-teal-300 disabled:opacity-50 disabled:cursor-wait"
      >
        {isAdviceLoading && currentAdviceProjectId === project.id ? 'Getting advice...' : 'Get Advice on this Project'}
      </button>
    </div>
    {currentAdviceProjectId === project.id && adviceText && (
      <div className="mt-3 p-3 text-xs bg-slate-900/70 border border-slate-700 rounded-md">
        <p className="font-bold text-slate-300 mb-1">Gemini's Advice:</p>
        <p className="text-slate-400 whitespace-pre-wrap">{adviceText}</p>
      </div>
    )}
  </li>
);

export const ProjectSelectorModal: React.FC<ProjectSelectorModalProps> = ({
  allProjects,
  selectedIds,
  jobPosting,
  onClose,
  onSave,
  onGetAdvice,
  isAdviceLoading,
  adviceText,
  currentAdviceProjectId
}) => {
  const [currentSelectedIds, setCurrentSelectedIds] = useState(selectedIds);
  const [searchTerm, setSearchTerm] = useState('');

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

        <div className="p-4">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500"
          />
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
                    onGetAdvice={onGetAdvice}
                    isAdviceLoading={isAdviceLoading}
                    adviceText={adviceText}
                    currentAdviceProjectId={currentAdviceProjectId}
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
