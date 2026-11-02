import sharp from 'sharp';

/**
 * Generates a real, valid AVIF image buffer with text/gradient elements and alpha transparency
 * Useful for user testing, demo button, and test fixtures
 */
export async function generateSampleAvif(
  width: number = 800,
  height: number = 600,
  hasAlpha: boolean = true
): Promise<Buffer> {
  const svgOverlay = Buffer.from(`
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:0.9" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" rx="24" />
      <circle cx="${width / 2}" cy="${height / 2 - 30}" r="90" fill="#FFFFFF" fill-opacity="0.15" />
      <text x="${width / 2}" y="${height / 2 - 15}" font-family="sans-serif" font-size="44" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
        PIXORA
      </text>
      <text x="${width / 2}" y="${height / 2 + 35}" font-family="sans-serif" font-size="20" fill="#E0E7FF" text-anchor="middle">
        High-Fidelity AVIF Image Sample
      </text>
      <text x="${width / 2}" y="${height / 2 + 80}" font-family="sans-serif" font-size="16" fill="#C7D2FE" text-anchor="middle">
        ${width} × ${height} px · AV1 Encoded
      </text>
    </svg>
  `);

  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: hasAlpha ? { r: 15, g: 23, b: 42, alpha: 0 } : { r: 15, g: 23, b: 42, alpha: 1 },
    },
  })
    .composite([{ input: svgOverlay, top: 0, left: 0 }])
    .avif({ quality: 80, effort: 3 })
    .toBuffer();
}
