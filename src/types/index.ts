export interface User {
  id: number;
  username: string;
  email: string;
  name?: string;
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
  carName?: string;
  partNo?: string;
  minimumSellingPrice?: number;
  purchasePrice?: number;
  images: ProductImage[];
  inventory: Inventory[];
  categories: Category[];
}

export interface AuditLog {
  id: number;
  action: string;
  description?: string;
  quantity?: number;
  quantityChange?: number;
  previousQuantity?: number;
  newQuantity?: number;
  currentQuantity?: number;
  createdAt: string;
  date_time?: string;
  product?: { id: number; name: string; brand?: string };
  user?: { id: number; email: string; name?: string; username?: string };
  godown?: { id: number; name: string };
  category?: { id: number; name: string };
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
  minimum_selling_price?: number | null;
  purchase_price?: number | null;
  description?: string;
  brand?: string;
  car_name?: string;
  part_no?: string;
  categories: number[];
  inventory: Array<{
    godownId: number;
    quantity: number;
  }>;
  imageIds: number[];
}

export interface UpdateProductData {
  name?: string;
  minimum_selling_price?: number | null;
  purchase_price?: number | null;
  description?: string | null;
  brand?: string | null;
  car_name?: string | null;
  part_no?: string | null;
  categories?: number[];
  imageIds?: number[];
}

export interface UpdateInventoryData {
  productId: number;
  quantity: number;
  godownId: number;
}

export interface TransferGodownData {
  productId: number;
  fromGodownId: number;
  toGodownId: number;
  quantity?: number;
}

export interface ExportOptions {
  fields: string[];
  format: "pdf" | "excel";
  email?: string;
}

export interface SearchParams {
  q?: string;
  name?: string;
  brand?: string;
  category?: string;
  categoryId?: number;
  godownId?: number;
  partNo?: string;
  minQuantity?: number;
  maxQuantity?: number;
  page?: number;
  pageSize?: number;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  user_type: "super_admin" | "admin" | "user";
  createdAt: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  user_type: "super_admin" | "admin" | "user";
  confirmed: boolean;
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  user_type?: "super_admin" | "admin" | "user";
  confirmed?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}
