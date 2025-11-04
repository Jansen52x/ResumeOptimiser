export interface Project {
  id: string;
  title: string;
  year: number;
  subtitle: string;
  description: string[];
}

export interface Document {
  id: string;
  name: string;
  content?: string;
}

export interface AppData {
  jobPosting: string;
  resumeContent?: string;
  resumeScreenshot?: string;
  pastResumeFormat: string;
  coverLetterInspiration: string;
  selectedProjects: Project[];
}

export interface OptimizedResult {
  resume: string;
  coverLetter: string;
}