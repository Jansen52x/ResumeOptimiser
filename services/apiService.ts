import type { Project, Document } from '../types';
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