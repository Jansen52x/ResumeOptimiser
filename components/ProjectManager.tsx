import React, { useState } from 'react';
import type { Project } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { formatNewProject } from '../services/geminiService';
import * as apiService from '../services/apiService';
import { ProjectEditModal } from './ProjectEditModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { ProjectBulkAddModal } from './ProjectBulkAddModal';
import { PlusIcon } from './icons/PlusIcon';

interface ProjectManagerProps {
  projects: Project[];
  refreshProjects: () => Promise<void>;
}

const ProjectCard: React.FC<{
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}> = ({ project, onEdit, onDelete }) => (
  <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-cyan-400">{project.title} <span className="text-slate-400 font-normal text-sm">- {project.year}</span></h3>
        <p className="text-sm font-semibold text-slate-300 mt-1">{project.subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
        <button onClick={() => onEdit(project)} className="text-slate-500 hover:text-cyan-400 transition-colors p-1" aria-label={`Edit ${project.title}`}>
          <PencilIcon className="w-5 h-5" />
        </button>
        <button onClick={() => onDelete(project.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1" aria-label={`Delete ${project.title}`}>
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
    <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-slate-400">
      {Array.isArray(project.description) ? project.description.map((item, index) => <li key={index}>{item}</li>) : <li>{project.description}</li>}
    </ul>
  </div>
);

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, refreshProjects }) => {
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const handleFormatWithAI = async () => {
    if (!rawText) return;
    setIsLoading(true);
    setError(null);
    try {
      const formattedProject = await formatNewProject(rawText, projects);
      await apiService.addProject(formattedProject);
      setRawText('');
      await refreshProjects();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProjectsInBulk = async (newProjects: Omit<Project, 'id'>[]) => {
    setIsLoading(true);
    setError(null);
    try {
      for (const project of newProjects) {
        // The Gemini service formats, so we just add directly
        await apiService.addProject(project);
      }
      await refreshProjects();
      setIsBulkModalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred while bulk adding.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = (project: Project) => {
    setProjectToEdit(project);
  };
  
  const handleUpdateProject = async (updatedProject: Project) => {
    await apiService.updateProject(updatedProject);
    setProjectToEdit(null);
    await refreshProjects();
  };

  const handleOpenDeleteModal = (id: string) => {
    setProjectToDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (projectToDeleteId) {
      await apiService.deleteProject(projectToDeleteId);
      setProjectToDeleteId(null);
      await refreshProjects();
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">Your Projects</h2>
          <div className="space-y-4">
            {projects.length > 0 ? (
              projects.map(p => <ProjectCard key={p.id} project={p} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} />)
            ) : (
              <p className="text-center text-slate-500 py-8">You haven't added any projects yet.</p>
            )}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-100">Add New Project</h2>
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-cyan-400 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Bulk Add
            </button>
          </div>
          <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700 space-y-4">
              <div>
                  <label htmlFor="raw-project-text" className="block text-sm font-medium text-slate-300 mb-2">Paste your raw project notes here:</label>
                  <textarea
                      id="raw-project-text"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      rows={10}
                      className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder:text-slate-500"
                      placeholder="e.g., Led the SMU data analysis project in 2025. We mapped the student journey, found pain points, and made dashboards in Tableau to show our findings."
                  />
              </div>
             {error && <p className="text-sm text-red-400">{error}</p>}
            <button
                onClick={handleFormatWithAI}
                disabled={isLoading || !rawText}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-lg shadow-md hover:from-cyan-300 hover:to-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-t-slate-900 border-r-slate-900 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                        Formatting...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="w-5 h-5" />
                        Format with AI
                    </>
                )}
            </button>
        </div>
        </div>
      </div>

      {projectToEdit && (
        <ProjectEditModal
          project={projectToEdit}
          onClose={() => setProjectToEdit(null)}
          onSave={handleUpdateProject}
        />
      )}

      <ProjectBulkAddModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onAddProjects={handleAddProjectsInBulk}
        isLoading={isLoading}
      />

      <DeleteConfirmationModal
        isOpen={!!projectToDeleteId}
        onClose={() => setProjectToDeleteId(null)}
        onConfirm={handleConfirmDelete}
        itemName={projects.find(p => p.id === projectToDeleteId)?.title || 'this project'}
      />
    </>
  );
};