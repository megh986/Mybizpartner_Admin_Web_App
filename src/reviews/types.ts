// Shared types for Review Management (Reviews + Stats tabs)

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

export interface ReviewImage {
  id?: string;
  filename?: string;
  content_type?: string;
  s3_url?: string;
}

export interface Review {
  _id?: string;
  review_index?: number;
  original_index?: number;
  company_id?: string;
  product_id?: string;
  title?: string;
  review_text?: string;
  date?: string;
  location?: string;
  user_name?: string;
  rating?: string | number;
  verified_batch?: boolean;
  insertion?: boolean;
  product_description?: unknown;
  images?: ReviewImage[] | string[];
  [key: string]: unknown;
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  reviews?: Review[];
  total_reviews?: number;
  overall_rating?: number;
  company_info?: string;
  highlights?: {
    keywords?: string[];
    summary?: string;
  };
  customer_mentions?: string[];
  social_proof_keywords?: string[];
  extras?: { return_rate?: string };
}

export interface ImageInfo {
  image_id: string;
  s3_url: string;
  review_index: number;
  filename?: string;
  uploaded_at?: string;
  original_size?: number;
  compressed_size?: number;
  compression_ratio?: number;
}

export interface ProductStats {
  product_id: string;
  product_name: string;
  image_count: number;
  images: ImageInfo[];
}

export interface StatsResponse {
  success: boolean;
  message?: string;
  company_id?: string;
  company_name?: string;
  product_id?: string;
  product_name?: string;
  total_images: number;
  total_products?: number;
  products?: ProductStats[];
  images?: ImageInfo[];
}

export type StatsOption = 'company' | 'product';
