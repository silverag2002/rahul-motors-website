import axios from "axios";
import { API_BASE_URL } from "./constants";
import {
  AuthResponse,
  LoginCredentials,
  Product,
  Category,
  Godown,
  CreateProductData,
  UpdateProductData,
  UpdateInventoryData,
  AuditLog,
  ExportOptions,
  PaginatedResult,
  SearchParams,
  AdminUser,
  CreateUserData,
  UpdateUserData,
} from "../types";

const api = axios.create({ baseURL: API_BASE_URL });

const authHeader = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });

function mapProduct(json: any): Product {
  return {
    id: json.id,
    name: json.name || "",
    description: json.description,
    brand: json.brand,
    carName: json.car_name,
    partNo: json.part_no,
    minimumSellingPrice:
      json.minimum_selling_price != null && json.minimum_selling_price !== ""
        ? Number(json.minimum_selling_price)
        : undefined,
    purchasePrice:
      json.purchase_price != null && json.purchase_price !== ""
        ? Number(json.purchase_price)
        : undefined,
    images: (json.images || []).map((img: any) => ({
      url: img.url,
      thumbnailUrl: img.formats?.thumbnail?.url,
    })),
    inventory: (json.inventory || []).map((inv: any) => ({
      id: inv.id,
      quantity: inv.quantity || 0,
      godown: { id: inv.godown?.id, name: inv.godown?.name || "", location: inv.godown?.location },
    })),
    categories: (json.categories || []).map((cat: any) => ({
      id: cat.id,
      documentId: cat.documentId || "",
      name: cat.name || "",
      imageUrl: cat.image?.formats?.medium?.url || cat.image?.url,
    })),
  };
}

// Auth Service
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/login-user", credentials);
    return response.data;
  },
  async sendOtp(email: string): Promise<void> {
    await api.post("/auth/send-otp", { email });
  },
  async verifyOtpLogin(email: string, otp: string): Promise<AuthResponse> {
    const response = await api.post("/auth/verify-otp-login", { email, otp });
    return response.data;
  },
};

// Product Service
export const productService = {
  async searchProducts(
    jwt: string,
    params?: SearchParams
  ): Promise<PaginatedResult<Product>> {
    const response = await api.get("/search/products", {
      params: {
        ...params,
        page: params?.page || 1,
        pageSize: params?.pageSize || 25,
      },
      headers: authHeader(jwt),
    });
    const data = response.data.data.map(mapProduct);
    const meta = response.data.meta;
    return {
      data,
      meta: {
        total: meta.total || data.length,
        page: meta.page || 1,
        pageSize: meta.pageSize || 25,
        pageCount: meta.pageCount || 1,
      },
    };
  },

  async getProductDetails(jwt: string, productId: number): Promise<Product> {
    const response = await api.get(`/products/${productId}?populate=*`, {
      headers: authHeader(jwt),
    });
    return mapProduct(response.data.data);
  },

  async createProduct(jwt: string, data: CreateProductData): Promise<Product> {
    const response = await api.post("/products", data, {
      headers: authHeader(jwt),
    });
    return mapProduct(response.data.data);
  },

  async updateProduct(jwt: string, productId: number, data: UpdateProductData): Promise<Product> {
    const response = await api.put(`/products/${productId}`, data, {
      headers: authHeader(jwt),
    });
    return mapProduct(response.data.data);
  },

  async deleteProduct(jwt: string, productId: number): Promise<void> {
    await api.delete(`/products/${productId}`, { headers: authHeader(jwt) });
  },

  async updateInventory(jwt: string, data: UpdateInventoryData): Promise<void> {
    await api.put("/product/inventory", data, { headers: authHeader(jwt) });
  },

  async bulkZeroQuantity(jwt: string, productIds: number[]): Promise<void> {
    await api.post("/products/bulk-zero-quantity", { productIds }, { headers: authHeader(jwt) });
  },

  async getBrands(jwt: string): Promise<string[]> {
    const response = await api.get("/brands", { headers: authHeader(jwt) });
    return response.data.data || [];
  },

  async exportProducts(jwt: string, options: ExportOptions): Promise<Blob | { message: string }> {
    const params: Record<string, string> = {
      fields: options.fields.join(","),
      format: options.format,
    };
    if (options.email) params.email = options.email;

    if (options.email) {
      const response = await api.get("/products/export", {
        params,
        headers: authHeader(jwt),
      });
      return response.data;
    }

    const response = await api.get("/products/export", {
      params,
      headers: authHeader(jwt),
      responseType: "blob",
    });
    return response.data as Blob;
  },

  async linkGodownToProduct(jwt: string, productId: number, godownId: number, quantity: number): Promise<Product> {
    const response = await api.post("/products/link-godown", { productId, godownId, quantity }, { headers: authHeader(jwt) });
    return mapProduct(response.data.data);
  },

  async removeGodownFromProduct(jwt: string, productId: number, godownId: number): Promise<Product> {
    const response = await api.post("/products/godown", { productId, godownId }, { headers: authHeader(jwt) });
    return mapProduct(response.data.data);
  },

  async transferGodown(
    jwt: string,
    data: { productId: number; fromGodownId: number; toGodownId: number; quantity?: number }
  ): Promise<Product> {
    const response = await api.post(
      "/products/transfer-godown",
      data,
      { headers: authHeader(jwt) }
    );
    return mapProduct(response.data.data);
  },
};

// Category Service
export const categoryService = {
  async fetchCategories(jwt: string): Promise<Category[]> {
    const response = await api.get("/categories", {
      headers: {
        ...authHeader(jwt),
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
    return response.data.data.map((json: any) => ({
      id: json.id,
      documentId: json.documentId || "",
      name: json.name || "",
      imageUrl: json.image?.formats?.medium?.url || json.image?.url,
    }));
  },

  async createCategory(jwt: string, name: string, imageId?: number): Promise<Category> {
    const response = await api.post(
      "/categories",
      { name, ...(imageId && { imageId }) },
      { headers: authHeader(jwt) }
    );
    const json = response.data.data;
    return { id: json.id, documentId: json.documentId || "", name: json.name || "", imageUrl: json.image?.url };
  },

  async updateCategory(jwt: string, categoryId: number, name: string, imageId?: number): Promise<Category> {
    const response = await api.put(
      `/categories/${categoryId}`,
      { name, ...(imageId && { imageId }) },
      { headers: authHeader(jwt) }
    );
    const json = response.data.data;
    return { id: json.id, documentId: json.documentId || "", name: json.name || "", imageUrl: json.image?.url };
  },

  async deleteCategory(jwt: string, categoryId: number): Promise<void> {
    await api.delete(`/categories/${categoryId}`, { headers: authHeader(jwt) });
  },
};

// Godown Service
export const godownService = {
  async fetchGodowns(jwt: string): Promise<Godown[]> {
    const response = await api.get("/godown", { headers: authHeader(jwt) });
    return response.data.data.map((json: any) => ({
      id: json.id,
      name: json.name || "",
      location: json.location,
    }));
  },

  async createGodown(jwt: string, name: string, location?: string): Promise<Godown> {
    const response = await api.post(
      "/godown",
      { name, ...(location && { location }) },
      { headers: authHeader(jwt) }
    );
    const json = response.data.data;
    return { id: json.id, name: json.name || "", location: json.location };
  },

  async updateGodown(jwt: string, godownId: number, name: string, location?: string): Promise<Godown> {
    const response = await api.put(
      `/godown/${godownId}`,
      { name, ...(location && { location }) },
      { headers: authHeader(jwt) }
    );
    const json = response.data.data;
    return { id: json.id, name: json.name || "", location: json.location };
  },

  async deleteGodown(jwt: string, godownId: number): Promise<void> {
    await api.delete(`/godowns/${godownId}`, { headers: authHeader(jwt) });
  },
};

// User Management Service
export const userService = {
  async listUsers(
    jwt: string,
    params?: { search?: string; user_type?: string; page?: number; pageSize?: number }
  ): Promise<PaginatedResult<AdminUser>> {
    const response = await api.get("/admin/users", {
      params: { ...params, page: params?.page || 1, pageSize: params?.pageSize || 20 },
      headers: authHeader(jwt),
    });
    const { data, meta } = response.data;
    return {
      data: data as AdminUser[],
      meta: { total: meta.total, page: meta.page, pageSize: meta.pageSize, pageCount: meta.pageCount },
    };
  },

  async createUser(jwt: string, data: CreateUserData): Promise<AdminUser> {
    const response = await api.post("/admin/users", data, { headers: authHeader(jwt) });
    return response.data.data as AdminUser;
  },

  async updateUser(jwt: string, userId: number, data: UpdateUserData): Promise<AdminUser> {
    const response = await api.put(`/admin/users/${userId}`, data, { headers: authHeader(jwt) });
    return response.data.data as AdminUser;
  },

  async changePassword(jwt: string, userId: number, password: string): Promise<void> {
    await api.put(`/admin/users/${userId}/password`, { password }, { headers: authHeader(jwt) });
  },

  async toggleBlock(jwt: string, userId: number): Promise<AdminUser> {
    const response = await api.put(`/admin/users/${userId}/toggle-block`, {}, { headers: authHeader(jwt) });
    return response.data.data as AdminUser;
  },

  async deleteUser(jwt: string, userId: number): Promise<void> {
    await api.delete(`/admin/users/${userId}`, { headers: authHeader(jwt) });
  },
};

// Audit Log Service
export const auditLogService = {
  async getAuditLogs(
    jwt: string,
    params?: {
      action?: string;
      productId?: number;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResult<AuditLog>> {
    const response = await api.get("/audit-logs", {
      params: { ...params, page: params?.page || 1, pageSize: params?.pageSize || 50 },
      headers: authHeader(jwt),
    });
    const raw = response.data.data as Record<string, unknown>[];
    const data: AuditLog[] = raw.map((log) => {
      const productRaw = log.product as
        | (AuditLog["product"] & { categories?: Array<{ id: number; name: string }> })
        | undefined;
      const directCategory = log.category as AuditLog["category"];
      const categoryFromProduct = productRaw?.categories?.[0];
      const category =
        directCategory?.name != null
          ? directCategory
          : categoryFromProduct?.name != null
            ? { id: categoryFromProduct.id, name: categoryFromProduct.name }
            : directCategory;

      const { categories: _categories, ...product } = productRaw ?? {};

      return {
        id: log.id as number,
        action: log.action as string,
        description: log.description as string | undefined,
        quantity: (log.quantity as number | undefined) ?? undefined,
        quantityChange:
          (log.quantity_change as number | undefined) ??
          (log.quantityChange as number | undefined),
        previousQuantity:
          (log.previous_quantity as number | undefined) ??
          (log.previousQuantity as number | undefined),
        newQuantity:
          (log.new_quantity as number | undefined) ??
          (log.newQuantity as number | undefined),
        currentQuantity:
          (log.current_quantity as number | undefined) ??
          (log.currentQuantity as number | undefined),
        createdAt: (log.createdAt as string) ?? (log.date_time as string),
        date_time: log.date_time as string | undefined,
        product: productRaw ? (product as AuditLog["product"]) : undefined,
        user: log.user as AuditLog["user"],
        godown: log.godown as AuditLog["godown"],
        category,
      };
    });
    const meta = response.data.meta;
    return {
      data,
      meta: {
        total: meta.total || data.length,
        page: meta.page || 1,
        pageSize: meta.pageSize || 50,
        pageCount: meta.pageCount || 1,
      },
    };
  },
};
