import React, { useState } from 'react';
import type { Project } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';

interface ProjectEditModalProps {
  project: Project;
  onClose: () => void;
  onSave: (updatedProject: Project) => void;
}

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({ project, onClose, onSave }) => {
  const [title, setTitle] = useState(project.title);
  const [year, setYear] = useState(project.year.toString());
  const [subtitle, setSubtitle] = useState(project.subtitle);
  const [description, setDescription] = useState(project.description.join('\n'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProject: Project = {
      ...project,
      title,
      year: parseInt(year, 10),
      subtitle,
      description: description.split('\n').filter(line => line.trim() !== ''),
    };
    onSave(updatedProject);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-100">Edit Project</h2>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto p-6 space-y-4">
          <div>
            <label htmlFor="edit-title" className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="edit-year" className="block text-sm font-medium text-slate-300 mb-1">Year</label>
              <input
                id="edit-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="edit-subtitle" className="block text-sm font-medium text-slate-300 mb-1">Subtitle</label>
              <input
                id="edit-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <p className="text-xs text-slate-500 mb-2">Enter each bullet point on a new line.</p>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>
        </div>

        <footer className="p-4 border-t border-slate-700 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-slate-900 bg-cyan-400 rounded-md hover:bg-cyan-300"
          >
            Save Changes
          </button>
        </footer>
      </form>
    </div>
  );
};