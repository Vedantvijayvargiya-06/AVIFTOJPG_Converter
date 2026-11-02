import React from 'react';
import { Upload, Sparkles, DownloadCloud } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Upload AVIF Images',
      desc: 'Drag & drop up to 20 files, or select AVIF images from your phone, tablet, or desktop.',
      icon: Upload,
    },
    {
      number: '02',
      title: 'Fast Sharp Conversion',
      desc: 'Our backend Sharp engine decodes AV1 frames, applies sRGB color transforms, and handles transparency.',
      icon: Sparkles,
    },
    {
      number: '03',
      title: 'Download Single or ZIP',
      desc: 'Preview the converted JPGs, compare sizes, and download individual photos or all images as a unified ZIP.',
      icon: DownloadCloud,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          How It Works
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Converting modern AVIF images into universally compatible JPEGs in three intuitive steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#121933] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-bold text-slate-300 dark:text-slate-700">
                  {step.number}
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
