import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { STRINGS } from '../content/strings.ts';

interface FooterProps {
  onOpenModal: (page: 'about' | 'contact' | 'privacy' | 'terms') => void;
  onScrollToConverter: () => void;
}

export function Footer({ onOpenModal, onScrollToConverter }: FooterProps) {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0F1630] transition-colors mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-display font-extrabold text-sm shadow-xs">
                P
              </div>
              <span className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight">
                Pixora
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {STRINGS.brand.tagline} Professional image conversion without software bloat or sign-ups.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onScrollToConverter}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  AVIF to JPG Converter
                </button>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Core Features
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  FAQ & Answers
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal('about')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  About Pixora
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal('contact')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Contact Support
                </button>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Open Source Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Security */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Legal & Privacy
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal('privacy')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal('terms')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li className="pt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Zero Tracking Cookies</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Privacy Pledge */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>{STRINGS.brand.copyright}</p>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <Lock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Files are processed in memory & temporary storage, then automatically purged.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
