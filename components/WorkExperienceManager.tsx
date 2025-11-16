import React, { useState } from 'react';
import type { WorkExperience } from '../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { TrashIcon } from './icons/TrashIcon';
import { PencilIcon } from './icons/PencilIcon';
import { PlusIcon } from './icons/PlusIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';

interface WorkExperienceManagerProps {
  experiences: WorkExperience[];
  onUpdate: () => Promise<void>;
}

export const WorkExperienceManager: React.FC<WorkExperienceManagerProps> = ({ experiences, onUpdate }) => {
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ company: '', role: '', dates: '', bullets: [''] });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<WorkExperience | null>(null);

  const resetForm = () => {
    setFormData({ company: '', role: '', dates: '', bullets: [''] });
    setEditingExperience(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({ company: '', role: '', dates: '', bullets: [''] });
  };

  const handleEdit = (experience: WorkExperience) => {
    setEditingExperience(experience);
    setFormData({
      company: experience.company,
      role: experience.role,
      dates: experience.dates,
      bullets: [...experience.bullets]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const experienceData = {
      company: formData.company.trim(),
      role: formData.role.trim(),
      dates: formData.dates.trim(),
      bullets: formData.bullets.filter(b => b.trim()).map(b => b.trim())
    };

    if (!experienceData.company || !experienceData.role || !experienceData.dates || experienceData.bullets.length === 0) {
      alert('Please fill in all fields and add at least one bullet point');
      return;
    }

    try {
      if (editingExperience) {
        const { updateWorkExperience } = await import('../services/apiService');
        await updateWorkExperience({ ...experienceData, id: editingExperience.id });
      } else {
        const { addWorkExperience } = await import('../services/apiService');
        await addWorkExperience(experienceData);
      }
      await onUpdate();
      resetForm();
    } catch (error) {
      console.error('Failed to save work experience:', error);
      alert('Failed to save work experience');
    }
  };

  const handleDelete = async () => {
    if (!experienceToDelete) return;

    try {
      const { deleteWorkExperience } = await import('../services/apiService');
      await deleteWorkExperience(experienceToDelete.id);
      await onUpdate();
      setDeleteModalOpen(false);
      setExperienceToDelete(null);
    } catch (error) {
      console.error('Failed to delete work experience:', error);
      alert('Failed to delete work experience');
    }
  };

  const addBullet = () => {
    setFormData({ ...formData, bullets: [...formData.bullets, ''] });
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...formData.bullets];
    newBullets[index] = value;
    setFormData({ ...formData, bullets: newBullets });
  };

  const removeBullet = (index: number) => {
    if (formData.bullets.length > 1) {
      setFormData({ ...formData, bullets: formData.bullets.filter((_, i) => i !== index) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-100">Work Experience</h2>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Experience
        </button>
      </div>

      {/* Form */}
      {(isCreating || editingExperience) && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
          <h3 className="text-xl font-semibold text-slate-200 mb-4">
            {editingExperience ? 'Edit Work Experience' : 'Add New Work Experience'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., Google"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Dates</label>
              <input
                type="text"
                value={formData.dates}
                onChange={(e) => setFormData({ ...formData, dates: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g., Jan 2022 - Present"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Responsibilities & Achievements</label>
              {formData.bullets.map((bullet, index) => (
                <div key={index} className="flex items-start gap-2 mb-2">
                  <textarea
                    value={bullet}
                    onChange={(e) => updateBullet(index, e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="Describe your responsibilities and achievements..."
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={() => removeBullet(index)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                    disabled={formData.bullets.length === 1}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addBullet}
                className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mt-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add bullet point
              </button>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
              >
                {editingExperience ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Experience List */}
      <div className="grid grid-cols-1 gap-4">
        {experiences.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700">
            <BriefcaseIcon className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No Work Experience Yet</h3>
            <p className="text-slate-500 mb-4">Add your work experience to get started</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Your First Experience
            </button>
          </div>
        ) : (
          experiences.map((experience) => (
            <div
              key={experience.id}
              className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-slate-100">{experience.company}</h3>
                  <p className="text-cyan-400 font-medium">{experience.role}</p>
                  <p className="text-sm text-slate-500 mt-1">{experience.dates}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(experience)}
                    className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
                    title="Edit experience"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setExperienceToDelete(experience);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                    title="Delete experience"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {experience.bullets.map((bullet, index) => (
                  <li key={index} className="text-slate-300 flex items-start gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {deleteModalOpen && experienceToDelete && (
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setExperienceToDelete(null);
          }}
          onConfirm={handleDelete}
          itemName={`${experienceToDelete.role} at ${experienceToDelete.company}`}
        />
      )}
    </div>
  );
};
