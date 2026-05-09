// Shared types for Assets (Product Mapping, Instagram Reel, Content)

export interface Company {
  _id: string;
  name: string;
  company_id: string;
}

export interface Product {
  _id: string;
  name: string;
  product_id: string;
  company_id: string;
}

export interface VideoItem {
  id: string;
  filename: string;
  url: string;
  content_type?: string;
  file_size?: number;
  display_locations?: string[];
  uploaded_at?: string;
}

export interface ImageItem {
  review_index: number;
  image_id: string;
  s3_url: string;
  filename?: string;
}

export interface ExistingContent {
  company_videos?: VideoItem[];
  product_videos?: Record<string, VideoItem[]>;
  images?: ImageItem[] | string[];
  urls?: string[];
  total_count?: number;
}

export interface ProductMappingRow {
  id?: string;
  product_id: string;
  amazon_link?: string;
  myntra_link?: string;
  amazon_status?: string;
  myntra_status?: string;
  amazon_review_urls?: string[];
  myntra_review_urls?: string[];
  updated_at?: string;
}

export type ContentType = 'review' | 'whatsapp' | 'company-video' | 'product-video';
export type ContentAction = 'upload' | 'delete' | 'view';
export type DeleteOption = 'company' | 'product';
