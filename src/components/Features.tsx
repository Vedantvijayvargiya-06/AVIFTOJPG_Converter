import React from 'react';
import { Layers, Sliders, Palette, ShieldCheck, Archive, Zap } from 'lucide-react';

export function Features() {
  const featureList = [
    {
      title: 'Batch Conversion',
      desc: 'Convert up to 20 images in a single batch with concurrent processing and independent failure isolation.',
      icon: Layers,
    },
    {
      title: 'Precision Quality Control',
      desc: 'Choose between High (90), Balanced (80), or Compact (70) presets, or customize from 1 to 100 with full 4:4:4 chroma subsampling.',
      icon: Sliders,
    },
    {
      title: 'Transparency Compositing',
      desc: 'JPEG does not support alpha transparency. Pixora composites transparent pixels onto crisp white, black, or custom colors.',
      icon: Palette,
    },
    {
      title: 'Private by Design',
      desc: 'Original AVIF files are deleted immediately after conversion. Converted files auto-delete after 30 minutes. EXIF & GPS stripped.',
      icon: ShieldCheck,
    },
    {
      title: 'Instant ZIP Packaging',
      desc: 'Download all converted JPEG files at once using store-only ZIP compression, eliminating CPU-heavy re-compression delays.',
      icon: Archive,
    },
    {
      title: 'Zero Accounts or Sign-up',
      desc: 'Open Pixora and convert immediately. No email required, no credit cards, no tracking cookies, and no friction.',
      icon: Zap,
    },
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          Engineered for Quality & Speed
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Built with Node.js and the native Sharp image processing engine for professional-grade reliability.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featureList.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="p-6 rounded-3xl bg-white dark:bg-[#121933] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">
                {f.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
