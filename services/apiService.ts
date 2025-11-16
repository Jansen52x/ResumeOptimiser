import type { Project, Document, WorkExperience, Skill } from '../types';
import { INITIAL_PROJECTS } from '../constants';

export const API_BASE_URL = 'http://localhost:3001/api';

const simulateLatency = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// --- PROJECTS API ---

export const getProjects = async (): Promise<Project[]> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
        throw new Error('Failed to fetch projects');
    }
    return response.json();
};

export const addProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
    });
    if (!response.ok) {
        throw new Error('Failed to add project');
    }
    return response.json();
};

export const updateProject = async (updatedProject: Project): Promise<Project> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/projects/${updatedProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject),
    });
    if (!response.ok) {
        throw new Error('Failed to update project');
    }
    return response.json();
};

export const deleteProject = async (id: string): Promise<void> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete project');
    }
};

// --- DOCUMENTS API ---

type DocumentsShape = { resumes: Document[]; coverLetters: Document[] };

export const getDocuments = async (): Promise<DocumentsShape> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/documents`);
     if (!response.ok) {
        throw new Error('Failed to fetch documents');
    }
    return response.json();
};

export const addDocument = async (type: 'resume' | 'coverLetter', docData: any): Promise<Document> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...docData }),
    });
    if (!response.ok) {
        throw new Error('Failed to add document');
    }
    return response.json();
};

export const deleteDocument = async (type: 'resume' | 'coverLetter', id: string): Promise<void> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/documents/${type}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete document');
    }
};

// --- RESULTS API ---

import type { SavedResult } from '../types';

export const getResults = async (): Promise<SavedResult[]> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/results`);
    if (!response.ok) {
        throw new Error('Failed to fetch results');
    }
    return response.json();
};

export const saveResult = async (resultData: Omit<SavedResult, 'id' | 'createdAt'>): Promise<SavedResult> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData),
    });
    if (!response.ok) {
        throw new Error('Failed to save result');
    }
    return response.json();
};

export const deleteResult = async (id: string): Promise<void> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/results/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete result');
    }
};

// --- WORK EXPERIENCES API ---

export const getWorkExperiences = async (): Promise<WorkExperience[]> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/work-experiences`);
    if (!response.ok) {
        throw new Error('Failed to fetch work experiences');
    }
    return response.json();
};

export const addWorkExperience = async (experienceData: Omit<WorkExperience, 'id'>): Promise<WorkExperience> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/work-experiences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experienceData),
    });
    if (!response.ok) {
        throw new Error('Failed to add work experience');
    }
    return response.json();
};

export const updateWorkExperience = async (updatedExperience: WorkExperience): Promise<WorkExperience> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/work-experiences/${updatedExperience.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExperience),
    });
    if (!response.ok) {
        throw new Error('Failed to update work experience');
    }
    return response.json();
};

export const deleteWorkExperience = async (id: string): Promise<void> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/work-experiences/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete work experience');
    }
};

// --- SKILLS API ---

export const getSkills = async (): Promise<Skill[]> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/skills`);
    if (!response.ok) {
        throw new Error('Failed to fetch skills');
    }
    return response.json();
};

export const updateAllSkills = async (skillNames: string[]): Promise<Skill[]> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/skills`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: skillNames }),
    });
    if (!response.ok) {
        throw new Error('Failed to update skills');
    }
    return response.json();
};

export const deleteSkill = async (id: string): Promise<void> => {
    await simulateLatency();
    const response = await fetch(`${API_BASE_URL}/skills/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete skill');
    }
};