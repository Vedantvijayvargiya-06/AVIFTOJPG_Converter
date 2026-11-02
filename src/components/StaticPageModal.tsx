import React, { useEffect, useRef } from 'react';
import { X, Mail, Shield, FileText, Info } from 'lucide-react';

interface StaticPageModalProps {
  page: 'about' | 'contact' | 'privacy' | 'terms' | null;
  onClose: () => void;
}

export function StaticPageModal({ page, onClose }: StaticPageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (page && dialog) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog && dialog.open) {
      dialog.close();
    }
  }, [page]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && page) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [page, onClose]);

  if (!page) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="backdrop:bg-slate-950/75 p-0 bg-transparent rounded-3xl max-w-2xl w-[92vw] max-h-[85vh] overflow-hidden focus-visible:outline-none shadow-2xl"
      aria-labelledby="modal-headline"
    >
      <div className="bg-white dark:bg-[#121933] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {page === 'about' && <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            {page === 'contact' && <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            {page === 'privacy' && <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
            {page === 'terms' && <FileText className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
            <h3 id="modal-headline" className="text-lg font-display font-bold text-slate-900 dark:text-white">
              {page === 'about' && 'About Pixora'}
              {page === 'contact' && 'Contact Us'}
              {page === 'privacy' && 'Privacy Policy'}
              {page === 'terms' && 'Terms of Service'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
          {page === 'about' && (
            <>
              <p>
                <strong>Pixora</strong> was created to solve a pervasive modern web annoyance: downloading images in the next-generation AVIF format only to find that your favorite photo editor, office suite, or social platform rejects them.
              </p>
              <p>
                Unlike generic online converter sites filled with ads, bloated scripts, and tracking pixels, Pixora is engineered to be <strong>clean, fast, and completely private</strong>.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">Core Principles:</h4>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong>No Accounts:</strong> Anonymous access by capability URL.</li>
                <li><strong>Native Sharp Power:</strong> Real server-side AV1 decoding with high-speed MozJPEG encoding.</li>
                <li><strong>Zero Data Monetization:</strong> Your photos are converted and deleted. Period.</li>
              </ul>
            </>
          )}

          {page === 'contact' && (
            <>
              <p>
                Have questions, bug reports, feature requests, or business partnership inquiries? We’d love to hear from you.
              </p>
              <div className="my-6 p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/50 text-center">
                <p className="text-xs text-indigo-900 dark:text-indigo-300 font-medium mb-2">
                  Direct support e-mail (click to open mail client):
                </p>
                <a
                  href="mailto:support@pixora.app?subject=Pixora%20Inquiry"
                  className="inline-flex items-center gap-2 text-base font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  <span>support@pixora.app</span>
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In adherence with our strict privacy commitment, Pixora does not host form fields that store personal contact information or contact databases.
              </p>
            </>
          )}

          {page === 'privacy' && (
            <>
              <p>
                <em>Last Updated: November 2026</em>
              </p>
              <p>
                At Pixora, your privacy is our primary engineering requirement. This Privacy Policy details how we handle files uploaded to our service:
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">1. Image Processing & Retention</h4>
              <p>
                Original AVIF images are processed in temporary container storage solely to perform the conversion to JPG. <strong>Original files are deleted immediately after conversion.</strong> Converted JPEG files and ZIP archives are kept for a maximum of 30 minutes, after which they are permanently purged by an automated background sweeper.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">2. No AI Training or Image Viewing</h4>
              <p>
                We do not view, analyze, sell, or use your uploaded images to train machine learning models.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">3. Metadata Stripping</h4>
              <p>
                All EXIF data, GPS location tags, camera serial numbers, and embedded thumbnails are removed from converted JPEG outputs by default.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">4. Zero Tracking Cookies</h4>
              <p>
                Pixora uses no marketing cookies, tracking pixels, or cross-site fingerprinting scripts.
              </p>
            </>
          )}

          {page === 'terms' && (
            <>
              <p>
                <em>Last Updated: November 2026</em>
              </p>
              <p>
                By accessing and using Pixora, you agree to these Terms of Service.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">1. Acceptable Use</h4>
              <p>
                You may use Pixora for lawful personal and commercial image conversion. You agree not to upload content that infringes upon third-party copyrights or violates applicable laws.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">2. Service Availability & Limits</h4>
              <p>
                Pixora is provided free of charge on an "as-is" and "as-available" basis. We reserve the right to enforce rate limits and size restrictions to ensure equitable resource distribution.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-white pt-2">3. Automatic File Deletion</h4>
              <p>
                You acknowledge that Pixora is a transient converter tool, not a permanent file storage service. It is your responsibility to download your converted files promptly before the 30-minute retention deadline expires.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}
