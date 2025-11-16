import React, { useState } from 'react';
import type { WorkExperience, ProjectEntry, SkillCategory } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { FileIcon } from './icons/FileIcon';

interface OptimizationPreviewProps {
  summary: string;
  workExperience: WorkExperience[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
  coverLetter: string;
  onSummaryChange: (summary: string) => void;
  onWorkExperienceChange: (workExperience: WorkExperience[]) => void;
  onProjectsChange: (projects: ProjectEntry[]) => void;
  onSkillsChange: (skills: SkillCategory[]) => void;
  onCoverLetterChange: (coverLetter: string) => void;
  onExportResume: () => void;
  onExportCoverLetter: () => void;
  isExportingResume: boolean;
  isExportingCoverLetter: boolean;
}

type ViewTab = 'resume' | 'cover-letter';

export const OptimizationPreview: React.FC<OptimizationPreviewProps> = ({
  summary,
  workExperience,
  projects,
  skills,
  coverLetter,
  onSummaryChange,
  onWorkExperienceChange,
  onProjectsChange,
  onSkillsChange,
  onCoverLetterChange,
  onExportResume,
  onExportCoverLetter,
  isExportingResume,
  isExportingCoverLetter,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('resume');
  const [editingSkillIndex, setEditingSkillIndex] = useState<number | null>(null);

  const handleBulletChange = (type: 'work' | 'project', index: number, bulletIndex: number, newValue: string) => {
    if (type === 'work') {
      const updated = [...workExperience];
      updated[index].bullets[bulletIndex] = newValue;
      onWorkExperienceChange(updated);
    } else {
      const updated = [...projects];
      updated[index].bullets[bulletIndex] = newValue;
      onProjectsChange(updated);
    }
  };

  const handleSkillCategoryChange = (index: number, field: 'title' | 'items', value: string) => {
    const updated = [...skills];
    updated[index][field] = value;
    onSkillsChange(updated);
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('resume')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'resume'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Resume Preview
        </button>
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'cover-letter'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Cover Letter
        </button>
      </div>

      {/* Resume Preview */}
      {activeTab === 'resume' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 space-y-8">
          {/* Summary Section */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <PencilIcon className="w-5 h-5" />
              Professional Summary
            </h3>
            <textarea
              value={summary}
              onChange={(e) => onSummaryChange(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
              rows={3}
            />
            <p className="text-xs text-slate-500 mt-1">Edit the summary to fine-tune your introduction</p>
          </div>

          {/* Work Experience Section */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Work Experience</h3>
            {workExperience.map((exp, expIndex) => (
              <div key={expIndex} className="mb-6 pb-6 border-b border-slate-700 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg text-slate-200">{exp.company}</p>
                    <p className="text-slate-400 italic">{exp.role}</p>
                  </div>
                  <p className="text-slate-400 text-sm">{exp.dates}</p>
                </div>
                <ul className="space-y-2 mt-3">
                  {exp.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <textarea
                        value={bullet}
                        onChange={(e) => handleBulletChange('work', expIndex, bulletIndex, e.target.value)}
                        className="flex-1 p-2 bg-slate-900/50 border border-slate-700 rounded text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                        rows={2}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Projects Section */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Notable Projects</h3>
            {projects.map((proj, projIndex) => (
              <div key={projIndex} className="mb-6 pb-6 border-b border-slate-700 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-slate-200">{proj.company}</p>
                    <textarea
                      value={proj.minor_desc}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[projIndex].minor_desc = e.target.value;
                        onProjectsChange(updated);
                      }}
                      className="w-full mt-1 p-2 bg-slate-900/50 border border-slate-700 rounded text-sm italic text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                      rows={1}
                    />
                  </div>
                  <p className="text-slate-400 text-sm ml-4">{proj.dates}</p>
                </div>
                <ul className="space-y-2 mt-3">
                  {proj.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <textarea
                        value={bullet}
                        onChange={(e) => handleBulletChange('project', projIndex, bulletIndex, e.target.value)}
                        className="flex-1 p-2 bg-slate-900/50 border border-slate-700 rounded text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                        rows={2}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Skills Section */}
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <PencilIcon className="w-5 h-5" />
              Technical Skills (Click to Edit Categories)
            </h3>
            <div className="space-y-3">
              {skills.map((skillCat, index) => (
                <div key={index} className="flex items-start gap-3">
                  {editingSkillIndex === index ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={skillCat.title}
                        onChange={(e) => handleSkillCategoryChange(index, 'title', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-cyan-500 rounded font-semibold text-slate-200 focus:ring-2 focus:ring-cyan-500"
                        placeholder="Category name"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={skillCat.items}
                        onChange={(e) => handleSkillCategoryChange(index, 'items', e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-cyan-500 rounded text-slate-300 focus:ring-2 focus:ring-cyan-500"
                        placeholder="Comma-separated skills"
                      />
                      <button
                        onClick={() => setEditingSkillIndex(null)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        Done Editing
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingSkillIndex(index)}
                      className="flex-1 p-3 bg-slate-900/50 border border-slate-700 rounded hover:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-slate-200">{skillCat.title}:</p>
                      <p className="text-slate-300 text-sm">{skillCat.items}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">Click any skill category to edit the title or reorder skills</p>
          </div>

          {/* Export Resume Button */}
          <div className="pt-6 border-t border-slate-700">
            <button
              onClick={onExportResume}
              disabled={isExportingResume}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-lg shadow-lg hover:from-cyan-300 hover:to-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FileIcon className="w-6 h-6" />
              {isExportingResume ? 'Generating PDF...' : 'Export Resume as PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Cover Letter Preview */}
      {activeTab === 'cover-letter' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
              <PencilIcon className="w-5 h-5" />
              Cover Letter
            </h3>
            <textarea
              value={coverLetter}
              onChange={(e) => onCoverLetterChange(e.target.value)}
              className="w-full p-4 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors font-mono text-sm leading-relaxed resize-none"
              rows={20}
            />
            <p className="text-xs text-slate-500 mt-1">Edit the cover letter to personalize it further</p>
          </div>

          {/* Export Cover Letter Button */}
          <div className="pt-6 border-t border-slate-700">
            <button
              onClick={onExportCoverLetter}
              disabled={isExportingCoverLetter}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-lg shadow-lg hover:from-cyan-300 hover:to-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FileIcon className="w-6 h-6" />
              {isExportingCoverLetter ? 'Generating PDF...' : 'Export Cover Letter as PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
