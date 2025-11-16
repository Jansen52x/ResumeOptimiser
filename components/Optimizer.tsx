import React, { useState, useCallback, useMemo } from 'react';
import { Loader } from './Loader';
import { ProjectSelectorModal } from './ProjectSelectorModal';
import { OptimizationPreview } from './OptimizationPreview';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { optimizeBullets, categorizeSkills, generateCoverLetter, suggestProjects } from '../services/geminiService';
import { saveResult } from '../services/apiService';
import { generateLatexPDF, generateCoverLetterPDF } from '../services/latexService';
import { blobToBase64 } from '../utils/fileUtils';
import type { Project, WorkExperience, Skill, ResumeStructure, ProjectEntry, SkillCategory } from '../types';

interface OptimizerProps {
  allProjects: Project[];
  allWorkExperiences: WorkExperience[];
  allSkills: Skill[];
  onOptimizationComplete: () => Promise<void>;
}

type OptimizationStep = 'idle' | 'bullets' | 'skills' | 'cover-letter' | 'complete' | 'error';

export const Optimizer: React.FC<OptimizerProps> = ({ allProjects, allWorkExperiences, allSkills, onOptimizationComplete }) => {
  // Form inputs
  const [jobPosting, setJobPosting] = useState('');
  const [jobPostingScreenshot, setJobPostingScreenshot] = useState<string | null>(null);
  const [jobPostingScreenshotUrl, setJobPostingScreenshotUrl] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Optimization state
  const [currentStep, setCurrentStep] = useState<OptimizationStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stepErrors, setStepErrors] = useState<{bullets?: string, skills?: string, coverLetter?: string}>({});
  
  // Results
  const [optimizedWorkExp, setOptimizedWorkExp] = useState<WorkExperience[]>([]);
  const [optimizedProjects, setOptimizedProjects] = useState<ProjectEntry[]>([]);
  const [categorizedSkills, setCategorizedSkills] = useState<SkillCategory[]>([]);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [summary, setSummary] = useState('');

  // UI state
  const [isSuggestingProjects, setIsSuggestingProjects] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isExportingResume, setIsExportingResume] = useState(false);
  const [isExportingCoverLetter, setIsExportingCoverLetter] = useState(false);

  const handleSuggestProjects = useCallback(async () => {
    if (!jobPosting) {
      alert("Please paste the job description first to get project suggestions.");
      return;
    }
    setIsSuggestingProjects(true);
    try {
      const suggestedIds = await suggestProjects(jobPosting, allProjects);
      setSelectedProjectIds(suggestedIds);
      // Projects are now auto-selected in the modal
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to get project suggestions.");
    } finally {
      setIsSuggestingProjects(false);
    }
  }, [jobPosting, allProjects]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setJobPosting('');
      const base64 = await blobToBase64(file);
      setJobPostingScreenshot(base64);
      setJobPostingScreenshotUrl(URL.createObjectURL(file));
    }
  };

  const isFormValid = useMemo(() => {
    return (jobPosting || jobPostingScreenshot) && jobTitle.trim() && companyName.trim();
  }, [jobPosting, jobPostingScreenshot, jobTitle, companyName]);

  const handleRetryStep = async (step: 'bullets' | 'skills' | 'cover-letter') => {
    setStepErrors(prev => ({ ...prev, [step]: undefined }));
    
    const selectedProjects = allProjects.filter(p => selectedProjectIds.includes(p.id));
    
    try {
      if (step === 'bullets') {
        setCurrentStep('bullets');
        const result = await optimizeBullets(
          jobPosting,
          jobPostingScreenshot || undefined,
          allWorkExperiences,
          selectedProjects
        );
        setOptimizedWorkExp(result.optimizedWorkExperience);
        setOptimizedProjects(result.optimizedProjects);
        setSummary(`Experienced professional with ${allWorkExperiences[0]?.role || 'technical'} background, passionate about delivering high-quality solutions.`);
        setCurrentStep('skills');
        await handleOptimizeSkills();
      } else if (step === 'skills') {
        setCurrentStep('skills');
        await handleOptimizeSkills();
      } else if (step === 'cover-letter') {
        setCurrentStep('cover-letter');
        await handleGenerateCoverLetter();
      }
    } catch (e) {
      setStepErrors(prev => ({ ...prev, [step]: e instanceof Error ? e.message : 'Failed to retry step' }));
    }
  };

  const handleOptimizeSkills = async () => {
    try {
      const result = await categorizeSkills(
        jobPosting,
        jobPostingScreenshot || undefined,
        allSkills
      );
      setCategorizedSkills(result);
      setCurrentStep('cover-letter');
      await handleGenerateCoverLetter();
    } catch (e) {
      setStepErrors(prev => ({ ...prev, skills: e instanceof Error ? e.message : 'Skills categorization failed' }));
      setCurrentStep('complete');
    }
  };

  const handleGenerateCoverLetter = async () => {
    try {
      const letter = await generateCoverLetter(
        jobPosting,
        jobPostingScreenshot || undefined,
        companyName,
        optimizedWorkExp,
        optimizedProjects,
        additionalInfo || undefined
      );
      setCoverLetterText(letter);
      setCurrentStep('complete');
    } catch (e) {
      setStepErrors(prev => ({ ...prev, coverLetter: e instanceof Error ? e.message : 'Cover letter generation failed' }));
      setCurrentStep('complete');
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      alert("Please provide a Job Posting, Job Title, and Company Name.");
      return;
    }

    setCurrentStep('bullets');
    setError(null);
    setStepErrors({});

    const selectedProjects = allProjects.filter(p => selectedProjectIds.includes(p.id));

    try {
      // Step 1: Optimize bullets
      const bulletsResult = await optimizeBullets(
        jobPosting,
        jobPostingScreenshot || undefined,
        allWorkExperiences,
        selectedProjects
      );
      setOptimizedWorkExp(bulletsResult.optimizedWorkExperience);
      setOptimizedProjects(bulletsResult.optimizedProjects);
      setSummary(`Experienced professional with ${allWorkExperiences[0]?.role || 'technical'} background, passionate about delivering high-quality solutions.`);
      
      // Step 2: Categorize skills
      setCurrentStep('skills');
      const skillsResult = await categorizeSkills(
        jobPosting,
        jobPostingScreenshot || undefined,
        allSkills
      );
      setCategorizedSkills(skillsResult);
      
      // Step 3: Generate cover letter
      setCurrentStep('cover-letter');
      const coverLetter = await generateCoverLetter(
        jobPosting,
        jobPostingScreenshot || undefined,
        companyName,
        bulletsResult.optimizedWorkExperience,
        bulletsResult.optimizedProjects,
        additionalInfo || undefined
      );
      setCoverLetterText(coverLetter);
      
      setCurrentStep('complete');
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during optimization.');
      setCurrentStep('error');
    }
  }, [isFormValid, jobPosting, jobPostingScreenshot, allWorkExperiences, selectedProjectIds, allProjects, allSkills, companyName, additionalInfo]);

  const handleSaveResults = async () => {
    if (!optimizedWorkExp.length || !optimizedProjects.length || !categorizedSkills.length) {
      alert("Optimization incomplete. Please complete all steps first.");
      return;
    }

    try {
      const resume: ResumeStructure = {
        summary,
        education: {
          institution: "SINGAPORE MANAGEMENT UNIVERSITY",
          degree: "Bachelor of Science (Information Systems), Double Major in Digitalisation & Cloud Solutioning, Business Analytics",
          dates: "Aug 2022 -- May 2026",
          details: ["GPA 3.9/4.0 (Summa Cum Laude), Dean's List (AY 22/23 & 23/24)"]
        },
        workExperience: optimizedWorkExp,
        projects: optimizedProjects,
        skills: categorizedSkills,
        links: {
          email: "teoyongray@hotmail.com",
          phone: "+65 9062 0520",
          portfolio: "https://portfolio-368.web.app",
          github: "https://github.com/Jansen52x",
          linkedin: "https://linkedin.com/in/yongray-teo"
        }
      };

      await saveResult({
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        resume,
        coverLetter: coverLetterText,
      });

      await onOptimizationComplete();
      alert(`Successfully saved application for ${jobTitle} at ${companyName}! View it in the Results tab.`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save results.");
    }
  };

  const handleExportResume = async () => {
    if (!optimizedWorkExp.length || !optimizedProjects.length || !categorizedSkills.length) {
      alert("Please complete optimization first.");
      return;
    }

    setIsExportingResume(true);
    try {
      const resume: ResumeStructure = {
        summary,
        education: {
          institution: "SINGAPORE MANAGEMENT UNIVERSITY",
          degree: "Bachelor of Science (Information Systems), Double Major in Digitalisation & Cloud Solutioning, Business Analytics",
          dates: "Aug 2022 -- May 2026",
          details: ["GPA 3.9/4.0 (Summa Cum Laude), Dean's List (AY 22/23 & 23/24)"]
        },
        workExperience: optimizedWorkExp,
        projects: optimizedProjects,
        skills: categorizedSkills,
        links: {
          email: "teoyongray@hotmail.com",
          phone: "+65 9062 0520",
          portfolio: "https://portfolio-368.web.app",
          github: "https://github.com/Jansen52x",
          linkedin: "https://linkedin.com/in/yongray-teo"
        }
      };

      await generateLatexPDF(resume, `${companyName}_${jobTitle}_Resume`);
      alert("Resume PDF downloaded successfully!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to export resume.");
    } finally {
      setIsExportingResume(false);
    }
  };

  const handleExportCoverLetter = async () => {
    if (!coverLetterText) {
      alert("Please complete optimization first.");
      return;
    }

    setIsExportingCoverLetter(true);
    try {
      await generateCoverLetterPDF(coverLetterText, companyName, `${companyName}_${jobTitle}_CoverLetter`);
      alert("Cover letter PDF downloaded successfully!");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to export cover letter.");
    } finally {
      setIsExportingCoverLetter(false);
    }
  };

  const isLoading = currentStep !== 'idle' && currentStep !== 'complete' && currentStep !== 'error';

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-8 p-6 md:p-8 bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl shadow-slate-950/50">
        
        {/* 1. JOB DETAILS */}
        <div>
          <label className="block text-lg font-semibold text-slate-200 mb-2">1. Job Details</label>
          <p className="text-sm text-slate-400 mb-3">Enter the job title and company name for this application.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder:text-slate-500"
              placeholder="Job Title (e.g., Senior Frontend Engineer)"
              required
            />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder:text-slate-500"
              placeholder="Company Name (e.g., Google)"
              required
            />
          </div>
        </div>

        {/* 2. JOB POSTING */}
        <div>
          <label htmlFor="job-posting" className="block text-lg font-semibold text-slate-200 mb-2">2. Job Posting</label>
          <p className="text-sm text-slate-400 mb-3">Paste the entire job description here or upload a screenshot.</p>
          <textarea
            id="job-posting"
            value={jobPosting}
            onChange={(e) => {
              setJobPosting(e.target.value);
              if (jobPostingScreenshotUrl) {
                URL.revokeObjectURL(jobPostingScreenshotUrl);
                setJobPostingScreenshot(null);
                setJobPostingScreenshotUrl(null);
              }
            }}
            disabled={isLoading}
            rows={12}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder:text-slate-500"
            placeholder="Paste the job description here..."
          />

          <div className="mt-4">
            <p className="text-sm text-slate-400 mb-2">Or upload a screenshot:</p>
            <label htmlFor="jobposting-upload" className={`
                relative flex items-center justify-center w-full px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer
                bg-slate-900/50 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600 transition-colors
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                ${jobPostingScreenshotUrl ? 'border-cyan-500' : ''}
              `}>
              <input
                id="jobposting-upload"
                type="file"
                className="absolute w-full h-full opacity-0 cursor-pointer"
                onChange={handleScreenshotUpload}
                disabled={isLoading}
                accept="image/*"
              />
              {jobPostingScreenshotUrl ? (
                <div className='text-center'>
                  <img src={jobPostingScreenshotUrl} alt="Job posting preview" className="max-h-28 rounded-md mx-auto"/>
                  <p className="mt-2 text-sm text-cyan-400 font-semibold">Screenshot selected!</p>
                </div>
              ) : (
                <div className="text-center">
                  <UploadIcon className="w-6 h-6 mx-auto text-slate-500" />
                  <p className="mt-1 text-sm text-slate-400">
                    <span className="font-semibold text-cyan-400">Upload screenshot</span>
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 3. PROJECTS */}
        <div>
          <h3 className="block text-lg font-semibold text-slate-200 mb-2">3. Select Projects</h3>
          <p className="text-sm text-slate-400 mb-3">Choose which projects to include in this application.</p>
          <button
            type="button"
            onClick={() => setIsProjectModalOpen(true)}
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Select Projects ({selectedProjectIds.length} selected)
          </button>
        </div>

        {/* 4. ADDITIONAL INFO */}
        <div>
          <label htmlFor="additional-info" className="block text-lg font-semibold text-slate-200 mb-2">4. Additional Notes (Optional)</label>
          <p className="text-sm text-slate-400 mb-3">Share why you're interested in this role or any other context.</p>
          <textarea
            id="additional-info"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            disabled={isLoading}
            rows={4}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder:text-slate-500"
            placeholder="e.g., I'm passionate about this company's mission because..."
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-lg shadow-lg hover:from-cyan-300 hover:to-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <SparklesIcon className="w-6 h-6" />
            {isLoading ? 'Optimizing...' : 'Optimize My Application'}
          </button>
        </div>
      </form>

      {/* Progress Indicator */}
      {isLoading && (
        <div className="mt-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="text-xl font-bold text-cyan-400 mb-4">Optimization in Progress</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep === 'bullets' ? 'bg-cyan-500 animate-pulse' : 
                ['skills', 'cover-letter', 'complete'].includes(currentStep) ? 'bg-green-500' : 'bg-slate-600'
              }`}>
                {['skills', 'cover-letter', 'complete'].includes(currentStep) && <span className="text-white text-sm">✓</span>}
              </div>
              <p className="text-slate-200">Step 1: Optimizing work experience and project bullets</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep === 'skills' ? 'bg-cyan-500 animate-pulse' : 
                ['cover-letter', 'complete'].includes(currentStep) ? 'bg-green-500' : 'bg-slate-600'
              }`}>
                {['cover-letter', 'complete'].includes(currentStep) && <span className="text-white text-sm">✓</span>}
              </div>
              <p className="text-slate-200">Step 2: Categorizing technical skills</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                currentStep === 'cover-letter' ? 'bg-cyan-500 animate-pulse' : 
                currentStep === 'complete' ? 'bg-green-500' : 'bg-slate-600'
              }`}>
                {currentStep === 'complete' && <span className="text-white text-sm">✓</span>}
              </div>
              <p className="text-slate-200">Step 3: Generating personalized cover letter</p>
            </div>
          </div>
        </div>
      )}

      {/* Step Errors with Retry */}
      {Object.keys(stepErrors).length > 0 && (
        <div className="mt-8 p-6 bg-yellow-900/30 border border-yellow-700 rounded-xl">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Some Steps Failed</h3>
          <div className="space-y-3">
            {stepErrors.bullets && (
              <div className="flex items-center justify-between">
                <p className="text-yellow-300">Bullets: {stepErrors.bullets}</p>
                <button
                  onClick={() => handleRetryStep('bullets')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            )}
            {stepErrors.skills && (
              <div className="flex items-center justify-between">
                <p className="text-yellow-300">Skills: {stepErrors.skills}</p>
                <button
                  onClick={() => handleRetryStep('skills')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            )}
            {stepErrors.coverLetter && (
              <div className="flex items-center justify-between">
                <p className="text-yellow-300">Cover Letter: {stepErrors.coverLetter}</p>
                <button
                  onClick={() => handleRetryStep('cover-letter')}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-md text-sm font-semibold"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {currentStep === 'complete' && optimizedWorkExp.length > 0 && (
        <>
          <OptimizationPreview
            summary={summary}
            workExperience={optimizedWorkExp}
            projects={optimizedProjects}
            skills={categorizedSkills}
            coverLetter={coverLetterText}
            onSummaryChange={setSummary}
            onWorkExperienceChange={setOptimizedWorkExp}
            onProjectsChange={setOptimizedProjects}
            onSkillsChange={setCategorizedSkills}
            onCoverLetterChange={setCoverLetterText}
            onExportResume={handleExportResume}
            onExportCoverLetter={handleExportCoverLetter}
            isExportingResume={isExportingResume}
            isExportingCoverLetter={isExportingCoverLetter}
          />

          {/* Save to Results */}
          <div className="mt-6">
            <button
              onClick={handleSaveResults}
              className="w-full px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg shadow-lg hover:from-green-500 hover:to-emerald-600 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              Save to Results
            </button>
          </div>
        </>
      )}

      {isProjectModalOpen && (
        <ProjectSelectorModal
          allProjects={allProjects}
          selectedIds={selectedProjectIds}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={(newSelectedIds) => {
            setSelectedProjectIds(newSelectedIds);
            setIsProjectModalOpen(false);
          }}
          onSuggestProjects={handleSuggestProjects}
          isSuggestingProjects={isSuggestingProjects}
          hasJobPosting={Boolean(jobPosting)}
        />
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
          <h3 className="font-bold">Optimization Failed</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
