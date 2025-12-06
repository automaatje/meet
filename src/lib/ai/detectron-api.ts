import type { DetectionResult } from '../../types/measurements';

const API_URL = import.meta.env.VITE_DETECTRON2_API_URL;
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 2;

interface ApiErrorResponse {
  error: string;
  details?: string;
}

class DetectronApiError extends Error {
  constructor(message: string, public details?: string) {
    super(message);
    this.name = 'DetectronApiError';
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DetectronApiError(
        'AI analyse duurde te lang, probeer opnieuw',
        'Request timeout'
      );
    }
    throw error;
  }
}

async function retryableFetch(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, API_TIMEOUT);
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError;
}

/**
 * Analyze a facade image using Detectron2 AI model
 * @param imageBase64 - Base64 encoded image string (without data:image prefix)
 * @returns Detection results with facade area, windows, doors, and net area
 * @throws DetectronApiError if API is not configured or request fails
 */
export async function analyzeGevel(
  imageBase64: string
): Promise<DetectionResult> {
  if (!API_URL) {
    throw new DetectronApiError(
      'AI backend niet geconfigureerd',
      'VITE_DETECTRON2_API_URL environment variable not set'
    );
  }

  try {
    const response = await retryableFetch(
      `${API_URL}/analyze`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      }
    );

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      throw new DetectronApiError(
        errorData.error || 'AI analyse mislukt',
        errorData.details
      );
    }

    const result: DetectionResult = await response.json();

    // Validate response structure
    if (
      typeof result.facade_area_m2 !== 'number' ||
      !Array.isArray(result.windows) ||
      !Array.isArray(result.doors)
    ) {
      throw new DetectronApiError(
        'Ongeldige response van AI backend',
        'Response structure validation failed'
      );
    }

    // Check if at least one door was detected (required for calibration)
    if (result.doors.length === 0) {
      throw new DetectronApiError(
        'Geen deur gevonden',
        'Zorg dat deur zichtbaar is voor kalibratie'
      );
    }

    return result;
  } catch (error) {
    if (error instanceof DetectronApiError) {
      throw error;
    }

    if (error instanceof TypeError) {
      throw new DetectronApiError(
        'Controleer internetverbinding',
        'Network error'
      );
    }

    throw new DetectronApiError(
      'Onbekende fout bij AI analyse',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

/**
 * Convert File to base64 string
 * @param file - Image file to convert
 * @returns Promise with base64 string (without data:image prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xyz;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Resize image if it exceeds max size
 * @param file - Image file to resize
 * @param maxSizeMB - Maximum file size in megabytes
 * @returns Promise with original or resized file
 */
export async function resizeImageIfNeeded(
  file: File,
  maxSizeMB: number = 2
): Promise<File> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions to reduce file size
      const scaleFactor = Math.sqrt(maxSizeBytes / file.size);
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to resize image'));
            return;
          }
          const resizedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        'image/jpeg',
        0.9
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}
