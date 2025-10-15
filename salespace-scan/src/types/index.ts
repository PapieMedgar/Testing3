import { Brand, Category, Product, Shop, VisitResponses } from './api';

export interface User {
  id: number;
  name: string;
  phone: string;
  role: 'ADMIN' | 'MANAGER' | 'AGENT';
  manager?: {
    id: number;
    name: string;
    phone: string;
  };
}

export interface CheckIn {
  id: number;
  agent_id: number;
  agent?: User;
  manager?: User;
  shop_id?: number;
  shop?: Shop;
  timestamp: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  additional_photos?: string[];
  notes?: string;
  status: string;
  visit_type: 'individual' | 'customer';
  visit_response?: {
    id: number;
    visit_type: 'individual' | 'customer';
    responses: VisitResponses;
    created_at: string;
  };
  brand?: Brand;
  category?: Category;
  product?: Product;
}

export interface SurveyResponse {
  question: string;
  answer: string;
}
