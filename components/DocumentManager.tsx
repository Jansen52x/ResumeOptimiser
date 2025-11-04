import React, { useState } from 'react';
import type { Document } from '../types';
import * as apiService from '../services/apiService';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface DocumentManagerProps {
  documents: {
    resumes: Document[];
    coverLetters: Document[];
  };
  refreshDocuments: () => Promise<void>;
}

const FileInput: React.FC<{
  id: string;
  onFileChange: (file: File) => void;
  isLoading: boolean;
}> = ({ id, onFileChange, isLoading }) => (
  <div className="relative">
    <div className={`
      flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer
      bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-colors
      ${isLoading ? 'opacity-50 cursor-wait' : ''}
    `}>
      <input
        id={id}
        type="file"
        className="absolute w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files && onFileChange(e.target.files[0])}
        accept=".txt,.md"
        disabled={isLoading}
      />
      <div className="text-center">
        {isLoading ? (
            <div className="w-8 h-8 mx-auto border-4 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        ) : (
            <UploadIcon className="w-8 h-8 mx-auto text-slate-500" />
        )}
        <p className="mt-2 text-sm text-slate-400">
            <span className="font-semibold text-cyan-400">{isLoading ? 'Uploading...' : 'Click to upload a document'}</span>
        </p>
        <p className="text-xs text-slate-500">.txt or .md files</p>
      </div>
    </div>
  </div>
);

const DocumentList: React.FC<{
    docs: Document[];
    onDelete: (id: string) => void;
}> = ({ docs, onDelete }) => (
    <div className="space-y-2 mt-4">
        {docs.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-md border border-slate-700">
                <div className="flex items-center gap-3">
                    <DocumentIcon className="w-5 h-5 text-cyan-400"/>
                    <span className="text-sm font-medium text-slate-300">{doc.name}</span>
                </div>
                <button onClick={() => onDelete(doc.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1" aria-label={`Delete ${doc.name}`}>
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        ))}
    </div>
);


export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, refreshDocuments }) => {
  const [isUploading, setIsUploading] = useState<'resume' | 'coverLetter' | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ type: 'resume' | 'coverLetter'; id: string; } | null>(null);

  const handleFileChange = (type: 'resume' | 'coverLetter') => async (file: File | null) => {
    if (!file) return;

    setIsUploading(type);
    const reader = new FileReader();
    reader.onload = async () => {
      const newDoc: Omit<Document, 'id'> = {
        name: file.name,
        content: reader.result as string,
      };
      await apiService.addDocument(type, newDoc);
      await refreshDocuments();
      setIsUploading(null);
    };
    reader.onerror = () => {
        setIsUploading(null);
        alert("Failed to read file.");
    }
    reader.readAsText(file);
  };
  
  const openDeleteModal = (type: 'resume' | 'coverLetter', id: string) => {
    setDocToDelete({ type, id });
  }

  const handleConfirmDelete = async () => {
    if (docToDelete) {
        await apiService.deleteDocument(docToDelete.type, docToDelete.id);
        setDocToDelete(null);
        await refreshDocuments();
    }
  }

  const getDocName = () => {
    if (!docToDelete) return '';
    const list = docToDelete.type === 'resume' ? documents.resumes : documents.coverLetters;
    return list.find(d => d.id === docToDelete.id)?.name || 'this document';
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">My Resumes</h2>
          <FileInput id="resume-upload" onFileChange={handleFileChange('resume')} isLoading={isUploading === 'resume'} />
          {documents.resumes.length > 0 ? (
              <DocumentList docs={documents.resumes} onDelete={(id) => openDeleteModal('resume', id)} />
          ) : (
              <p className="text-center text-sm text-slate-500 pt-6">No resumes uploaded yet.</p>
          )}
        </div>

        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">My Cover Letters</h2>
          <FileInput id="cover-letter-upload" onFileChange={handleFileChange('coverLetter')} isLoading={isUploading === 'coverLetter'} />
          {documents.coverLetters.length > 0 ? (
              <DocumentList docs={documents.coverLetters} onDelete={(id) => openDeleteModal('coverLetter', id)} />
          ) : (
              <p className="text-center text-sm text-slate-500 pt-6">No cover letters uploaded yet.</p>
          )}
        </div>
      </div>
      <DeleteConfirmationModal 
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={getDocName()}
      />
    </>
  );
};