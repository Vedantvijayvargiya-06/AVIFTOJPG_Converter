# Pixora – AVIF to JPG Converter

> Convert AVIF to JPG. Simple. Fast. Beautiful.

Pixora is a production-ready web application for converting AV1 Image File Format (`.avif`) photos into universally compatible JPEG images with high visual fidelity, fine-grained quality control, and store-only ZIP packaging.

---

## 🌟 Key Features

- **Real Server-Side Sharp Pipeline**: Native AV1 decoding with libheif/libaom, auto-orientation (EXIF/irot), sRGB color conversion, and MozJPEG encoding.
- **Batch Processing**: Convert up to 20 images at once with concurrent queue processing and independent failure isolation.
- **Alpha Transparency Flattening**: Composite transparent AVIF assets over white, black, or custom 6-digit hex backgrounds.
- **Precision Quality Settings**: Quality slider (1–100) with High (90), Balanced (80), and Compact (70) presets, maintaining 4:4:4 chroma subsampling at high qualities.
- **Full Image Preview**: Built-in modal lightbox with 100% resolution zoom and Escape dismissal.
- **Store-Only ZIP Download**: Instant packaging of completed conversions with collision-free naming (`pixora-converted-YYYYMMDD-HHmmss.zip`).
- **Private by Design**:
  - Original AVIF files are deleted immediately after conversion.
  - Converted JPEG files and ZIP archives are automatically purged after 30 minutes.
  - User-initiated "Delete my files now" button for immediate erasure.
  - No user accounts, passwords, or tracking cookies.
- **Accessible & Responsive**: Fully responsive from 320px to 1920px+, dual theme (Light / Dark mode), ARIA live regions, and WCAG AA contrast.

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Node.js LTS, Express 4, TypeScript (`tsx`), Sharp (libvips), Multer, Archiver.
- **API**: RESTful `/api/v1/` endpoints with capability URLs and ISO-BMFF content validation.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (Active LTS)
- npm 10+

### 1. Installation

```bash
# Clone the repository and install dependencies
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port for Express and Vite dev server |
| `STORAGE_DIR` | `/tmp/pixora` | Temporary file storage root |
| `MAX_FILE_SIZE_MB` | `25` | Max upload size per file (MB) |
| `MAX_FILES_PER_BATCH` | `20` | Max number of files per batch |
| `MAX_BATCH_TOTAL_MB` | `150` | Max cumulative batch size (MB) |
| `DEFAULT_JPEG_QUALITY` | `90` | Default JPEG compression quality |
| `RETENTION_MINUTES` | `30` | Minutes before automatic cleanup |

### 3. Run Locally

```bash
# Start the full-stack application (Express API + Vite on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
# Compile TypeScript and bundle frontend
npm run build

# Start production server
npm start
```

### 5. Running Automated Tests

```bash
# Run unit and integration tests
npm test
```

---

## 📡 REST API Endpoints

All endpoints are versioned under `/api/v1`:

- `GET /api/v1/health` — Service liveness and storage health
- `GET /api/v1/config` — Public limits and default settings
- `GET /api/v1/sample` — Real AVIF test sample generator
- `POST /api/v1/batches` — Multipart file upload and ISO-BMFF validation
- `POST /api/v1/batches/:batchId/conversions` — Start queued conversion
- `GET /api/v1/batches/:batchId` — Polling status and file results
- `GET /api/v1/batches/:batchId/files/:fileId/preview` — Converted JPEG stream (inline)
- `GET /api/v1/batches/:batchId/files/:fileId/download` — Converted JPEG attachment
- `POST /api/v1/batches/:batchId/archive` — Generate store-only ZIP archive
- `GET /api/v1/batches/:batchId/archive` — Download generated ZIP archive
- `DELETE /api/v1/batches/:batchId` — Immediate deletion of all batch files

---

## 🔒 Security & Privacy Guarantees

1. **Content-Based Verification**: File types are validated by inspecting the first 32 bytes for ISO-BMFF `ftyp` brand signatures (`avif`/`avis`) and Sharp decoder metadata, preventing MIME or extension spoofing.
2. **Decompression Bomb Protection**: Input images exceeding 50 megapixels (`MAX_INPUT_PIXELS`) are rejected prior to decoding.
3. **Path Traversal Defenses**: All file lookups resolve strictly inside `<STORAGE_DIR>/<batchId>/` using cryptographically generated IDs (`bch_*`, `fil_*`).
4. **Metadata Sanitisation**: EXIF, GPS coordinates, and camera profiles are stripped from all JPEG outputs.
