export type ObjectType = 'window' | 'door' | 'exterior_door';

export interface DetectedObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Visualization {
  id: string;
  project_id: string;
  original_photo_url: string;
  visualization_photo_url: string | null;
  detected_objects: DetectedObject[];
  selected_product_id: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  category: ObjectType;
  name: string;
  brand: string | null;
  product_image_url: string;
  price: number | null;
  color: string | null;
  style: string | null;
  description: string | null;
  created_at: string;
}
