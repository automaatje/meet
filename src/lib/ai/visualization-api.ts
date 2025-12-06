import type { VisualizationRequest, VisualizationResult } from '../../types/visualizations';

const VISUALIZATION_API_URL = import.meta.env.VITE_VISUALIZATION_API_URL;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 40000;

export class VisualizationAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VisualizationAPIError';
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
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateVisualization(
  request: VisualizationRequest
): Promise<VisualizationResult> {
  if (!VISUALIZATION_API_URL) {
    throw new VisualizationAPIError(
      'VITE_VISUALIZATION_API_URL is niet geconfigureerd. Voeg deze toe aan je .env file.'
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(
        VISUALIZATION_API_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        },
        TIMEOUT_MS
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Onbekende fout');
        throw new VisualizationAPIError(
          `API fout (${response.status}): ${errorText}`
        );
      }

      const result = await response.json();

      if (!result.before_image || !result.after_image) {
        throw new VisualizationAPIError(
          'Ongeldige API response: before_image of after_image ontbreekt'
        );
      }

      return {
        before_image: result.before_image,
        after_image: result.after_image,
      };
    } catch (error) {
      lastError = error as Error;

      if (error instanceof Error && error.name === 'AbortError') {
        throw new VisualizationAPIError(
          'Visualisatie generatie duurde te lang (timeout na 40 seconden)'
        );
      }

      if (attempt === MAX_RETRIES) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }

  throw new VisualizationAPIError(
    lastError?.message || 'Kon visualisatie niet genereren na meerdere pogingen'
  );
}

export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new VisualizationAPIError(
      `Kon afbeelding niet laden: ${error instanceof Error ? error.message : 'Onbekende fout'}`
    );
  }
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
