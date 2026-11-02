/**
 * Pixora API Client
 * Interfaces with /api/v1 endpoints
 */

import type { PublicConfig, BatchObject, ConversionOptions } from '../types/index.ts';

const API_BASE = '/api/v1';

export async function fetchConfig(): Promise<PublicConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) {
    throw new Error('Failed to load server configuration');
  }
  return res.json();
}

export function uploadBatchFiles(
  files: File[],
  onProgress: (percent: number, loadedBytes: number, totalBytes: number) => void,
  tool: string = 'avif-to-jpg'
): { promise: Promise<BatchObject>; abort: () => void } {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<BatchObject>((resolve, reject) => {
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent, event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          reject(new Error('Invalid JSON response from server'));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error?.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during file upload. Check your connection.'));
    };

    xhr.onabort = () => {
      reject(new Error('Upload cancelled.'));
    };

    const formData = new FormData();
    formData.append('tool', tool);
    for (const file of files) {
      formData.append('files', file);
    }

    xhr.open('POST', `${API_BASE}/batches`);
    xhr.send(formData);
  });

  return {
    promise,
    abort: () => xhr.abort(),
  };
}

export async function startConversion(
  batchId: string,
  options: ConversionOptions
): Promise<BatchObject> {
  const res = await fetch(`${API_BASE}/batches/${batchId}/conversions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ options }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to start conversion');
  }

  return res.json();
}

export async function fetchBatchStatus(batchId: string): Promise<BatchObject> {
  const res = await fetch(`${API_BASE}/batches/${batchId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const err = new Error(errorData?.error?.message || 'Failed to fetch batch status');
    (err as unknown as { status: number }).status = res.status;
    throw err;
  }
  return res.json();
}

export async function prepareArchive(batchId: string): Promise<BatchObject['archive']> {
  const res = await fetch(`${API_BASE}/batches/${batchId}/archive`, {
    method: 'POST',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error?.message || 'Failed to prepare ZIP archive');
  }

  const data = await res.json();
  return data.archive;
}

export async function deleteBatchFiles(batchId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/batches/${batchId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error('Failed to delete files');
  }
}

export async function checkFileHead(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchSampleAvifFile(): Promise<File> {
  const res = await fetch(`${API_BASE}/sample`);
  if (!res.ok) {
    throw new Error('Failed to retrieve sample AVIF');
  }
  const blob = await res.blob();
  return new File([blob], 'sample-photo.avif', { type: 'image/avif' });
}
