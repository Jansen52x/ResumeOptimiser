import React, { useState } from 'react';
import type { Skill } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import { XMarkIcon } from './icons/XMarkIcon';

interface SkillsManagerProps {
  skills: Skill[];
  onUpdate: () => Promise<void>;
}

export const SkillsManager: React.FC<SkillsManagerProps> = ({ skills, onUpdate }) => {
  const [bulkInput, setBulkInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkAdd = async () => {
    if (!bulkInput.trim()) return;

    setIsUpdating(true);
    try {
      // Parse comma-separated skills
      const newSkills = bulkInput
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      if (newSkills.length === 0) {
        alert('Please enter at least one skill');
        return;
      }

      // Merge with existing skills (avoid duplicates)
      const existingSkillNames = skills.map(s => s.skill_name.toLowerCase());
      const uniqueNewSkills = newSkills.filter(
        s => !existingSkillNames.includes(s.toLowerCase())
      );

      const allSkillNames = [...skills.map(s => s.skill_name), ...uniqueNewSkills];

      const { updateAllSkills } = await import('../services/apiService');
      await updateAllSkills(allSkillNames);
      await onUpdate();
      setBulkInput('');
    } catch (error) {
      console.error('Failed to add skills:', error);
      alert('Failed to add skills');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveSkill = async (id: string) => {
    try {
      const { deleteSkill } = await import('../services/apiService');
      await deleteSkill(id);
      await onUpdate();
    } catch (error) {
      console.error('Failed to delete skill:', error);
      alert('Failed to delete skill');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to remove all skills?')) return;

    try {
      const { updateAllSkills } = await import('../services/apiService');
      await updateAllSkills([]);
      await onUpdate();
    } catch (error) {
      console.error('Failed to clear skills:', error);
      alert('Failed to clear skills');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-100">Skills</h2>
        {skills.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Bulk Input */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-cyan-400" />
          Add Skills
        </h3>
        <p className="text-sm text-slate-400 mb-4">
          Enter skills separated by commas. For example: Python, React, TypeScript, SQL
        </p>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[120px] font-mono text-sm"
          placeholder="Python, React, TypeScript, SQL, Docker, AWS..."
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handleBulkAdd}
            disabled={isUpdating || !bulkInput.trim()}
            className="px-6 py-2 bg-cyan-500 text-slate-900 rounded-lg font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Adding...' : 'Add Skills'}
          </button>
        </div>
      </div>

      {/* Skills Display */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">
          Your Skills ({skills.length})
        </h3>
        {skills.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No skills added yet. Use the form above to add your skills.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="group flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-full text-sm hover:bg-cyan-500/30 transition-colors"
              >
                <span>{skill.skill_name}</span>
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  title="Remove skill"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-200/80 space-y-1">
          <li>• Add all your technical skills here - the AI will categorize them during optimization</li>
          <li>• Include programming languages, frameworks, tools, and technologies</li>
          <li>• Don't worry about organization - AI will group them intelligently</li>
        </ul>
      </div>
    </div>
  );
};
