/**
 * Centralised user-facing copy and error messages
 * Requirements: FR-056, Section 22 of PIXORA-SRS-001
 */

export const STRINGS = {
  brand: {
    name: 'Pixora',
    tagline: 'Convert AVIF to JPG. Simple. Fast. Beautiful.',
    copyright: '© 2026 Pixora. All rights reserved.',
    privacyNotice: 'Your images are processed securely and automatically deleted after 30 minutes.',
  },
  hero: {
    title: 'Convert AVIF to JPG in Seconds.',
    subtitle: 'Fast, simple, and high-quality image conversion. Upload your AVIF images and download JPG files without complicated software.',
    trustPoints: [
      { id: 'private', label: '100% Private' },
      { id: 'auto-deleted', label: 'Auto-deleted in 30m' },
      { id: 'fast', label: 'Ultra-fast Sharp Engine' },
      { id: 'no-signup', label: 'No Sign-up Required' },
    ],
  },
  upload: {
    headline: 'Drag and drop your AVIF images here',
    subline: 'or choose files from your device',
    browseButton: 'Browse files',
    useSampleButton: 'Try with a sample AVIF',
    limitsFormat: 'Supports .avif · Up to {maxFiles} files · Max {maxFileSize}MB per file',
    clearAll: 'Clear all',
    addMore: 'Add more files',
    convertBtn: 'Convert {count} Images to JPG',
    convertSingleBtn: 'Convert Image to JPG',
    advancedSettingsTitle: 'Advanced Settings',
    qualityLabel: 'JPEG Quality',
    backgroundLabel: 'Background for Transparent Images',
    qualityPresets: {
      high: 'High (90)',
      balanced: 'Balanced (80)',
      small: 'Compact (70)',
    },
    backgroundPresets: {
      white: 'White (#FFFFFF)',
      black: 'Black (#000000)',
      custom: 'Custom HEX',
    },
  },
  processing: {
    title: 'Converting your images',
    subtitle: 'Processing image conversion with sharp fidelity',
    overallProgress: '{completed} of {total} completed',
    queued: 'Queued',
    processing: 'Processing...',
    completed: 'Completed',
    failed: 'Failed',
    cancel: 'Cancel conversion',
  },
  results: {
    titleDone: 'Done: {completed} converted, {failed} failed',
    allDone: 'Done: {completed} converted successfully',
    downloadZip: 'Download all as ZIP',
    preparingZip: 'Preparing ZIP...',
    convertMore: 'Convert more images',
    deleteNow: 'Delete my files now',
    previewAction: 'Preview',
    downloadJpg: 'Download JPG',
    expiresIn: 'Files deleted in {time}',
    expiredMessage: 'These files were automatically deleted for your privacy.',
    startOver: 'Start over',
    originalLabel: 'Original',
    convertedLabel: 'JPG',
  },
  errors: {
    UNSUPPORTED_FILE_TYPE: '“{name}” isn’t an AVIF image. Pixora currently converts .avif files only.',
    CORRUPTED_FILE: '“{name}” looks damaged and can’t be converted. Try exporting or downloading the original again.',
    FILE_TOO_LARGE: '“{name}” is {size}, which is over the {limit} limit per file.',
    TOO_MANY_FILES: 'You can convert up to {n} images at a time. Remove {k} to continue.',
    NO_FILES_PROVIDED: 'Choose at least one AVIF image to get started.',
    NETWORK_FAILURE: 'We couldn’t reach Pixora. Check your connection and try again.',
    INTERNAL_ERROR: 'Something went wrong on our side. Please try again in a moment. (Reference: {requestId})',
    CONVERSION_FAILED: 'We couldn’t convert “{name}”. Your other images weren’t affected.',
    ARCHIVE_FAILED: 'We couldn’t create your ZIP file. You can still download the images one by one.',
    BATCH_EXPIRED: 'These files were automatically deleted for your privacy. Please upload them again.',
    STORAGE_UNAVAILABLE: 'Pixora is temporarily unable to process files. Please try again in a few minutes.',
    RATE_LIMITED: 'You’re going a little fast. Please wait {n} seconds and try again.',
    SERVICE_BUSY: 'Pixora is busy right now. Please try again in a minute.',
    CONVERSION_TIMEOUT: '“{name}” took too long to convert. Try a smaller image.',
    IMAGE_DIMENSIONS_EXCEEDED: '“{name}” is larger than {mp} megapixels, which is the maximum Pixora can convert.',
    BATCH_TOO_LARGE: 'These files add up to {size}. The limit per batch is {limit}. Remove some files and try again.',
    UPLOAD_CANCELLED: 'Upload cancelled. Your files are still selected.',
    UNEXPECTED: 'Something unexpected happened. Please reload and try again.',
    DUPLICATE_FILE: '“{name}” has already been added to the batch.',
  },
};

export function formatErrorMessage(template: string, params: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}
