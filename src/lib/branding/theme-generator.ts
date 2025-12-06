export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface ThemeFonts {
  family: string;
  baseSize: number;
}

export interface Theme {
  colors: ThemeColors;
  fonts: ThemeFonts;
  custom_css?: string;
}

export const PRESET_THEMES: Record<string, ThemeColors> = {
  'Standaard Blauw': {
    primary: '#2563EB',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  Groen: {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  Paars: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#EC4899',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  Rood: {
    primary: '#EF4444',
    secondary: '#DC2626',
    accent: '#F59E0B',
    background: '#FFFFFF',
    text: '#1F2937',
  },
  Donker: {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    background: '#111827',
    text: '#F9FAFB',
  },
};

export const AVAILABLE_FONTS = [
  { value: 'Inter', label: 'System Default (Inter)' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
];

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  // Remove any existing inline styles first
  root.style.removeProperty('--color-primary');
  root.style.removeProperty('--color-secondary');
  root.style.removeProperty('--color-accent');
  root.style.removeProperty('--color-background');
  root.style.removeProperty('--color-text');

  // Set CSS variables on :root
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-text', theme.colors.text);

  if (theme.fonts) {
    root.style.setProperty('--font-family', theme.fonts.family);
    root.style.setProperty('--font-base-size', `${theme.fonts.baseSize}px`);
  }

  if (theme.custom_css) {
    injectCustomCSS(theme.custom_css);
  }

  // Debug log - remove this later if needed
  console.log('Theme applied successfully:', {
    colors: theme.colors,
    fonts: theme.fonts,
  });
}

export function injectCustomCSS(css: string) {
  const existingStyle = document.getElementById('custom-branding-css');
  if (existingStyle) {
    existingStyle.remove();
  }

  const sanitizedCSS = sanitizeCSS(css);

  const style = document.createElement('style');
  style.id = 'custom-branding-css';
  style.textContent = sanitizedCSS;
  document.head.appendChild(style);
}

export function sanitizeCSS(css: string): string {
  const disallowedPatterns = [
    /<script/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /@import/gi,
  ];

  let sanitized = css;
  for (const pattern of disallowedPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized;
}

export function calculateContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isAccessible(primaryColor: string, backgroundColor: string): boolean {
  const contrast = calculateContrast(primaryColor, backgroundColor);
  return contrast >= 4.5;
}

export function generateFaviconFromLogo(logoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, 32, 32);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          resolve(url);
        } else {
          reject(new Error('Could not generate favicon'));
        }
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Failed to load logo'));
    img.src = logoUrl;
  });
}

export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  const maxSize = 500 * 1024;

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen PNG, JPG en SVG bestanden zijn toegestaan' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Bestand mag maximaal 500KB zijn' };
  }

  return { valid: true };
}

export function validateFaviconFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/png', 'image/x-icon'];
  const maxSize = 100 * 1024;

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Alleen PNG en ICO bestanden zijn toegestaan' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Bestand mag maximaal 100KB zijn' };
  }

  return { valid: true };
}
