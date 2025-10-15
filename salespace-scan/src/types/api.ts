export interface ConsumerDetails {
  cellphoneNumber: string;
  consumerName: string;
  consumerSurname: string;
  idPassportNumber: string;
}

export interface BettingInfo {
  isBettingSomewhere: string;
  likesGoldrush: string;
  platformSuggestions?: string;
  usedGoldrushBefore: string;
}

export interface BrandInfo {
  brandInfoGiven: string;
}

export interface VisitResponses {
  personName?: string;
  additionalNotes?: string;
  bettingInfo?: BettingInfo;
  brandInfo?: BrandInfo;
  consumerDetails?: ConsumerDetails;
  conversion?: {
    converted: string;
  };
  [key: string]: any;
}

export interface Visit {
  id: number;
  shop_id: number | null;
  timestamp: string;
  photo_path?: string;
  notes?: string;
  status: string;
}

export interface Response {
  visit_type: 'individual' | 'customer';
  created_at: string;
  responses: VisitResponses;
}

export interface Shop {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  name: string;
  brand_id: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  description?: string;
  price?: number;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}
