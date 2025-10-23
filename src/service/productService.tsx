import {appAxios} from './apiInterceptors';

// API Response Types
export interface ProductCategory {
  idProductCategory: number;
  txCategoryName: string;
  txSlug: string;
  txDescription: string;
  txLongDescription: string;
  txImageUrl: string;
  txThumbnailUrl: string;
  flActive: boolean;
  idUserCreated: number;
  dtCreated: string;
  idUserUpdated: number;
  dtUpdated: string;
  idTenant: number;
}

export interface ProductCategoriesResponse {
  data: ProductCategory[];
  status: string;
  error: any;
  success: boolean;
}

// Product API Response Types
export interface Product {
  idProduct: number;
  idProductCategory: number;
  nmProduct: string;
  txSlug: string;
  txDescription: string;
  txLongDescription: string;
  txImageUrl: string;
  txThumbnailUrl: string;
  nbMaxPrice: number;
  nbDiscount: number;
  nbSellingPrice: number;
  flActive: boolean;
  idUserCreated: number;
  dtCreated: string;
  idUserUpdated: number;
  dtUpdated: string;
  idTenant: number;
}

export interface ProductsByCategoryResponse {
  data: Product[];
  status: string;
  error: any;
  success: boolean;
}

// Transformed Category Type for UI
export interface TransformedCategory {
  _id: number;
  id: number;
  name: string;
  image: string;
  slug: string;
  description: string;
  longDescription: string;
  thumbnailUrl: string;
  isActive: boolean;
}

export const getAllCategories = async () => {
  try {
    const response = await appAxios.get('categories');
    return response.data;
  } catch (error) {
    return [];
  }
};

export const getProductsByCategoryId = async (
  categoryId: string,
): Promise<ProductsByCategoryResponse> => {
  try {
    const response = await appAxios.get(`products/category/${categoryId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    return {data: [], status: 'ERROR', error: error, success: false};
  }
};

export const getProductCategories =
  async (): Promise<ProductCategoriesResponse> => {
    try {
      const response = await appAxios.get('product-categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching product categories:', error);
      return {data: [], status: 'ERROR', error: error, success: false};
    }
  };

// Search Products API Response Type
export interface SearchProductsResponse {
  data: Product[];
  status: string;
  error: any;
  success: boolean;
}

export const searchProducts = async (
  productName: string,
): Promise<SearchProductsResponse> => {
  try {
    const response = await appAxios.get(
      `products/search?productName=${encodeURIComponent(productName)}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error searching products:', error);
    return {data: [], status: 'ERROR', error: error, success: false};
  }
};

// Get all products
export interface GetAllProductsResponse {
  data: Product[];
  status: string;
  error: any;
  success: boolean;
}

export const getAllProducts = async (): Promise<GetAllProductsResponse> => {
  try {
    // API: GET /api/products (baseURL already includes /api/)
    const response = await appAxios.get('products');
    return response.data;
  } catch (error) {
    console.error('Error fetching all products:', error);
    return {data: [], status: 'ERROR', error: error, success: false};
  }
};
