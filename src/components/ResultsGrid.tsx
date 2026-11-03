import React, { useState, useEffect } from 'react';
import {
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  FileX,
  ShieldCheck,
} from 'lucide-react';
import { formatBytes, formatTimeRemaining, formatSizeDelta } from '../utils/format.ts';
import { checkFileHead, prepareArchive } from '../api/client.ts';
import { generateClientZip } from '../utils/clientConverter.ts';
import type { BatchObject, FileItem } from '../types/index.ts';

interface ResultsGridProps {
  batch: BatchObject;
  onPreviewFile: (file: FileItem) => void;
  onConvertMore: () => void;
  onDeleteBatch: () => void;
  onToast: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export function ResultsGrid({
  batch,
  onPreviewFile,
  onConvertMore,
  onDeleteBatch,
  onToast,
}: ResultsGridProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const isClientBatch = batch.batchId.startsWith('client_');

  // Expiry countdown calculation (FR-045)
  useEffect(() => {
    const updateTime = () => {
      const exp = new Date(batch.expiresAt).getTime();
      const diff = Math.floor((exp - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        setIsExpired(true);
      } else {
        setSecondsRemaining(diff);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [batch.expiresAt]);

  const completedFiles = batch.files.filter((f) => f.status === 'completed' && f.output);
  const failedFiles = batch.files.filter((f) => f.status === 'failed' || f.status === 'rejected');

  const handleDownloadSingle = async (file: FileItem) => {
    if (!file.output) return;
    setDownloadingFileId(file.fileId);

    try {
      if (!file.output.downloadUrl.startsWith('blob:')) {
        const isAvailable = await checkFileHead(file.output.downloadUrl);
        if (!isAvailable) {
          onToast('File expired or unavailable. Please upload again.', 'error');
          setDownloadingFileId(null);
          return;
        }
      }

      // Trigger browser download via invisible anchor
      const link = document.createElement('a');
      link.href = file.output.downloadUrl;
      link.setAttribute('download', file.output.filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onToast(`Download started: ${file.output.filename}`, 'success');
    } catch {
      onToast('Download failed. Please try again.', 'error');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDownloadZip = async () => {
    if (completedFiles.length === 0 || isArchiving) return;
    setIsArchiving(true);
    onToast('Preparing ZIP archive...', 'info');

    try {
      if (isClientBatch) {
        // In-browser client ZIP generation with JSZip
        const filesForZip = await Promise.all(
          completedFiles.map(async (f) => {
            const resp = await fetch(f.output!.downloadUrl);
            const blob = await resp.blob();
            return {
              filename: f.output!.filename,
              blob,
            };
          })
        );

        const clientZip = await generateClientZip(filesForZip);
        const link = document.createElement('a');
        link.href = clientZip.url;
        link.setAttribute('download', clientZip.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        onToast('ZIP archive downloaded directly from browser memory!', 'success');
      } else {
        // Server ZIP generation via Sharp/archiver
        const archive = await prepareArchive(batch.batchId);
        if (archive?.downloadUrl) {
          const link = document.createElement('a');
          link.href = archive.downloadUrl;
          link.setAttribute('download', archive.filename);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          onToast('ZIP archive download started!', 'success');
        } else {
          onToast('Could not generate ZIP archive.', 'error');
        }
      }
    } catch (err: unknown) {
      onToast((err as Error).message || 'Failed to create ZIP archive.', 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  // Expired state view (FR-045, ERR-10)
  if (isExpired) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto mb-5">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          Files Automatically Deleted
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
          These files were automatically deleted from the server to protect your privacy.
        </p>
        <button
          type="button"
          onClick={onConvertMore}
          className="mt-6 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          Convert More Images
        </button>
      </div>
    );
  }

  const isUnderFiveMinutes = secondsRemaining > 0 && secondsRemaining <= 300;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner & Stats */}
      <div className="bg-white dark:bg-[#121933] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Conversion Completed
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {completedFiles.length} converted
              </span>
              {failedFiles.length > 0 && (
                <>
                  <span>·</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    {failedFiles.length} failed
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Badge: In-browser privacy vs server expiry countdown */}
          {isClientBatch ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>In-Browser Memory • 100% Private (No Server Uploads)</span>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tabular-nums ${
                isUnderFiveMinutes
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Files auto-delete in {formatTimeRemaining(secondsRemaining)}</span>
            </div>
          )}
        </div>

        {/* Global batch actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {completedFiles.length > 0 && (
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isArchiving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-50"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing ZIP...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Download All as ZIP</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onConvertMore}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Convert More</span>
            </button>
          </div>

          {/* Delete my files now button (FR-046) */}
          <button
            type="button"
            onClick={onDeleteBatch}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Permanently remove files from the server right now"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete my files now</span>
          </button>
        </div>
      </div>

      {/* Result Cards Grid (FR-036, FR-037) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {batch.files.map((file) => {
          const isCompleted = file.status === 'completed' && file.output;

          if (!isCompleted) {
            // Failed or rejected card (FR-040)
            return (
              <div
                key={file.fileId}
                className="bg-white dark:bg-[#121933] rounded-2xl border border-rose-200 dark:border-rose-900/60 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
                    <FileX className="w-5 h-5" />
                  </div>
                  <h3
                    className="text-sm font-semibold text-slate-900 dark:text-white truncate"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </h3>
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                    {file.error?.message || 'Conversion could not be completed.'}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Other images in the batch were not affected.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                  Status: <span className="font-medium text-rose-600 dark:text-rose-400">Failed</span>
                </div>
              </div>
            );
          }

          // Completed card
          const originalBytes = file.original?.sizeBytes ?? 0;
          const convertedBytes = file.output?.sizeBytes ?? 0;
          const delta = formatSizeDelta(originalBytes, convertedBytes);

          return (
            <div
              key={file.fileId}
              className="bg-white dark:bg-[#121933] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
            >
              {/* 4:3 Aspect Ratio Thumbnail Container (FR-037) */}
              <div
                onClick={() => onPreviewFile(file)}
                className="relative aspect-4/3 bg-slate-100 dark:bg-slate-850 cursor-pointer overflow-hidden flex items-center justify-center p-3"
                title="Click to view full preview"
              >
                <img
                  src={file.output!.previewUrl}
                  alt={`Preview of converted ${file.output!.filename}`}
                  className="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-102"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="p-2 rounded-full bg-white/90 text-slate-800 shadow-md">
                    <Eye className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Card Meta details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3
                    className="text-sm font-semibold text-slate-900 dark:text-white truncate"
                    title={file.output!.filename}
                  >
                    {file.output!.filename}
                  </h3>

                  {/* Dimensions & Sizes comparison */}
                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Dimensions:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                        {file.output!.width} × {file.output!.height} px
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>File Size:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                        {formatBytes(convertedBytes)}{' '}
                        <span className={`text-[11px] font-semibold ${delta.startsWith('-') ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                          ({delta})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewFile(file)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(file)}
                    disabled={downloadingFileId === file.fileId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {downloadingFileId === file.fileId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download JPG</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
