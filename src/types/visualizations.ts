export interface DetectedObject {
  object_id: number;
  type: 'window' | 'door' | 'exterior_door';
  bbox: [number, number, number, number];
  confidence: number;
  area_m2: number;
}

export interface ProductSelection {
  object_id: number;
  product_id: string;
}

export interface VisualizationData {
  project_id: string;
  original_photo_url: string;
  visualization_photo_url?: string;
  detected_objects: DetectedObject[];
  selected_product_id?: string;
}

export interface VisualizationRequest {
  original_image: string;
  detections: Array<{
    object_id: number;
    bbox: [number, number, number, number];
    product_image: string;
  }>;
}

export interface VisualizationResult {
  before_image: string;
  after_image: string;
}
