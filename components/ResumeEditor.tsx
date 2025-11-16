import React, { useState } from 'react';
import type { ResumeStructure, WorkExperience, ProjectEntry, SkillCategory } from '../types';
import { PencilIcon } from './icons/PencilIcon';

interface ResumeEditorProps {
  resume: ResumeStructure;
  onChange: (resume: ResumeStructure) => void;
}

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <h3 className="text-xl font-bold text-slate-100 mt-6 mb-3 border-b border-slate-700 pb-2">
    {title}
  </h3>
);

const EditableField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  label?: string;
}> = ({ value, onChange, multiline, placeholder, label }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="group relative cursor-pointer hover:bg-slate-800/50 rounded p-2 -m-2 transition-colors"
      >
        {label && <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>}
        <div className="flex items-start gap-2">
          <span className={`flex-1 ${!value ? 'text-slate-500 italic' : ''}`}>
            {value || placeholder || 'Click to edit'}
          </span>
          <PencilIcon className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          rows={3}
          className="w-full bg-slate-900 text-slate-200 border border-cyan-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder={placeholder}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setIsEditing(false)}
          autoFocus
          className="w-full bg-slate-900 text-slate-200 border border-cyan-500 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

const BulletList: React.FC<{
  items: string[];
  onChange: (items: string[]) => void;
}> = ({ items, onChange }) => {
  const updateBullet = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onChange(newItems);
  };

  const addBullet = () => {
    onChange([...items, '']);
  };

  const removeBullet = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <ul className="space-y-2 ml-4">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-slate-500 mt-2">•</span>
          <EditableField
            value={item}
            onChange={(value) => updateBullet(index, value)}
            multiline
            placeholder="Add bullet point..."
          />
          <button
            onClick={() => removeBullet(index)}
            className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
          >
            ✕
          </button>
        </li>
      ))}
      <li>
        <button
          onClick={addBullet}
          className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
        >
          + Add bullet point
        </button>
      </li>
    </ul>
  );
};

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ resume, onChange }) => {
  const updateSummary = (summary: string) => {
    onChange({ ...resume, summary });
  };

  const updateWorkExperience = (index: number, exp: WorkExperience) => {
    const newWorkExperience = [...resume.workExperience];
    newWorkExperience[index] = exp;
    onChange({ ...resume, workExperience: newWorkExperience });
  };

  const updateProject = (index: number, proj: ProjectEntry) => {
    const newProjects = [...resume.projects];
    newProjects[index] = proj;
    onChange({ ...resume, projects: newProjects });
  };

  const updateSkills = (skills: SkillCategory[]) => {
    onChange({ ...resume, skills });
  };

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div>
        <SectionHeader title="Professional Summary" />
        <EditableField
          value={resume.summary}
          onChange={updateSummary}
          multiline
          placeholder="Add a professional summary..."
        />
      </div>

      {/* Education Section (Read-only as per requirements) */}
      <div>
        <SectionHeader title="Education" />
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-slate-200">{resume.education.institution}</p>
              <p className="text-slate-400">{resume.education.degree}</p>
            </div>
            <p className="text-slate-500 italic">{resume.education.dates}</p>
          </div>
          <ul className="list-disc ml-4 text-slate-300 space-y-1">
            {resume.education.details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-500 mt-2 italic">
            ⓘ Education section is preserved as-is and cannot be edited
          </p>
        </div>
      </div>

      {/* Work Experience Section */}
      <div>
        <SectionHeader title="Work Experience" />
        <div className="space-y-4">
          {resume.workExperience.map((exp, index) => (
            <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-slate-200">{exp.company}</p>
                  <p className="text-slate-400 italic">{exp.role}</p>
                </div>
                <p className="text-slate-500 italic">{exp.dates}</p>
              </div>
              <p className="text-xs text-slate-500 mb-2 italic">
                ⓘ Company, role, and dates are preserved. Only bullet points can be edited.
              </p>
              <BulletList
                items={exp.bullets}
                onChange={(bullets) => updateWorkExperience(index, { ...exp, bullets })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div>
        <SectionHeader title="Notable Projects" />
        <div className="space-y-4">
          {resume.projects.map((proj, index) => (
            <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-slate-200">{proj.company}</p>
                <p className="text-slate-500 italic">{proj.dates}</p>
              </div>
              <EditableField
                value={proj.minor_desc}
                onChange={(minor_desc) => updateProject(index, { ...proj, minor_desc })}
                placeholder="Project subtitle..."
                label="Subtitle"
              />
              <div className="mt-2">
                <BulletList
                  items={proj.bullets}
                  onChange={(bullets) => updateProject(index, { ...proj, bullets })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <SectionHeader title="Technical Skills" />
        <div className="space-y-3">
          {resume.skills.map((skill, index) => (
            <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-cyan-400 whitespace-nowrap">{skill.title}:</span>
                <EditableField
                  value={skill.items}
                  onChange={(items) => {
                    const newSkills = [...resume.skills];
                    newSkills[index] = { ...skill, items };
                    updateSkills(newSkills);
                  }}
                  placeholder="Add skills..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information (Read-only) */}
      <div>
        <SectionHeader title="Contact Information" />
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700 space-y-2">
          <p className="text-slate-300"><span className="font-semibold">Email:</span> {resume.links.email}</p>
          <p className="text-slate-300"><span className="font-semibold">Phone:</span> {resume.links.phone}</p>
          <p className="text-slate-300"><span className="font-semibold">Portfolio:</span> {resume.links.portfolio}</p>
          <p className="text-slate-300"><span className="font-semibold">GitHub:</span> {resume.links.github}</p>
          <p className="text-slate-300"><span className="font-semibold">LinkedIn:</span> {resume.links.linkedin}</p>
          <p className="text-xs text-slate-500 mt-2 italic">
            ⓘ Contact information is preserved as-is and cannot be edited
          </p>
        </div>
      </div>
    </div>
  );
};
