import React from 'react';
import { Loader2, CheckCircle2, Clock, AlertTriangle, WifiOff } from 'lucide-react';
import { formatBytes } from '../utils/format.ts';
import type { BatchObject } from '../types/index.ts';

interface ProcessingStateProps {
  batch: BatchObject;
  isReconnecting: boolean;
  onCancel: () => void;
}

export function ProcessingState({ batch, isReconnecting, onCancel }: ProcessingStateProps) {
  const completedCount = batch.counts.completed + batch.counts.failed;
  const totalCount = batch.files.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const isClientBatch = batch.batchId.startsWith('client_');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Reconnecting banner if polling suffers temporary network error (FR-053, ERR-06) */}
      {isReconnecting && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-center gap-3 text-sm"
        >
          <WifiOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Reconnecting to server...</p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Network hiccup detected. Conversion is continuing on the server.
            </p>
          </div>
        </div>
      )}

      {/* Main Processing Card */}
      <div className="bg-white dark:bg-[#121933] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        {/* Header with Title & Overall Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <span>Converting your images...</span>
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isClientBatch
                ? 'Client-side Canvas engine: decoding AVIF, flattening transparency, and exporting JPEG directly in your browser.'
                : 'Sharp processing pipeline: auto-orient, flattening transparency, sRGB color conversion.'}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {completedCount} of {totalCount} completed ({percent}%)
            </span>
          </div>
        </div>

        {/* Overall Progress Bar (FR-051) */}
        <div className="mt-6">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Per-File Status Table (FR-029, FR-051) */}
        <div
          className="mt-6 divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1"
          aria-live="polite"
        >
          {batch.files.map((file) => {
            return (
              <div
                key={file.fileId}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium text-slate-900 dark:text-white truncate"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {file.original ? (
                      <>
                        {file.original.width} × {file.original.height} px · {formatBytes(file.original.sizeBytes)}
                      </>
                    ) : (
                      'AVIF Image'
                    )}
                  </p>
                </div>

                <div className="shrink-0">
                  {file.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </span>
                  )}

                  {file.status === 'processing' && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Converting</span>
                    </span>
                  )}

                  {file.status === 'queued' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Queued</span>
                    </span>
                  )}

                  {file.status === 'failed' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Failed</span>
                    </span>
                  )}

                  {file.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full">
                      <span>Rejected</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{isClientBatch ? '⚡ Direct In-Browser Engine · Zero Network Uploads' : 'Concurrency: 2 simultaneous workers'}</span>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Cancel and start over
          </button>
        </div>
      </div>
    </div>
  );
}
