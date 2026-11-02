# 🚀 Pixora – AVIF to JPG Converter

> Convert AVIF to JPG. Simple. Fast. Beautiful.

**Pixora** is a modern, privacy-focused, full-stack web application designed to convert AVIF images into high-quality, universally compatible JPG images. It offers batch processing, customizable image quality, transparency handling, live previews, and ZIP downloads through a clean and responsive interface.

\


---

## 🌐 Live Demo

**Try Pixora:** [https://pixoraconverter.netlify.app/](https://pixoraconverter.netlify.app/)

**Source Code:** [https://github.com/Vedantvijayvargiya-06/AVIFTOJPG_Converter](https://github.com/Vedantvijayvargiya-06/AVIFTOJPG_Converter)

---

## ✨ Key Features

- **Batch Image Conversion:** Convert up to 20 AVIF images in a single batch.
- **High-Quality JPEG Output:** Server-side image processing using Sharp and libvips.
- **Custom Quality Control:** Adjustable quality slider from 1–100.
- **Quality Presets:** High (90), Balanced (80), and Compact (70).
- **Transparency Handling:** Flatten transparent images with white, black, or custom HEX backgrounds.
- **Image Preview:** Full-resolution image preview with modal lightbox.
- **ZIP Downloads:** Download all completed conversions in a single ZIP archive.
- **Independent Error Handling:** One failed image does not interrupt the entire batch.
- **Automatic File Cleanup:** Temporary files are automatically removed after the configured retention period.
- **Manual File Deletion:** Delete uploaded and converted files immediately.
- **Dark & Light Themes:** Switch between two visual themes.
- **Responsive Design:** Optimized for mobile, tablet, laptop, and desktop.
- **Privacy Focused:** No registration, passwords, or tracking cookies required.

---

## 🧠 How I Built Pixora – The Vibe Coding Journey

Pixora was developed using an **AI-assisted development approach, commonly known as Vibe Coding**.

Rather than writing the entire application in one go, I followed an iterative development workflow where I used AI tools to translate ideas into requirements, generate and refine code, troubleshoot errors, improve the UI, and build the application step by step.

### 1. Idea & Problem Identification

The project started with a simple problem: AVIF is an efficient modern image format, but it is not universally supported across all applications and workflows.

I wanted to build a simple solution that could convert AVIF images into JPG without requiring users to install additional software.

### 2. Requirement Planning

Before starting implementation, I defined the core functionality:

- AVIF image upload.
- Multiple image support.
- Server-side image conversion.
- Custom JPEG quality settings.
- Transparency background customization.
- Image preview.
- Individual downloads.
- ZIP archive generation.
- Automatic temporary-file cleanup.
- Security and upload validation.

### 3. AI-Assisted Development

I used AI as a development partner throughout the project.

My workflow involved:

1. Explaining the project idea and expected functionality to AI.
2. Converting the requirements into technical implementation tasks.
3. Generating the initial application structure and components.
4. Implementing features through smaller, focused development tasks.
5. Reviewing the generated code and application behaviour.
6. Sharing terminal errors and unexpected behaviour with AI for debugging.
7. Applying fixes and testing the application again.
8. Refining the interface, functionality, and overall user experience.

Instead of relying on a single prompt to generate everything, I used an iterative approach to build, inspect, debug, and improve the application.

### 4. Frontend Development

The frontend was developed using React 19, TypeScript, Vite, and Tailwind CSS v4.

The main focus was to create a clean and intuitive user experience with:

- Simple image upload workflow.
- Batch conversion interface.
- Conversion progress and status feedback.
- Quality settings.
- Background customization.
- Preview modal.
- Download management.
- Responsive layouts.
- Light and dark themes.

### 5. Backend Development

The backend was implemented using Node.js, Express, TypeScript, and Sharp.

I implemented a server-side image processing pipeline to ensure that AVIF decoding and JPEG encoding happen on the server.

The pipeline handles:

- AVIF file validation.
- Image metadata inspection.
- Orientation correction.
- Colour space conversion.
- Transparency flattening.
- JPEG encoding.
- Output file management.

### 6. API Integration

I connected the frontend and backend through RESTful API endpoints under `/api/v1/`.

The API handles uploads, conversion requests, batch status, image previews, individual downloads, ZIP generation, and file deletion.

### 7. Security & Privacy Improvements

During development, I incorporated additional security and privacy considerations:

- Content-based AVIF validation.
- Upload size and batch limits.
- Image pixel limits.
- Generated identifiers for file management.
- Storage path traversal protection.
- EXIF and GPS metadata removal.
- Automatic temporary-file cleanup.
- Manual deletion functionality.

### 8. Testing & Refinement

I followed an iterative testing and debugging process to improve the application.

This included reviewing conversion behaviour, upload validation, quality settings, image previews, download workflows, error handling, and responsive layouts.

The project also includes an automated test command for unit and integration testing.

---

## 🏗️ Technology Stack

| Technology      | Purpose                        |
| --------------- | ------------------------------ |
| React 19        | Frontend UI                    |
| TypeScript      | Type-safe development          |
| Vite            | Development and build tooling  |
| Tailwind CSS v4 | Styling and responsive layouts |
| Lucide React    | Icons                          |
| Node.js         | Backend runtime                |
| Express 4       | REST API                       |
| Sharp           | Image processing               |
| libvips         | Image processing engine        |
| Multer          | File uploads                   |
| Archiver        | ZIP archive generation         |

---

## 🔄 Application Workflow

```text
       USER
        |
        v
  Select AVIF Images
        |
        v
  Frontend Upload
        |
        v
  Backend Validation
        |
        v
  Sharp Image Processing
        |
        v
  AVIF → JPEG Conversion
        |
        v
  Save Temporary Results
        |
        v
  Preview / Download JPG
        |
        v
  Generate ZIP Archive
        |
        v
  Automatic File Cleanup
```

---

## 📡 REST API Endpoints

All endpoints are versioned under `/api/v1/`.

| Method | Endpoint                                   | Description                |
| ------ | ------------------------------------------ | -------------------------- |
| GET    | `/health`                                  | Service and storage health |
| GET    | `/config`                                  | Application configuration  |
| GET    | `/sample`                                  | AVIF sample generator      |
| POST   | `/batches`                                 | Upload image batch         |
| POST   | `/batches/:batchId/conversions`            | Start conversion           |
| GET    | `/batches/:batchId`                        | Get batch status           |
| GET    | `/batches/:batchId/files/:fileId/preview`  | Preview converted image    |
| GET    | `/batches/:batchId/files/:fileId/download` | Download JPG               |
| POST   | `/batches/:batchId/archive`                | Generate ZIP archive       |
| GET    | `/batches/:batchId/archive`                | Download ZIP archive       |
| DELETE | `/batches/:batchId`                        | Delete batch files         |

---

## 🔒 Security & Privacy

Pixora is designed with privacy and secure file handling in mind.

**1. Content-Based Validation**

Validates AVIF files using ISO-BMFF `ftyp` signatures and image decoder metadata rather than trusting file extensions alone.

**2. Decompression Bomb Protection**

Rejects images exceeding the configured maximum pixel limit before processing.

**3. Path Traversal Protection**

Uses cryptographically generated identifiers and restricts file access to the relevant storage directory.

**4. Metadata Sanitisation**

Removes EXIF, GPS coordinates, and other source metadata from generated JPEG files.

**5. Automatic Cleanup**

Original uploads are deleted after conversion, while generated files and ZIP archives are automatically purged after the configured retention period.

**6. Manual Deletion**

Users can immediately delete their batch data through the application.

---

## ⚙️ Run Locally

### Prerequisites

- Node.js 20+
- npm 10+

### 1. Clone Repository

```bash
git clone https://github.com/Vedantvijayvargiya-06/AVIFTOJPG_Converter.git

cd AVIFTOJPG_Converter
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable               | Default       | Description             |
| ---------------------- | ------------- | ----------------------- |
| `PORT`                 | `3000`        | Server port             |
| `STORAGE_DIR`          | `/tmp/pixora` | Temporary storage       |
| `MAX_FILE_SIZE_MB`     | `25`          | Maximum file size       |
| `MAX_FILES_PER_BATCH`  | `20`          | Maximum files per batch |
| `MAX_BATCH_TOTAL_MB`   | `150`         | Maximum batch size      |
| `DEFAULT_JPEG_QUALITY` | `90`          | Default JPEG quality    |
| `RETENTION_MINUTES`    | `30`          | Cleanup retention       |

### 4. Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 5. Production Build

```bash
npm run build
```

Start production server:

```bash
npm start
```

### 6. Run Tests

```bash
npm test
```

---

## 🧪 Testing Checklist

- [ ] Single AVIF image conversion.
- [ ] Multiple image batch conversion.
- [ ] Invalid file upload validation.
- [ ] Maximum file size validation.
- [ ] Maximum batch size validation.
- [ ] JPEG quality presets.
- [ ] Custom quality settings.
- [ ] Transparency background options.
- [ ] Full-resolution image preview.
- [ ] Individual JPG downloads.
- [ ] ZIP archive generation and download.
- [ ] Manual batch deletion.
- [ ] Automatic file cleanup.
- [ ] Responsive layout testing.
- [ ] Light and dark theme testing.

---

## 🚀 Deployment

The public Pixora frontend demo is available at:

**[https://pixoraconverter.netlify.app/](https://pixoraconverter.netlify.app/)**

The source code is hosted on GitHub.

The application uses a Node.js/Express backend for image processing. A static frontend deployment alone does not provide the backend API, so production deployment requires a compatible backend hosting environment and correct API configuration.

---

## 🎯 What I Learned

Building Pixora helped me gain practical experience in:

- AI-assisted software development and vibe coding.
- Converting project ideas into technical requirements.
- React and TypeScript development.
- Backend development with Node.js and Express.
- REST API design and integration.
- File upload and validation.
- Server-side image processing.
- ZIP archive generation.
- Error handling and debugging.
- Security and privacy considerations.
- Responsive UI development.
- Testing and iterative refinement.

---

## 👨‍💻 Author

**Vedant Vijayvargiya**

- GitHub: [@Vedantvijayvargiya-06](https://github.com/Vedantvijayvargiya-06)
- Project Repository: [AVIFTOJPG_Converter](https://github.com/Vedantvijayvargiya-06/AVIFTOJPG_Converter)
- Live Demo: [Pixora Converter](https://pixoraconverter.netlify.app/)

---

\<p align="center">
&#x20; \*\*Pixora – Convert Images. Keep It Simple.\*\*
&#x20; \<br>
&#x20; Built with curiosity, creativity, and AI-assisted development.
\</p>
