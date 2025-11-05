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
  // optional server URL path to the uploaded file (e.g. /uploads/doc-...pdf)
  filePath?: string;
}

export interface AppData {
  jobPosting: string;
  resumeContent?: string;
  resumeScreenshot?: string;
  // Optional image of the job posting (base64)
  jobPostingScreenshot?: string;
  pastResumeFormat: string;
  coverLetterInspiration: string;
  selectedProjects: Project[];
  additionalInfo?: string;
}

export interface OptimizedResult {
  resume: string;
  coverLetter: string;
}