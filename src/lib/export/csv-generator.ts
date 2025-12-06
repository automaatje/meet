import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  fieldMapping: Record<string, string>;
}

export function generateCSV(data: any[], fieldMapping: Record<string, string>): string {
  const mappedData = data.map(item => {
    const mapped: any = {};
    Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
      const value = getNestedValue(item, sourceField);
      mapped[targetField] = value !== null && value !== undefined ? value : '';
    });
    return mapped;
  });

  const csv = Papa.unparse(mappedData, {
    delimiter: ',',
    header: true,
    skipEmptyLines: false
  });

  return csv;
}

export function generateJSON(data: any[], fieldMapping: Record<string, string>): string {
  const mappedData = data.map(item => {
    const mapped: any = {};
    Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
      const value = getNestedValue(item, sourceField);
      mapped[targetField] = value;
    });
    return mapped;
  });

  return JSON.stringify(mappedData, null, 2);
}

export function generateExcelCSV(data: any[], fieldMapping: Record<string, string>): string {
  const mappedData = data.map(item => {
    const mapped: any = {};
    Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
      const value = getNestedValue(item, sourceField);
      mapped[targetField] = value !== null && value !== undefined ? value : '';
    });
    return mapped;
  });

  const csv = Papa.unparse(mappedData, {
    delimiter: ';',
    header: true,
    skipEmptyLines: false
  });

  return '\uFEFF' + csv;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
  saveAs(blob, filename);
}

export function exportData(data: any[], options: ExportOptions): void {
  let content: string;
  let mimeType: string;
  let filename = options.filename;

  switch (options.format) {
    case 'csv':
      content = generateCSV(data, options.fieldMapping);
      mimeType = 'text/csv';
      filename = filename.endsWith('.csv') ? filename : filename + '.csv';
      break;
    case 'xlsx':
      content = generateExcelCSV(data, options.fieldMapping);
      mimeType = 'text/csv';
      filename = filename.endsWith('.csv') ? filename : filename + '.csv';
      break;
    case 'json':
      content = generateJSON(data, options.fieldMapping);
      mimeType = 'application/json';
      filename = filename.endsWith('.json') ? filename : filename + '.json';
      break;
    default:
      throw new Error('Unsupported export format');
  }

  downloadFile(content, filename, mimeType);
}

export function getPreviewData(data: any[], fieldMapping: Record<string, string>, limit: number = 5): any[] {
  return data.slice(0, limit).map(item => {
    const mapped: any = {};
    Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
      const value = getNestedValue(item, sourceField);
      mapped[targetField] = value !== null && value !== undefined ? value : '';
    });
    return mapped;
  });
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('nl-NL');
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}
