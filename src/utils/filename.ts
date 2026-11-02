/**
 * Filename sanitisation and collision resolution
 * Requirements: FR-043, SR-006, SR-007, UT-01, UT-02
 */

export function sanitiseFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'image';
  }

  // 1. Unicode NFC normalisation
  let clean = rawName.normalize('NFC');

  // Strip directory paths if present (take the basename)
  const lastSlash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  if (lastSlash >= 0) {
    clean = clean.slice(lastSlash + 1);
  }

  // Strip extension if present for base name operations
  const dotIndex = clean.lastIndexOf('.');
  let baseName = dotIndex > 0 ? clean.slice(0, dotIndex) : clean;

  // 2. Remove control characters and path traversal / prohibited characters <>:"/\|?*
  baseName = baseName.replace(/[\\/]/g, '');
  baseName = baseName.replace(/[\x00-\x1F\x7F]/g, '');
  baseName = baseName.replace(/[<>:"|?*]/g, '');

  // 3. Trim leading dots
  baseName = baseName.replace(/^\.+/, '');

  // 4. Collapse whitespace
  baseName = baseName.replace(/\s+/g, ' ').trim();

  // 5. Limit to 100 characters
  if (baseName.length > 100) {
    baseName = baseName.slice(0, 100).trim();
  }

  // 6. Fall back to 'image' when empty
  if (!baseName || baseName.length === 0) {
    return 'image';
  }

  return baseName;
}

/**
 * Resolves case-insensitive filename collisions within a batch in upload order
 * Output names get -1, -2 suffixes deterministically
 * Outputs must not collide case-insensitively with any previously assigned output name
 */
export function resolveBatchOutputNames(rawNames: string[]): string[] {
  const usedNames = new Set<string>();
  const baseCounts = new Map<string, number>();
  const results: string[] = [];

  for (const raw of rawNames) {
    const base = sanitiseFilename(raw);
    const lowerBase = base.toLowerCase();

    // Track how many times this specific base name has appeared
    const occurrence = baseCounts.get(lowerBase) || 0;
    baseCounts.set(lowerBase, occurrence + 1);

    let candidate = occurrence === 0 ? `${base}.jpg` : `${base}-${occurrence}.jpg`;

    // If the candidate name itself is already claimed by an earlier file (e.g. photo-1.avif),
    // append another counter suffix until it is completely unique
    let attempt = 1;
    while (usedNames.has(candidate.toLowerCase())) {
      candidate = `${base}-${attempt}.jpg`;
      attempt++;
      if (usedNames.has(candidate.toLowerCase())) {
        candidate = `${base}-${occurrence}-${attempt}.jpg`;
      }
    }

    usedNames.add(candidate.toLowerCase());
    results.push(candidate);
  }

  return results;
}
