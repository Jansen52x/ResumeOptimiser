import React, { useState, useCallback, useMemo } from 'react';
import { Loader } from './Loader';
import { OutputSection } from './OutputSection';
import { ProjectSelectorModal } from './ProjectSelectorModal';
import { SparklesIcon } from './icons/SparklesIcon';
import { UploadIcon } from './icons/UploadIcon';
import { optimizeApplication, getProjectAdvice } from '../services/geminiService';
import { blobToBase64 } from '../utils/fileUtils';
import type { Project, Document, AppData, OptimizedResult } from '../types';

interface OptimizerProps {
  allProjects: Project[];
  allDocuments: {
    resumes: Document[];
    coverLetters: Document[];
  };
}

export const Optimizer: React.FC<OptimizerProps> = ({ allProjects, allDocuments }) => {
  const [jobPosting, setJobPosting] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [baseResumeId, setBaseResumeId] = useState<string>('');
  const [resumeScreenshot, setResumeScreenshot] = useState<string | null>(null);
  const [resumeScreenshotUrl, setResumeScreenshotUrl] = useState<string | null>(null);

  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResult | null>(null);

  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [currentAdviceProjectId, setCurrentAdviceProjectId] = useState<string | null>(null);

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleGetAdvice = useCallback(async (project: Project) => {
    if (!jobPosting) {
      alert("Please paste the job description first to get advice.");
      return;
    }
    setAdviceText(null);
    setCurrentAdviceProjectId(project.id);
    setIsAdviceLoading(true);
    try {
      const advice = await getProjectAdvice(jobPosting, project);
      setAdviceText(advice);
    } catch (e) {
      setAdviceText(e instanceof Error ? e.message : "Failed to get advice.");
    } finally {
      setIsAdviceLoading(false);
    }
  }, [jobPosting]);

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBaseResumeId(''); // Clear dropdown selection
      const base64 = await blobToBase64(file);
      setResumeScreenshot(base64);
      setResumeScreenshotUrl(URL.createObjectURL(file));
    }
  };

  const handleBaseResumeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBaseResumeId(e.target.value);
    if (resumeScreenshotUrl) {
      URL.revokeObjectURL(resumeScreenshotUrl);
    }
    setResumeScreenshot(null);
    setResumeScreenshotUrl(null);
  }

  const isFormValid = useMemo(() => {
    return jobPosting && (baseResumeId || resumeScreenshot);
  }, [jobPosting, baseResumeId, resumeScreenshot]);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      alert("Please provide a Job Posting and select a base resume or upload a screenshot.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOptimizedResult(null);

    const selectedBaseResume = allDocuments.resumes.find(r => r.id === baseResumeId);
    const selectedCoverLetter = allDocuments.coverLetters.find(c => c.id === selectedCoverLetterId);

    const appData: AppData = {
      jobPosting,
      resumeContent: selectedBaseResume ? selectedBaseResume.content : undefined,
      resumeScreenshot: resumeScreenshot ?? undefined,
      selectedProjects: allProjects.filter(p => selectedProjectIds.includes(p.id)),
      pastResumeFormat: selectedBaseResume ? selectedBaseResume.content : '',
      coverLetterInspiration: selectedCoverLetter ? selectedCoverLetter.content : '',
    };
    
    try {
      const result = await optimizeApplication(appData);
      setOptimizedResult(result);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred. Check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, jobPosting, baseResumeId, resumeScreenshot, selectedProjectIds, selectedCoverLetterId, allProjects, allDocuments]);


  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-8 p-6 md:p-8 bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl shadow-slate-950/50">
        
        {/* 1. JOB POSTING */}
        <div>
          <label htmlFor="job-posting" className="block text-lg font-semibold text-slate-200 mb-2">1. Job Posting</label>
          <p className="text-sm text-slate-400 mb-3">Paste the entire job description here.</p>
          <textarea
            id="job-posting"
            value={jobPosting}
            onChange={(e) => setJobPosting(e.target.value)}
            disabled={isLoading}
            rows={16}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder:text-slate-500"
            placeholder="e.g., Senior Frontend Engineer at Gemini..."
            required
          />
        </div>

        {/* 2. BASE RESUME */}
        <div>
          <label htmlFor="base-resume" className="block text-lg font-semibold text-slate-200 mb-2">2. Your Base Resume</label>
          <div className="space-y-4">
              <p className="text-sm text-slate-400">Select a resume from your library for content and style inspiration.</p>
              <select
                  id="base-resume"
                  value={baseResumeId}
                  onChange={handleBaseResumeSelect}
                  disabled={isLoading || allDocuments.resumes.length === 0}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-50"
              >
                  <option value="">{allDocuments.resumes.length === 0 ? 'No resumes in library' : 'Select a resume...'}</option>
                  {allDocuments.resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            <div className="flex items-center gap-4">
                <hr className="flex-grow border-slate-700"/>
                <span className="text-slate-500 text-sm">OR</span>
                <hr className="flex-grow border-slate-700"/>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-3">Upload a screenshot of a resume.</p>
                <label htmlFor="screenshot-upload" className={`
                    relative flex items-center justify-center w-full px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer
                    bg-slate-900/50 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600 transition-colors
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${resumeScreenshotUrl ? 'border-cyan-500' : ''}
                  `}>
                  <input
                    id="screenshot-upload"
                    type="file"
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                    onChange={handleScreenshotUpload}
                    disabled={isLoading}
                    accept="image/*"
                  />
                  {resumeScreenshotUrl ? (
                    <div className='text-center'>
                      <img src={resumeScreenshotUrl} alt="Resume preview" className="max-h-20 rounded-md mx-auto"/>
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
        </div>
        
        {/* 3. PROJECTS */}
        <div>
          <h3 className="block text-lg font-semibold text-slate-200 mb-2">3. Select Projects to Include</h3>
          <p className="text-sm text-slate-400 mb-3">Choose which of your projects you want the AI to consider for this role.</p>
          <button
            type="button"
            onClick={() => setIsProjectModalOpen(true)}
            disabled={isLoading}
            className="w-full md:w-auto px-6 py-3 bg-slate-700/50 border border-slate-600 rounded-md text-slate-200 font-semibold hover:bg-slate-700 transition-colors"
          >
            Select Projects ({selectedProjectIds.length} selected)
          </button>
        </div>

        {/* 4. COVER LETTER INSPIRATION */}
        <div>
            <label htmlFor="cl-inspiration" className="block text-lg font-semibold text-slate-200 mb-2">4. Inspiration (Optional)</label>
            <p className="text-sm text-slate-400 mb-3">Select a past cover letter for tone.</p>
            <select
                id="cl-inspiration"
                value={selectedCoverLetterId}
                onChange={(e) => setSelectedCoverLetterId(e.target.value)}
                disabled={isLoading || allDocuments.coverLetters.length === 0}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-50"
            >
                <option value="">{allDocuments.coverLetters.length === 0 ? 'No cover letters in library' : 'Select a cover letter...'}</option>
                {allDocuments.coverLetters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="pt-4">
          <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 text-lg font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-teal-500 rounded-lg shadow-lg hover:from-cyan-300 hover:to-teal-400 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
          <SparklesIcon className="w-6 h-6" />
          Optimize My Application
          </button>
        </div>
      </form>

      {isProjectModalOpen && (
        <ProjectSelectorModal
          allProjects={allProjects}
          selectedIds={selectedProjectIds}
          jobPosting={jobPosting}
          onGetAdvice={handleGetAdvice}
          isAdviceLoading={isAdviceLoading}
          adviceText={adviceText}
          currentAdviceProjectId={currentAdviceProjectId}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={(newSelectedIds) => {
            setSelectedProjectIds(newSelectedIds);
            setIsProjectModalOpen(false);
          }}
        />
      )}

      {isLoading && <Loader />}
      
      {error && (
        <div className="mt-8 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
          <h3 className="font-bold">Optimization Failed</h3>
          <p>{error}</p>
        </div>
      )}

      {optimizedResult && !isLoading && (
        <OutputSection result={optimizedResult} />
      )}
    </div>
  );
};