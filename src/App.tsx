import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { UploadWorkspace } from './components/UploadWorkspace.tsx';
import { ProcessingState } from './components/ProcessingState.tsx';
import { ResultsGrid } from './components/ResultsGrid.tsx';
import { HowItWorks } from './components/HowItWorks.tsx';
import { Features } from './components/Features.tsx';
import { AboutAvif } from './components/AboutAvif.tsx';
import { FaqSection } from './components/FaqSection.tsx';
import { Footer } from './components/Footer.tsx';
import { PreviewModal } from './components/PreviewModal.tsx';
import { StaticPageModal } from './components/StaticPageModal.tsx';
import { ToastContainer, ToastMessage } from './components/Toast.tsx';
import {
  fetchConfig,
  uploadBatchFiles,
  startConversion,
  fetchBatchStatus,
  deleteBatchFiles,
  fetchSampleAvifFile,
} from './api/client.ts';
import { validateSingleFile, DEFAULT_LIMITS } from './utils/validation.ts';
import { generateFileId } from './utils/id.ts';
import {
  checkBrowserAvifSupport,
  checkBackendOnline,
  convertAvifToJpgClient,
  buildClientBatchObject,
} from './utils/clientConverter.ts';
import type { PublicConfig, ClientFileEntry, BatchObject, ConversionOptions, FileItem } from './types/index.ts';

export default function App() {
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<ClientFileEntry[]>([]);
  const [currentBatch, setCurrentBatch] = useState<BatchObject | null>(null);
  const [appState, setAppState] = useState<'idle' | 'uploading' | 'processing' | 'results'>('idle');
  const [uploadProgress, setUploadProgress] = useState({ percent: 0, loadedBytes: 0, totalBytes: 0 });
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [modalPage, setModalPage] = useState<'about' | 'contact' | 'privacy' | 'terms' | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [conversionEngine, setConversionEngine] = useState<'client' | 'server'>('client');

  const uploadAbortRef = useRef<(() => void) | null>(null);
  const clientCancelledRef = useRef<boolean>(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = `tst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 1. Fetch public config & detect backend availability on load
  useEffect(() => {
    checkBackendOnline().then((online) => {
      setIsBackendOnline(online);
      if (!online) {
        setConversionEngine('client');
      }
    });

    fetchConfig()
      .then((cfg) => setConfig(cfg))
      .catch((err) => {
        console.warn('Could not fetch server config, using client defaults:', err);
      });
  }, []);

  // 2. Client-side file selection and pre-validation (FR-011, FR-014)
  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      const limits = config
        ? {
            maxFileSizeBytes: config.limits.maxFileSizeBytes,
            maxFilesPerBatch: config.limits.maxFilesPerBatch,
            maxBatchSizeBytes: config.limits.maxBatchSizeBytes,
          }
        : DEFAULT_LIMITS;

      const currentCount = selectedFiles.length;
      const maxAllowed = limits.maxFilesPerBatch;

      if (currentCount >= maxAllowed) {
        addToast(`You can convert up to ${maxAllowed} images at a time.`, 'error');
        return;
      }

      const filesToAdd = newFiles.slice(0, maxAllowed - currentCount);
      if (newFiles.length > filesToAdd.length) {
        addToast(`Only added first ${filesToAdd.length} files to stay within the ${maxAllowed} limit.`, 'info');
      }

      const newEntries: ClientFileEntry[] = [];

      for (const file of filesToAdd) {
        // Duplicate check (same name and size)
        const isDuplicate = selectedFiles.some(
          (existing) => existing.name === file.name && existing.size === file.size
        );

        if (isDuplicate) {
          addToast(`“${file.name}” is already in the list.`, 'info');
          continue;
        }

        const validation = validateSingleFile(file, limits);

        newEntries.push({
          id: generateFileId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: validation.valid ? 'ready' : 'invalid',
          validationError: validation.message,
        });
      }

      if (newEntries.length > 0) {
        setSelectedFiles((prev) => [...prev, ...newEntries]);
      }
    },
    [config, selectedFiles, addToast]
  );

  const handleFileRemoved = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
    setAppState('idle');
  }, []);

  // 3. Load Sample AVIF for instant demonstration
  const handleLoadSample = useCallback(async () => {
    try {
      addToast('Loading sample AVIF image...', 'info');
      const sampleFile = await fetchSampleAvifFile();
      handleFilesAdded([sampleFile]);
      addToast('Sample AVIF loaded! Ready to convert.', 'success');
    } catch (err) {
      addToast('Could not load sample AVIF from server.', 'error');
    }
  }, [addToast, handleFilesAdded]);

  // 4. Polling batch status (D-05, FR-029)
  const startPolling = useCallback(
    (batchId: string) => {
      let backoffDelay = 1000;
      let failureCount = 0;

      const poll = async () => {
        try {
          const updated = await fetchBatchStatus(batchId);
          setIsReconnecting(false);
          failureCount = 0;
          backoffDelay = 1000;
          setCurrentBatch(updated);

          // Check if batch is terminal
          if (
            updated.status === 'completed' ||
            updated.status === 'partially_completed' ||
            updated.status === 'failed'
          ) {
            setAppState('results');
            if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
            return;
          }

          // Continue polling
          pollingTimerRef.current = setTimeout(poll, updated.pollIntervalMs || 1000);
        } catch (err: unknown) {
          const status = (err as { status?: number })?.status;
          if (status === 410) {
            addToast('Batch expired and files were removed.', 'error');
            setAppState('idle');
            setCurrentBatch(null);
            return;
          }

          failureCount++;
          if (failureCount >= 2) {
            setIsReconnecting(true);
          }

          // Exponential backoff up to 8s
          backoffDelay = Math.min(8000, backoffDelay * 2);
          pollingTimerRef.current = setTimeout(poll, backoffDelay);
        }
      };

      poll();
    },
    [addToast]
  );

  // 5. Convert Action (Dual Engine: Client In-Browser or Server Sharp)
  const handleStartConversion = useCallback(
    async (options: ConversionOptions) => {
      const readyFiles = selectedFiles.filter((f) => f.status === 'ready');
      if (readyFiles.length === 0) return;

      // CLIENT-SIDE IN-BROWSER CONVERSION (Zero Server, 100% Private, Works on Vercel/Static)
      if (conversionEngine === 'client' || !isBackendOnline) {
        clientCancelledRef.current = false;
        setAppState('processing');

        // Check browser support
        const supported = await checkBrowserAvifSupport();
        if (!supported) {
          addToast(
            'Your browser does not support decoding AVIF images. Please use Chrome 85+, Safari 16.4+, or Firefox 93+.',
            'error'
          );
          setAppState('idle');
          return;
        }

        // Initialize file items in queued state
        const fileItems: FileItem[] = readyFiles.map((f) => ({
          fileId: generateFileId(),
          originalName: f.name,
          status: 'queued',
          original: {
            sizeBytes: f.size,
            width: 0,
            height: 0,
            hasAlpha: false,
            bitDepth: 8,
          },
          output: null,
          warnings: [],
          error: null,
        }));

        let currentBatchObj = buildClientBatchObject(fileItems, options);
        currentBatchObj.status = 'processing';
        setCurrentBatch(currentBatchObj);

        // Convert files sequentially
        for (let i = 0; i < readyFiles.length; i++) {
          if (clientCancelledRef.current) break;

          fileItems[i].status = 'processing';
          currentBatchObj = {
            ...buildClientBatchObject([...fileItems], options),
            status: 'processing',
          };
          setCurrentBatch(currentBatchObj);

          try {
            const res = await convertAvifToJpgClient(readyFiles[i].file, options);
            fileItems[i] = res.fileItem;
          } catch (err: unknown) {
            fileItems[i].status = 'failed';
            fileItems[i].error = {
              code: 'CONVERT_FAILED',
              message: (err as Error).message || 'Conversion failed in browser',
            };
          }

          if (clientCancelledRef.current) break;

          const isLast = i === readyFiles.length - 1;
          currentBatchObj = {
            ...buildClientBatchObject([...fileItems], options),
            status: isLast ? 'completed' : 'processing',
          };
          setCurrentBatch(currentBatchObj);
        }

        if (!clientCancelledRef.current) {
          const finalBatch = buildClientBatchObject(fileItems, options);
          setCurrentBatch(finalBatch);
          setAppState('results');
          addToast(
            `Successfully converted ${finalBatch.counts.completed} image${finalBatch.counts.completed === 1 ? '' : 's'} directly in your browser!`,
            'success'
          );
        }
        return;
      }

      // SERVER SHARP ENGINE CONVERSION
      setAppState('uploading');
      setUploadProgress({ percent: 0, loadedBytes: 0, totalBytes: 0 });

      const filesToUpload = readyFiles.map((f) => f.file);
      const { promise, abort } = uploadBatchFiles(
        filesToUpload,
        (pct, loaded, total) => {
          setUploadProgress({ percent: pct, loadedBytes: loaded, totalBytes: total });
        }
      );
      uploadAbortRef.current = abort;

      try {
        const batch = await promise;
        uploadAbortRef.current = null;
        setCurrentBatch(batch);
        setAppState('processing');

        // Start conversion on server
        await startConversion(batch.batchId, options);

        // Begin polling for progress
        startPolling(batch.batchId);
      } catch (err: unknown) {
        uploadAbortRef.current = null;
        setAppState('idle');
        addToast((err as Error).message || 'Conversion failed to start', 'error');
      }
    },
    [selectedFiles, conversionEngine, isBackendOnline, addToast, startPolling]
  );

  const handleCancelUpload = useCallback(() => {
    if (uploadAbortRef.current) {
      uploadAbortRef.current();
      uploadAbortRef.current = null;
    }
    setAppState('idle');
    addToast('Upload cancelled. Your files are still selected.', 'info');
  }, [addToast]);

  const handleDeleteBatchNow = useCallback(async () => {
    if (!currentBatch) return;

    if (currentBatch.batchId.startsWith('client_')) {
      // Clean up in-memory blob URLs
      currentBatch.files.forEach((f) => {
        if (f.output?.downloadUrl.startsWith('blob:')) {
          URL.revokeObjectURL(f.output.downloadUrl);
        }
      });
      if (currentBatch.archive?.downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentBatch.archive.downloadUrl);
      }
      setCurrentBatch(null);
      setSelectedFiles([]);
      setAppState('idle');
      addToast('Images removed from browser memory.', 'success');
      return;
    }

    try {
      await deleteBatchFiles(currentBatch.batchId);
      setCurrentBatch(null);
      setSelectedFiles([]);
      setAppState('idle');
      addToast('All files were permanently deleted from the server.', 'success');
    } catch {
      addToast('Failed to delete files.', 'error');
    }
  }, [currentBatch, addToast]);

  const handleConvertMore = useCallback(() => {
    setSelectedFiles([]);
    setCurrentBatch(null);
    setAppState('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCancelProcessing = useCallback(() => {
    if (currentBatch?.batchId.startsWith('client_')) {
      clientCancelledRef.current = true;
      setAppState('idle');
      setCurrentBatch(null);
      addToast('Conversion cancelled.', 'info');
      return;
    }
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
    }
    handleConvertMore();
  }, [currentBatch, handleConvertMore, addToast]);

  const handleScrollToConverter = () => {
    document.getElementById('converter')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1020] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Accessible skip link (FR-055, §18.5.3) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg font-medium text-xs"
      >
        Skip to main content
      </a>

      {/* Navigation */}
      <Navbar
        onOpenModal={(page) => setModalPage(page)}
        onScrollToConverter={handleScrollToConverter}
      />

      {/* Main Content Area */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Dynamic Workspace State */}
        {appState === 'processing' && currentBatch ? (
          <ProcessingState
            batch={currentBatch}
            isReconnecting={isReconnecting}
            onCancel={handleCancelProcessing}
          />
        ) : appState === 'results' && currentBatch ? (
          <ResultsGrid
            batch={currentBatch}
            onPreviewFile={(file) => setPreviewFile(file)}
            onConvertMore={handleConvertMore}
            onDeleteBatch={handleDeleteBatchNow}
            onToast={addToast}
          />
        ) : (
          <UploadWorkspace
            config={config}
            selectedFiles={selectedFiles}
            onFilesAdded={handleFilesAdded}
            onFileRemoved={handleFileRemoved}
            onClearAll={handleClearAll}
            onConvert={handleStartConversion}
            onLoadSample={handleLoadSample}
            isUploading={appState === 'uploading'}
            uploadProgress={uploadProgress}
            onCancelUpload={handleCancelUpload}
            conversionEngine={conversionEngine}
            onEngineChange={(engine) => setConversionEngine(engine)}
            isBackendOnline={isBackendOnline}
          />
        )}

        {/* How It Works Section */}
        <HowItWorks />

        {/* Features Section */}
        <Features />

        {/* About AVIF Educational Section */}
        <AboutAvif />

        {/* FAQ Section */}
        <FaqSection />
      </main>

      {/* Footer */}
      <Footer
        onOpenModal={(page) => setModalPage(page)}
        onScrollToConverter={handleScrollToConverter}
      />

      {/* Accessible Full-Image Preview Modal (FR-038) */}
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      {/* Static Pages Modal (FR-009) */}
      <StaticPageModal page={modalPage} onClose={() => setModalPage(null)} />

      {/* ARIA Live Toast Container (FR-054) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
