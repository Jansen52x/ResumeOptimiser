import React, { useState, useEffect, useRef } from 'react';
import type { Document } from '../types';
import * as apiService from '../services/apiService';
import { UploadIcon } from './icons/UploadIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

// PDF parsing
// @ts-ignore - pdfjs types may not be available in this project; import legacy build for browser
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
// Use a CDN-hosted worker to avoid bundler export mismatches in dev
// pin to the same major version as package.json
const PDFJS_VERSION = '2.16.105';
(GlobalWorkerOptions as any).workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;

interface DocumentManagerProps {
  documents: {
    resumes: Document[];
    coverLetters: Document[];
  };
  refreshDocuments: () => Promise<void>;
}

const FileInput: React.FC<{
  id: string;
  onFileChange: (file: File | null) => void;
  isLoading: boolean;
  accept?: string;
}> = ({ id, onFileChange, isLoading, accept = '.pdf' }) => (
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
        onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
        accept={accept}
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
        <p className="text-xs text-slate-500">{accept}</p>
      </div>
    </div>
  </div>
);

const DocumentList: React.FC<{
  docs: Document[];
  onDelete: (id: string) => void;
  onPreview?: (doc: Document) => void;
}> = ({ docs, onDelete, onPreview }) => (
  <div className="space-y-2 mt-4">
    {docs.map(doc => (
      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-md border border-slate-700">
        <div className="flex items-center gap-3">
          <DocumentIcon className="w-5 h-5 text-cyan-400"/>
          <span className="text-sm font-medium text-slate-300">{doc.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {onPreview && (
          <button onClick={() => onPreview(doc)} className="text-slate-400 hover:text-white transition-colors p-1 text-sm">Preview</button>
          )}
          <button onClick={() => onDelete(doc.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1" aria-label={`Delete ${doc.name}`}>
          <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    ))}
  </div>
);


export const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, refreshDocuments }) => {
  const [isUploading, setIsUploading] = useState<'resume' | 'coverLetter' | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ type: 'resume' | 'coverLetter'; id: string; } | null>(null);
  const [selectedUploadType, setSelectedUploadType] = useState<'resume' | 'coverLetter'>('resume');
  const [showSelectedPreviewModal, setShowSelectedPreviewModal] = useState(false);
  const selectedModalRef = useRef<HTMLDivElement | null>(null);
  const uploadedPreviewRef = useRef<HTMLDivElement | null>(null);

  // selected files (before upload)
  const [selectedResumeFile, setSelectedResumeFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedResumeUrl, setSelectedResumeUrl] = useState<string | null>(null);
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null);
  const [selectedResumeArrayBuffer, setSelectedResumeArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [selectedCoverArrayBuffer, setSelectedCoverArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [extractedResumeText, setExtractedResumeText] = useState<string>('');
  const [extractedCoverText, setExtractedCoverText] = useState<string>('');
  const [nameInputResume, setNameInputResume] = useState<string>('');
  const [nameInputCover, setNameInputCover] = useState<string>('');
  // stable preview src/type captured at file-selection time so modal doesn't depend on
  // the possibly-changing `selectedUploadType` value
  const [selectedPreviewSrc, setSelectedPreviewSrc] = useState<string | null>(null);
  const [selectedPreviewType, setSelectedPreviewType] = useState<'resume' | 'coverLetter'>('resume');

  // preview modal for uploaded docs (show text content)
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);

  useEffect(() => {
    return () => {
      if (selectedResumeUrl) URL.revokeObjectURL(selectedResumeUrl);
      if (selectedCoverUrl) URL.revokeObjectURL(selectedCoverUrl);
    };
  }, [selectedResumeUrl, selectedCoverUrl]);

  // when the selected-file modal opens, scroll it into view so it's near the top
  useEffect(() => {
    if (showSelectedPreviewModal) {
      // slight delay to allow DOM to render
      setTimeout(() => selectedModalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [showSelectedPreviewModal]);

  // when previewing an uploaded doc, scroll that modal into view too
  useEffect(() => {
    if (previewDoc) {
      setTimeout(() => uploadedPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  }, [previewDoc]);

  // prevent body scrolling while any modal is open so scroll affects the modal overlay instead
  useEffect(() => {
    const anyOpen = showSelectedPreviewModal || !!previewDoc;
    const prev = document.body.style.overflow;
    if (anyOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev;
    }
    return () => { document.body.style.overflow = prev; };
  }, [showSelectedPreviewModal, previewDoc]);

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer) => {
    try {
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const maxPages = pdf.numPages;
      const pageTextPromises = [];
      for (let i = 1; i <= maxPages; i++) {
        // eslint-disable-next-line no-loop-func
        pageTextPromises.push(pdf.getPage(i).then(async (page: any) => {
          const content = await page.getTextContent();
          return content.items.map((s: any) => s.str).join(' ');
        }));
      }
      const pagesText = await Promise.all(pageTextPromises);
      return pagesText.join('\n\n');
    } catch (e) {
      console.error('PDF parse error', e);
      return '';
    }
  };

  const handleFileChange = (type: 'resume' | 'coverLetter') => async (file: File | null) => {
    if (!file) {
      // clear selection
      if (type === 'resume') {
        setSelectedResumeFile(null);
        setSelectedResumeUrl(null);
        setExtractedResumeText('');
        setNameInputResume('');
      } else {
        setSelectedCoverFile(null);
        setSelectedCoverUrl(null);
        setExtractedCoverText('');
        setNameInputCover('');
      }
      return;
    }

    // only accept PDFs (extra guard)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file.');
      return;
    }

    if (type === 'resume') {
      setSelectedResumeFile(file);
      const url = URL.createObjectURL(file);
      setSelectedResumeUrl(url);
      // capture the preview src/type immediately so the modal always shows the right blob
      setSelectedPreviewSrc(url);
      setSelectedPreviewType(type);
      setNameInputResume(file.name.replace(/\.pdf$/i, ''));
    } else {
      setSelectedCoverFile(file);
      const url = URL.createObjectURL(file);
      setSelectedCoverUrl(url);
      // capture the preview src/type immediately so the modal always shows the right blob
      setSelectedPreviewSrc(url);
      setSelectedPreviewType(type);
      setNameInputCover(file.name.replace(/\.pdf$/i, ''));
    }

    // parse PDF to extract text
    const reader = new FileReader();
    reader.onload = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      // keep arrayBuffer for base64 upload later
      if (type === 'resume') setSelectedResumeArrayBuffer(arrayBuffer);
      else setSelectedCoverArrayBuffer(arrayBuffer);
      const text = await extractTextFromPDF(arrayBuffer);
      if (type === 'resume') setExtractedResumeText(text || '(No extractable text)');
      else setExtractedCoverText(text || '(No extractable text)');
      // open modal to preview/name/edit after extraction
      setShowSelectedPreviewModal(true);
    };
    reader.onerror = () => {
      alert('Failed to read PDF file.');
    };
    reader.readAsArrayBuffer(file);
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

  const handleUploadSelected = async () => {
    const type = selectedUploadType;
    const file = type === 'resume' ? selectedResumeFile : selectedCoverFile;
    const name = type === 'resume' ? nameInputResume : nameInputCover;
    const content = type === 'resume' ? extractedResumeText : extractedCoverText;
    if (!file) return;

    const arrayBuffer = type === 'resume' ? selectedResumeArrayBuffer : selectedCoverArrayBuffer;
    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as unknown as number[]);
      }
      return btoa(binary);
    };
    const fileBase64 = arrayBuffer ? `data:application/pdf;base64,${arrayBufferToBase64(arrayBuffer)}` : undefined;

    setIsUploading(type);
    try {
      const newDoc: any = { name: name || file.name, content };
      if (fileBase64) newDoc.fileBase64 = fileBase64;
      await apiService.addDocument(type, newDoc);
      await refreshDocuments();
      // close selected-file modal on success
      setShowSelectedPreviewModal(false);
      // clear selection
      if (type === 'resume') {
        setSelectedResumeFile(null);
        if (selectedResumeUrl) { URL.revokeObjectURL(selectedResumeUrl); setSelectedResumeUrl(null); }
        setExtractedResumeText('');
        setNameInputResume('');
      } else {
        setSelectedCoverFile(null);
        if (selectedCoverUrl) { URL.revokeObjectURL(selectedCoverUrl); setSelectedCoverUrl(null); }
        setExtractedCoverText('');
        setNameInputCover('');
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setIsUploading(null);
    }
  }

  const handlePreviewUploaded = (doc: Document) => {
    setPreviewDoc(doc);
  }

  const closePreview = () => setPreviewDoc(null);

  return (
    <>
      <div className="space-y-8">
        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">Upload Document</h2>
          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm text-slate-300">Type:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedUploadType('resume')}
                className={`px-3 py-1 rounded ${selectedUploadType === 'resume' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>
                Resume
              </button>
              <button
                onClick={() => setSelectedUploadType('coverLetter')}
                className={`px-3 py-1 rounded ${selectedUploadType === 'coverLetter' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-200'}`}>
                Cover Letter
              </button>
            </div>
            <div className="ml-auto text-sm text-slate-400">Selected: <span className="font-semibold text-slate-200">{selectedUploadType === 'resume' ? 'Resume' : 'Cover Letter'}</span></div>
          </div>

          <FileInput id="upload" onFileChange={(file) => handleFileChange(selectedUploadType)(file)} isLoading={isUploading === selectedUploadType} accept=".pdf" />
          {/* Selected-file preview is shown in a modal instead of inline */}
        </div>

        <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-slate-100">My Documents</h2>
          <h3 className="text-sm font-semibold text-slate-200">Resumes</h3>
          {documents.resumes.length > 0 ? (
            <DocumentList docs={documents.resumes} onDelete={(id) => openDeleteModal('resume', id)} onPreview={handlePreviewUploaded} />
          ) : (
            <p className="text-sm text-slate-500 pt-2">No resumes uploaded yet.</p>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-200">Cover Letters</h3>
            {documents.coverLetters.length > 0 ? (
              <DocumentList docs={documents.coverLetters} onDelete={(id) => openDeleteModal('coverLetter', id)} onPreview={handlePreviewUploaded} />
            ) : (
              <p className="text-sm text-slate-500 pt-2">No cover letters uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
      <DeleteConfirmationModal 
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleConfirmDelete}
        itemName={getDocName()}
      />
      {/* Modal for previewing/naming the selected (not-yet-uploaded) file */}
      {showSelectedPreviewModal && (
        <div ref={selectedModalRef} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm overflow-auto flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl">
            <header className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-slate-100">Preview & Name</h2>
              <button onClick={() => { setShowSelectedPreviewModal(false); }} className="text-slate-500 hover:text-white">Close</button>
            </header>
            <div className="p-4">
              <div className="mb-4 flex justify-center">
                <iframe
                  // use the captured preview src so the modal doesn't depend on the
                  // possibly-changed `selectedUploadType` value; fallback to empty string
                  src={selectedPreviewSrc || ''}
                  className="w-full md:w-3/4 h-[55vh] rounded-md border border-slate-700"
                  title="Selected PDF preview"
                />
              </div>
              <label className="block text-xs text-slate-400">Version name</label>
              <input
                value={selectedPreviewType === 'resume' ? nameInputResume : nameInputCover}
                onChange={(e) => selectedPreviewType === 'resume' ? setNameInputResume(e.target.value) : setNameInputCover(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-700 rounded mt-1"
              />
              {/* extracted text is parsed but not shown/edited in the modal */}
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleUploadSelected()} disabled={isUploading === selectedUploadType} className="px-3 py-2 bg-cyan-500 text-slate-900 rounded font-semibold">Upload</button>
                <button onClick={() => {
                  // clear the selected file for the preview type and close modal
                  handleFileChange(selectedPreviewType)(null);
                  // revoke and clear the preview src
                  if (selectedPreviewSrc) { URL.revokeObjectURL(selectedPreviewSrc); setSelectedPreviewSrc(null); }
                  setShowSelectedPreviewModal(false);
                }} className="px-3 py-2 bg-slate-700 text-slate-200 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Preview modal for uploaded doc text */}
      {previewDoc && (
        <div ref={uploadedPreviewRef} className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm overflow-auto flex items-start justify-center z-50 p-4 pt-20">
          <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl">
            <header className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-slate-100">Preview: {previewDoc.name}</h2>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-500 hover:text-white">Close</button>
            </header>
            <div className="p-4 w-full">
              {previewDoc.filePath ? (
                // Backend returns a filePath like `/uploads/<file>.pdf`.
                // The frontend dev server (Vite) will respond to `/uploads/*` with the SPA index
                // if we use a relative path, so ensure we point the iframe to the backend origin.
                (() => {
                  const fp = previewDoc.filePath || '';
                  const previewUrl = fp.startsWith('http')
                    ? fp
                    : `${apiService.API_BASE_URL.replace(/\/api$/, '')}${fp}`;
                  return (
                    <iframe src={previewUrl} className="w-full h-[55vh] rounded-md border border-slate-700" title={`PDF preview ${previewDoc.name}`} />
                  );
                })()
              ) : (
                <div className="text-sm text-slate-200">(No preview available)</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};