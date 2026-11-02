import React, { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { formatBytes } from '../utils/format.ts';
import type { FileItem } from '../types/index.ts';

interface PreviewModalProps {
  file: FileItem | null;
  onClose: () => void;
}

export function PreviewModal({ file, onClose }: PreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isActualSize, setIsActualSize] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (file && dialog) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog && dialog.open) {
      dialog.close();
    }
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && file) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, onClose]);

  if (!file || !file.output) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-slate-950/75 p-0 bg-transparent rounded-3xl max-w-5xl w-[92vw] max-h-[92vh] overflow-hidden focus-visible:outline-none shadow-2xl"
      aria-labelledby="preview-modal-title"
    >
      <div className="bg-white dark:bg-[#121933] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3
              id="preview-modal-title"
              className="text-base font-bold text-slate-900 dark:text-white truncate"
            >
              {file.output.filename}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {file.output.width} × {file.output.height} px · {formatBytes(file.output.sizeBytes)} · JPEG
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle 100% vs Fit */}
            <button
              type="button"
              onClick={() => setIsActualSize(!isActualSize)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              title={isActualSize ? 'Fit image to window' : 'View at 100% actual resolution'}
            >
              {isActualSize ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
              <span>{isActualSize ? 'Fit to Screen' : '100% Size'}</span>
            </button>

            {/* Direct download in modal */}
            <a
              href={file.output.downloadUrl}
              download={file.output.filename}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close preview dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Image Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/60 dark:bg-slate-900/60 flex items-center justify-center min-h-[300px]">
          <img
            src={file.output.previewUrl}
            alt={file.output.filename}
            className={`rounded-xl shadow-md transition-all ${
              isActualSize ? 'max-w-none' : 'max-h-[70vh] max-w-full object-contain'
            }`}
          />
        </div>
      </div>
    </dialog>
  );
}
