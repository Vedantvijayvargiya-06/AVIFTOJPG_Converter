import React from 'react';

export function AboutAvif() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#121933] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-8 sm:p-10 shadow-sm">
        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight mb-4">
          Understanding AVIF and Why You Need JPG Conversion
        </h2>

        <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
          <p>
            The <strong>AV1 Image File Format (AVIF)</strong> is an advanced, modern image format based on the open-source AV1 video codec developed by the Alliance for Open Media (AOMedia). AVIF achieves superior compression efficiency compared to older formats like JPEG and WebP, often saving 50% or more bandwidth while preserving crisp image details, HDR highlights, and wide color gamuts.
          </p>

          <p>
            However, despite its growing adoption across modern web browsers, AVIF is not universally accepted across all software ecosystems. Many desktop photo editors, legacy content management systems, operating systems, printer drivers, e-commerce storefronts, and social media platforms still reject <code>.avif</code> uploads with format errors.
          </p>

          <p>
            <strong>Joint Photographic Experts Group (JPG/JPEG)</strong> remains the global standard for photographic imagery, supported without exception across every operating system, device, mobile camera roll, and web platform on Earth. By converting AVIF to JPG using Pixora, you ensure that your photographs, graphic assets, and digital art can be opened, viewed, edited, and shared by anyone without compatibility obstacles.
          </p>

          <h3 className="text-base font-semibold text-slate-900 dark:text-white pt-2">
            Choosing the Right Quality Setting
          </h3>

          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2">
            <li>
              <strong>High (Quality 90+):</strong> Recommended for professional photography, client deliverables, and portfolio art. Uses 4:4:4 chroma subsampling for zero color bleed on fine edges.
            </li>
            <li>
              <strong>Balanced (Quality 80):</strong> The optimal balance between sharp perceptual quality and compact file size, ideal for websites, blog posts, and general online sharing.
            </li>
            <li>
              <strong>Compact (Quality 70):</strong> Best for high-volume email attachments, lightweight mobile distribution, and thumbnail archives where small byte footprint is paramount.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
