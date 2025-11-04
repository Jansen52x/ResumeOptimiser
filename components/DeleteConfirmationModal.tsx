import React, { useState, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const CONFIRMATION_WORD = 'delete';

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isConfirmed = confirmationText.toLowerCase() === CONFIRMATION_WORD;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md">
        <header className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-red-400">Confirm Deletion</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 space-y-4">
          <p className="text-slate-300">
            This action is irreversible. To permanently delete <strong className="font-semibold text-slate-100">{itemName}</strong>, please type "<span className="font-bold text-red-400">{CONFIRMATION_WORD}</span>" in the box below.
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full p-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-red-500"
            aria-label={`Type '${CONFIRMATION_WORD}' to confirm deletion`}
          />
        </div>
        <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmed}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete Forever
          </button>
        </footer>
      </div>
    </div>
  );
};