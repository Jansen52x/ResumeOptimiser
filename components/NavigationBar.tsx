import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { DocumentIcon } from './icons/DocumentIcon';

type Tab = 'optimizer' | 'projects' | 'documents';

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
          isActive={activeTab === 'documents'}
          onClick={() => setActiveTab('documents')}
          icon={<DocumentIcon className="w-5 h-5" />}
          label="My Documents"
        />
      </div>
    </nav>
  );
};
