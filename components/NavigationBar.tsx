import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { FileIcon } from './icons/FileIcon';

type Tab = 'optimizer' | 'projects' | 'work-experience' | 'skills' | 'results';

interface NavigationBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const NavButton: React.FC<{
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ isActive, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
      ${isActive 
        ? 'bg-cyan-500 text-slate-900 shadow-md' 
        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
      }
    `}
  >
    {icon}
    {label}
  </button>
);

export const NavigationBar: React.FC<NavigationBarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex justify-center p-2 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg">
      <div className="flex items-center gap-2">
        <NavButton
          isActive={activeTab === 'optimizer'}
          onClick={() => setActiveTab('optimizer')}
          icon={<SparklesIcon className="w-5 h-5" />}
          label="Optimizer"
        />
        <NavButton
          isActive={activeTab === 'projects'}
          onClick={() => setActiveTab('projects')}
          icon={<BriefcaseIcon className="w-5 h-5" />}
          label="Projects"
        />
        <NavButton
          isActive={activeTab === 'work-experience'}
          onClick={() => setActiveTab('work-experience')}
          icon={<BriefcaseIcon className="w-5 h-5" />}
          label="Experience"
        />
        <NavButton
          isActive={activeTab === 'skills'}
          onClick={() => setActiveTab('skills')}
          icon={<SparklesIcon className="w-5 h-5" />}
          label="Skills"
        />
        <NavButton
          isActive={activeTab === 'results'}
          onClick={() => setActiveTab('results')}
          icon={<FileIcon className="w-5 h-5" />}
          label="Results"
        />
      </div>
    </nav>
  );
};
