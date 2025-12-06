export interface MeasurementData {
  project_id: string;
  photo_url: string;
  wall_area_m2: number;
  doors_area_m2: number;
  windows_area_m2: number;
  net_area_m2: number;
  reference_height: number;
  notes: string;
}

export interface DetectedObject {
  id: number;
  type: 'window' | 'door';
  area_m2: number;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface DetectionResult {
  facade_area_m2: number;
  windows: Array<{ id: number; area_m2: number; confidence: number }>;
  doors: Array<{ id: number; area_m2: number; confidence: number }>;
  total_windows_area_m2: number;
  total_doors_area_m2: number;
  net_area_m2: number;
}
