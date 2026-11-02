import React from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqSection() {
  const faqItems = [
    {
      q: 'What is an AVIF file?',
      a: 'AVIF (AV1 Image File Format) is an image container format that compresses visual data using the modern AV1 video codec. It offers superior compression compared to JPEG, but is not yet supported by all software, printers, or legacy applications.',
    },
    {
      q: 'Why convert AVIF to JPG?',
      a: 'While AVIF provides smaller file sizes, JPG is the universal standard for digital photography. Many email clients, graphic editing software, older smartphones, and enterprise platforms cannot open AVIF files. Converting to JPG ensures 100% universal compatibility.',
    },
    {
      q: 'Is Pixora free to use?',
      a: 'Yes, Pixora is completely free to use for both personal and commercial image conversions. There are no paywalls, hidden fees, or subscription charges.',
    },
    {
      q: 'Do I need to create an account or sign up?',
      a: 'No. Pixora requires no account, email address, password, or login. You can simply upload your images and download the converted JPG files immediately.',
    },
    {
      q: 'Are my images stored, analyzed, or shared with third parties?',
      a: 'Never. Pixora operates on a strict privacy-first model. Your images are processed exclusively to perform the conversion. We never view them, sell them, or use them to train machine learning models.',
    },
    {
      q: 'How long are my files kept on the server?',
      a: 'Original AVIF files are deleted immediately after their conversion attempt. Converted JPG files and ZIP archives are automatically purged after 30 minutes. You can also click the "Delete my files now" button to erase them instantly.',
    },
    {
      q: 'How many files can I convert at once?',
      a: 'You can convert up to 20 files per batch in the default tier, with concurrent processing queue management.',
    },
    {
      q: 'What is the maximum file size limit?',
      a: 'Each individual image can be up to 25 MB, with a total batch size limit of 150 MB.',
    },
    {
      q: 'Will my image quality change during conversion?',
      a: 'Pixora uses a native Sharp processing pipeline with configurable JPEG quality. At our default High quality setting (90), full 4:4:4 chroma subsampling is maintained to avoid visual degradation.',
    },
    {
      q: 'What happens to transparent images with an alpha channel?',
      a: 'The JPEG format does not support transparency. When you convert an AVIF with transparent areas, Pixora flattens the image onto a solid background (white by default, or your chosen custom HEX color in Advanced Settings).',
    },
    {
      q: 'Can I download all converted images together in a ZIP file?',
      a: 'Yes! Once your batch completes, click the "Download all as ZIP" button to receive an archive containing all converted JPEGs with safe, collision-free filenames.',
    },
    {
      q: 'Which browsers and devices are supported?',
      a: 'Pixora is fully responsive and operates seamlessly on desktop computers, laptops, iPads, tablets, iPhones, and Android smartphones across Chrome, Safari, Firefox, and Edge.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Schema.org FAQPage structured data for SEO (FR-007, SEO-03) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Everything you need to know about AVIF to JPG conversion and Pixora privacy.
        </p>
      </div>

      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <details
            key={index}
            className="group bg-white dark:bg-[#121933] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden transition-all duration-200 open:shadow-sm"
          >
            <summary className="flex items-center justify-between p-5 text-sm sm:text-base font-semibold text-slate-900 dark:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl">
              <span>{item.q}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-4" />
            </summary>
            <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-50 dark:border-slate-800/50">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
