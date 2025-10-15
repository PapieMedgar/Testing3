import { API_BASE_URL } from './api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_path?: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
  category_count?: number;
  categories?: Category[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  brand_id: number;
  created_at: string;
  updated_at?: string;
  product_count?: number;
  products?: Product[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku?: string;
  price?: number;
  image_path?: string;
  brand_id: number;
  category_id?: number;
  category_name?: string;
  brand_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateBrandInput {
  name: string;
  description?: string;
  categories?: Array<{
    id?: number;
    name: string;
    description?: string;
    products?: Array<{
      id?: number;
      name: string;
      description?: string;
    }>;
  }>;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  products?: Array<{
    name: string;
    description?: string;
  }>;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  brand_id: number;
  category_id?: number;
}

export const brandAPI = {
  // Brand operations
  getAllBrands: async (): Promise<Brand[]> => {
    const response = await fetch(`${API_BASE_URL}/brands`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch brands');
    }
    
    return response.json();
  },
  
  getBrand: async (brandId: number): Promise<Brand> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch brand');
    }
    
    return response.json();
  },
  
  createBrand: async (data: CreateBrandInput): Promise<Brand> => {
    const response = await fetch(`${API_BASE_URL}/brands`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create brand');
    }
    
    return response.json();
  },
  
  updateBrand: async (brandId: number, data: Partial<CreateBrandInput>): Promise<Brand> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update brand');
    }
    
    return response.json();
  },
  
  deleteBrand: async (brandId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete brand');
    }
  },
  
  uploadBrandLogo: async (brandId: number, logoFile: File): Promise<{ logo_path: string }> => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/logo`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload brand logo');
    }
    
    return response.json();
  },
  
  // Category operations
  getBrandCategories: async (brandId: number): Promise<Category[]> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/categories`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch brand categories');
    }
    
    return response.json();
  },
  
  getCategory: async (categoryId: number): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch category');
    }
    
    return response.json();
  },
  
  createCategory: async (brandId: number, data: CreateCategoryInput): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create category');
    }
    
    return response.json();
  },
  
  updateCategory: async (categoryId: number, data: Partial<CreateCategoryInput>): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update category');
    }
    
    return response.json();
  },
  
  deleteCategory: async (categoryId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete category');
    }
  },
  
  // Product operations
  getBrandProducts: async (brandId: number): Promise<Product[]> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/products`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch brand products');
    }
    
    return response.json();
  },
  
  getCategoryProducts: async (categoryId: number): Promise<Product[]> => {
    // Try the agent endpoint first, then fall back to the regular endpoint if needed
    try {
      const response = await fetch(`${API_BASE_URL}/agent/categories/${categoryId}/products`, {
        headers: getAuthHeaders(),
      });
      
      if (response.ok) {
        return response.json();
      }
      
      // If agent endpoint fails, try the regular endpoint
      const fallbackResponse = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`, {
        headers: getAuthHeaders(),
      });
      
      if (!fallbackResponse.ok) {
        throw new Error('Failed to fetch category products');
      }
      
      return fallbackResponse.json();
    } catch (error) {
      console.error('Error fetching category products:', error);
      throw new Error('Failed to fetch category products');
    }
  },
  
  getProduct: async (productId: number): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/brands/products/${productId}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    
    return response.json();
  },
  
  createProduct: async (brandId: number, data: Omit<CreateProductInput, 'brand_id'>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/brands/${brandId}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...data,
        brand_id: brandId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
    
    return response.json();
  },
  
  createProductInCategory: async (categoryId: number, data: Omit<CreateProductInput, 'brand_id' | 'category_id'>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product in category');
    }
    
    return response.json();
  },
  
  updateProduct: async (productId: number, data: Partial<CreateProductInput>): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/brands/products/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    
    return response.json();
  },
  
  deleteProduct: async (productId: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/brands/products/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
  },
  
  uploadProductImage: async (productId: number, imageFile: File): Promise<{ image_path: string }> => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/brands/products/${productId}/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload product image');
    }
    
    return response.json();
  },
};