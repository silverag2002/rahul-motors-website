export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  thumbnailUrl?: string;
}

export interface Godown {
  id: number;
  name: string;
  location?: string;
}

export interface Inventory {
  id: number;
  quantity: number;
  godown: Godown;
}

export interface Category {
  id: number;
  documentId: string;
  name: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  brand?: string;
  minimumSellingPrice?: number;
  purchasePrice?: number;
  images: ProductImage[];
  inventory: Inventory[];
  categories: Category[];
}

export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateProductData {
  name: string;
  minimum_selling_price: number;
  purchase_price: number;
  description: string;
  brand: string;
  car_name: string;
  part_no: string;
  categories: number[];
  inventory: Array<{
    godownId: number;
    quantity: number;
  }>;
  imageIds: number[];
}

export interface UpdateInventoryData {
  productId: number;
  quantity: number;
  godownId: number;
}
