import React from 'react';
import { ShieldCheck, Lock, Trash2, Zap } from 'lucide-react';
import { STRINGS } from '../content/strings.ts';

export function Hero() {
  return (
    <section className="relative pt-12 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
      {/* Decorative radial gradient in background */}
      <div
        className="absolute inset-x-0 -top-20 -z-10 transform-gpu overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-500/15 to-violet-500/20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Main H1 Title (FR-001) */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-slate-900 dark:text-white text-balance max-w-3xl mx-auto">
        Convert <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">AVIF to JPG</span> in Seconds.
      </h1>

      {/* Subtitle <= 25 words stating no registration and auto-delete (FR-001) */}
      <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
        {STRINGS.hero.subtitle}
      </p>

      {/* Trust Cues row */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
        <div className="inline-flex items-center gap-1.5">
          <Lock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          <span>100% Private</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Trash2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Auto-deleted in 30 min</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Lossless Sharp Pipeline</span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          <span>No Sign-up Required</span>
        </div>
      </div>
    </section>
  );
}
