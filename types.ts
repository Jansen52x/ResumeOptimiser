export interface Project {
  id: string;
  title: string;
  year: number;
  subtitle: string;
  description: string[];
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  dates: string;
  bullets: string[];
}

export interface Skill {
  id: string;
  skill_name: string;
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
  jobPostingScreenshot?: string;
  workExperiences: WorkExperience[];
  selectedProjects: Project[];
  skills: Skill[];
  additionalInfo?: string;
}

export interface ProjectEntry {
  company: string;
  dates: string;
  minor_desc: string;
  bullets: string[];
}

export interface SkillCategory {
  title: string;
  items: string;
}

export interface Education {
  institution: string;
  degree: string;
  dates: string;
  details: string[];
}

export interface ResumeStructure {
  summary: string;
  education: Education;
  workExperience: WorkExperience[];
  projects: ProjectEntry[];
  skills: SkillCategory[];
  links: {
    email: string;
    phone: string;
    portfolio: string;
    github: string;
    linkedin: string;
  };
}

export interface OptimizedResult {
  resume: ResumeStructure;
  coverLetter: string;
}

export interface SavedResult {
  id: string;
  jobTitle: string;
  companyName: string;
  resume: ResumeStructure;
  coverLetter: string;
  createdAt: string;
}