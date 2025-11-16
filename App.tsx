import React, { useState, useEffect, useCallback } from 'react';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { NavigationBar } from './components/NavigationBar';
import { Optimizer } from './components/Optimizer';
import { ProjectManager } from './components/ProjectManager';
import { WorkExperienceManager } from './components/WorkExperienceManager';
import { SkillsManager } from './components/SkillsManager';
import { ResultsViewer } from './components/ResultsViewer';
import * as apiService from './services/apiService';
import type { Project, WorkExperience, Skill, SavedResult } from './types';

type Tab = 'optimizer' | 'projects' | 'work-experience' | 'skills' | 'results';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('optimizer');
  const [projects, setProjects] = useState<Project[]>([]);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [results, setResults] = useState<SavedResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const projectsData = await apiService.getProjects();
      setProjects(projectsData);
    } catch (err) {
      setError('Failed to load projects.');
      console.error(err);
    }
  }, []);

  const fetchWorkExperiences = useCallback(async () => {
    try {
      const experiencesData = await apiService.getWorkExperiences();
      setWorkExperiences(experiencesData);
    } catch (err) {
      setError('Failed to load work experiences.');
      console.error(err);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const skillsData = await apiService.getSkills();
      setSkills(skillsData);
    } catch (err) {
      setError('Failed to load skills.');
      console.error(err);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const resultsData = await apiService.getResults();
      setResults(resultsData);
    } catch (err) {
      setError('Failed to load results.');
      console.error(err);
    }
  }, []);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        fetchProjects(),
        fetchWorkExperiences(),
        fetchSkills(),
        fetchResults()
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchProjects, fetchWorkExperiences, fetchSkills, fetchResults]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-300 font-semibold">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
                <h3 className="font-bold">Error</h3>
                <p>{error}</p>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-4 mb-2">
            <SparklesIcon className="w-10 h-10 text-cyan-400" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
              Gemini Resume Optimizer
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Your personal AI-powered career toolkit. Tailor applications, manage projects, and build your document library.
          </p>
        </header>

        <div className="max-w-6xl mx-auto">
          <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
          
          <div className="mt-8">
            {activeTab === 'optimizer' && <Optimizer allProjects={projects} allWorkExperiences={workExperiences} allSkills={skills} onOptimizationComplete={fetchResults} />}
            {activeTab === 'projects' && <ProjectManager projects={projects} refreshProjects={fetchProjects} />}
            {activeTab === 'work-experience' && <WorkExperienceManager experiences={workExperiences} onUpdate={fetchWorkExperiences} />}
            {activeTab === 'skills' && <SkillsManager skills={skills} onUpdate={fetchSkills} />}
            {activeTab === 'results' && <ResultsViewer results={results} refreshResults={fetchResults} />}
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-slate-500 text-sm">
        <p>Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;