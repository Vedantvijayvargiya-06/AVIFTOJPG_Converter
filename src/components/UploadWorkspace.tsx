import React, { useState, useRef, ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import {
  UploadCloud,
  FileImage,
  Trash2,
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { formatBytes } from '../utils/format.ts';
import { validateSingleFile } from '../utils/validation.ts';
import type { PublicConfig, ClientFileEntry, ConversionOptions } from '../types/index.ts';

interface UploadWorkspaceProps {
  config: PublicConfig | null;
  selectedFiles: ClientFileEntry[];
  onFilesAdded: (newFiles: File[]) => void;
  onFileRemoved: (id: string) => void;
  onClearAll: () => void;
  onConvert: (options: ConversionOptions) => void;
  onLoadSample: () => void;
  isUploading: boolean;
  uploadProgress: { percent: number; loadedBytes: number; totalBytes: number };
  onCancelUpload: () => void;
  conversionEngine?: 'client' | 'server';
  onEngineChange?: (engine: 'client' | 'server') => void;
  isBackendOnline?: boolean | null;
}

export function UploadWorkspace({
  config,
  selectedFiles,
  onFilesAdded,
  onFileRemoved,
  onClearAll,
  onConvert,
  onLoadSample,
  isUploading,
  uploadProgress,
  onCancelUpload,
  conversionEngine = 'client',
  onEngineChange,
  isBackendOnline = false,
}: UploadWorkspaceProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quality, setQuality] = useState<number>(config?.defaults.quality ?? 90);
  const [background, setBackground] = useState<string>(config?.defaults.background ?? '#FFFFFF');
  const [customHex, setCustomHex] = useState('#FFFFFF');
  const [hexError, setHexError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxFiles = config?.limits.maxFilesPerBatch ?? 20;
  const maxFileSizeMb = Math.round((config?.limits.maxFileSizeBytes ?? 26214400) / (1024 * 1024));
  const maxBatchSizeMb = Math.round((config?.limits.maxBatchSizeBytes ?? 157286400) / (1024 * 1024));

  const validFiles = selectedFiles.filter((f) => f.status === 'ready');
  const totalSizeBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only accept files, ignore dropped text (FR-012)
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesAdded(filesArray);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesAdded(filesArray);
    }
    // reset input value so re-selecting same files triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDownDropzone = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleHexChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setHexError(null);
      setBackground(val.toUpperCase());
    } else {
      setHexError('Must be a 6-digit hex color like #FFFFFF');
    }
  };

  const handleConvertSubmit = () => {
    if (validFiles.length === 0 || isUploading) return;
    onConvert({
      quality,
      background,
    });
  };

  return (
    <div id="converter" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".avif,image/avif"
        multiple
        className="hidden"
        aria-label="Upload AVIF files"
      />

      {/* Engine Selection & Privacy Mode Pill */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          {conversionEngine === 'client' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>In-Browser Engine Active · 100% Private (Zero Server Uploads)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Server Engine Active · Node.js Sharp Pipeline</span>
            </span>
          )}
        </div>

        {isBackendOnline && onEngineChange && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onEngineChange('client')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                conversionEngine === 'client'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              In-Browser
            </button>
            <button
              type="button"
              onClick={() => onEngineChange('server')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                conversionEngine === 'server'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Server (Sharp)
            </button>
          </div>
        )}
      </div>

      {/* Main Dropzone Card (FR-002, FR-003, FR-012) */}
      <div
        role="button"
        tabIndex={0}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDownDropzone}
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 sm:p-12 text-center bg-white dark:bg-[#121933] ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01] shadow-lg shadow-indigo-500/10'
            : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/80 shadow-sm'
        }`}
        aria-label="Drag and drop AVIF images or click to browse files"
      >
        <div className="flex flex-col items-center justify-center max-w-lg mx-auto">
          {/* Centered Icon in Gradient Tile */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-violet-500/20 to-indigo-500/10 dark:from-indigo-500/25 dark:to-violet-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 ring-1 ring-indigo-500/20">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Drag and drop your AVIF images here
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            or click anywhere to browse from your device
          </p>

          {/* Action buttons inside Dropzone */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              Browse Files
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              title="Test conversion without having an AVIF file on hand"
            >
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              <span>Try Sample AVIF</span>
            </button>
          </div>

          {/* Limits notice (FR-004) */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Input: <strong className="font-semibold text-slate-700 dark:text-slate-300">.avif</strong></span>
            <span>·</span>
            <span>Output: <strong className="font-semibold text-slate-700 dark:text-slate-300">.jpg</strong></span>
            <span>·</span>
            <span>Max <strong className="font-semibold text-slate-700 dark:text-slate-300">{maxFileSizeMb} MB</strong> / file</span>
            <span>·</span>
            <span>Up to <strong className="font-semibold text-slate-700 dark:text-slate-300">{maxFiles}</strong> files</span>
          </div>
        </div>
      </div>

      {/* Selected Files Section (FR-013, FR-017) */}
      {selectedFiles.length > 0 && (
        <div className="mt-8 bg-white dark:bg-[#121933] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Selected Files</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} · {formatBytes(totalSizeBytes)}
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                + Add more
              </button>
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            </div>
          </div>

          {/* Files List */}
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="py-3 px-2 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                    <FileImage className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-sm font-medium text-slate-900 dark:text-white truncate"
                      title={item.name}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatBytes(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.status === 'ready' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md max-w-xs truncate"
                      title={item.validationError}
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{item.validationError}</span>
                    </span>
                  )}

                  {/* 44px hit area remove button (FR-017, RSP-02) */}
                  <button
                    type="button"
                    onClick={() => onFileRemoved(item.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Settings Accordion (FR-035) */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              aria-expanded={showAdvanced}
            >
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Conversion Settings</span>
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                {/* Quality Setting */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="quality-slider"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      JPEG Quality: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{quality}</span>
                    </label>
                    <span className="text-xs text-slate-400">
                      {quality >= 90 ? 'High (4:4:4 Chroma)' : quality >= 75 ? 'Balanced' : 'Small file'}
                    </span>
                  </div>

                  <input
                    id="quality-slider"
                    type="range"
                    min="1"
                    max="100"
                    value={quality}
                    onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />

                  {/* Quality Presets */}
                  <div className="mt-2 flex items-center gap-2">
                    {[
                      { label: 'High', val: 90 },
                      { label: 'Balanced', val: 80 },
                      { label: 'Small', val: 70 },
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setQuality(p.val)}
                        className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                          quality === p.val
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p.label} ({p.val})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparency Flatten Background */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
                    Transparency Background
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                    JPEG has no alpha channel. Transparent regions composite onto this color.
                  </p>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBackground('#FFFFFF')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                        background === '#FFFFFF'
                          ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shrink-0" />
                      <span>White</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBackground('#000000')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                        background === '#000000'
                          ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full bg-black shrink-0" />
                      <span>Black</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={background}
                        onChange={(e) => {
                          setBackground(e.target.value.toUpperCase());
                          setCustomHex(e.target.value.toUpperCase());
                          setHexError(null);
                        }}
                        className="w-7 h-7 rounded border border-slate-300 dark:border-slate-600 cursor-pointer p-0 bg-transparent"
                        title="Pick custom color"
                        aria-label="Color picker"
                      />
                      <input
                        type="text"
                        value={customHex}
                        onChange={handleHexChange}
                        placeholder="#FFFFFF"
                        className="w-24 px-2 py-1 text-xs font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        aria-label="Hex color value"
                      />
                    </div>
                  </div>
                  {hexError && <p className="text-xs text-rose-500 mt-1">{hexError}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress Indicator (FR-019, FR-051) */}
          {isUploading && (
            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50">
              <div className="flex items-center justify-between text-xs font-medium text-indigo-900 dark:text-indigo-200 mb-2">
                <span>Uploading {validFiles.length} images... {uploadProgress.percent}%</span>
                <span>
                  {formatBytes(uploadProgress.loadedBytes)} / {formatBytes(uploadProgress.totalBytes)}
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={uploadProgress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-2 bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full overflow-hidden"
              >
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-150 rounded-full"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={onCancelUpload}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Cancel upload
                </button>
              </div>
            </div>
          )}

          {/* Action Row / Convert Button (FR-020) */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {validFiles.length} of {selectedFiles.length} files valid for conversion
            </p>

            <button
              type="button"
              onClick={handleConvertSubmit}
              disabled={validFiles.length === 0 || isUploading}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                validFiles.length > 0 && !isUploading
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 active:scale-[0.99]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
            >
              {isUploading
                ? 'Uploading images...'
                : conversionEngine === 'client'
                ? validFiles.length === 1
                  ? 'Convert 1 Image (In Browser)'
                  : `Convert ${validFiles.length} Images (In Browser)`
                : validFiles.length === 1
                ? 'Convert 1 Image to JPG'
                : `Convert ${validFiles.length} Images to JPG`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
