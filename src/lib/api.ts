import axios from "axios";
import { API_BASE_URL } from "./constants";
import {
  AuthResponse,
  LoginCredentials,
  Product,
  Category,
  Godown,
  CreateProductData,
  UpdateInventoryData,
} from "../types";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Auth Service
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post("/auth/login-user", credentials);
    return response.data;
  },
};

// Product Service
export const productService = {
  async searchProducts(
    jwt: string,
    params?: {
      name?: string;
      category?: string;
      brand?: string;
      godownId?: number;
    }
  ): Promise<Product[]> {
    const response = await api.get("/search/products", {
      params,
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data.data.map((json: any) => ({
      id: json.id,
      name: json.name || "",
      description: json.description,
      brand: json.brand,
      minimumSellingPrice: json.minimum_selling_price
        ? Number(json.minimum_selling_price)
        : undefined,
      purchasePrice: json.purchase_price
        ? Number(json.purchase_price)
        : undefined,
      images: json.images
        ? json.images.map((img: any) => ({
            url: img.url,
            thumbnailUrl: img.formats?.thumbnail?.url,
          }))
        : [],
      inventory: json.inventory
        ? json.inventory.map((inv: any) => ({
            id: inv.id,
            quantity: inv.quantity || 0,
            godown: {
              id: inv.godown.id,
              name: inv.godown.name || "",
              location: inv.godown.location,
            },
          }))
        : [],
      categories: json.categories
        ? json.categories.map((cat: any) => ({
            id: cat.id,
            documentId: cat.documentId || "",
            name: cat.name || "",
            imageUrl: cat.image?.formats?.medium?.url || cat.image?.url,
          }))
        : [],
    }));
  },

  async getProductDetails(jwt: string, productId: number): Promise<Product> {
    const response = await api.get(`/products/${productId}?populate=*`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const json = response.data.data;
    return {
      id: json.id,
      name: json.name || "",
      description: json.description,
      brand: json.brand,
      minimumSellingPrice: json.minimum_selling_price
        ? Number(json.minimum_selling_price)
        : undefined,
      purchasePrice: json.purchase_price
        ? Number(json.purchase_price)
        : undefined,
      images: json.images
        ? json.images.map((img: any) => ({
            url: img.url,
            thumbnailUrl: img.formats?.thumbnail?.url,
          }))
        : [],
      inventory: json.inventory
        ? json.inventory.map((inv: any) => ({
            id: inv.id,
            quantity: inv.quantity || 0,
            godown: {
              id: inv.godown.id,
              name: inv.godown.name || "",
              location: inv.godown.location,
            },
          }))
        : [],
      categories: json.categories
        ? json.categories.map((cat: any) => ({
            id: cat.id,
            documentId: cat.documentId || "",
            name: cat.name || "",
            imageUrl: cat.image?.formats?.medium?.url || cat.image?.url,
          }))
        : [],
    };
  },

  async updateInventory(jwt: string, data: UpdateInventoryData): Promise<void> {
    await api.put("/product/inventory", data, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
  },

  async createProduct(jwt: string, data: CreateProductData) {
    const response = await api.post("/products", data, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const json = response.data.data;

    console.log("Created Product Response:", json);

    console.log("AFTER ADJUSTMENT:", json);
    return {
      id: json.id,
      name: json.name || "",
      description: json.description,
      brand: json.brand,
      minimumSellingPrice: json.minimum_selling_price
        ? Number(json.minimum_selling_price)
        : undefined,
      purchasePrice: json.purchase_price
        ? Number(json.purchase_price)
        : undefined,
      images: json.images
        ? json.images.map((img: any) => ({
            url: img.url,
            thumbnailUrl: img.formats?.thumbnail?.url,
          }))
        : [],
      inventory: json.inventory
        ? json.inventory.map((inv: any) => ({
            id: inv.id,
            quantity: inv.quantity || 0,
            godown: {
              id: inv.godown.id,
              name: inv.godown.name || "",
              location: inv.godown.location,
            },
          }))
        : [],
      categories: json.categories
        ? json.categories.map((cat: any) => ({
            id: cat.id,
            documentId: cat.documentId || "",
            name: cat.name || "",
            imageUrl: cat.image?.formats?.medium?.url || cat.image?.url,
          }))
        : [],
    };
  },

  async updateProduct(
    jwt: string,
    productId: number,
    data: Partial<CreateProductData>
  ) {
    const response = await api.put(`/products/${productId}`, data, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    const json = response.data.data;

    return {
      id: json.id,
      name: json.name || "",
      description: json.description,
      brand: json.brand,
      minimumSellingPrice: json.minimum_selling_price
        ? Number(json.minimum_selling_price)
        : undefined,
      purchasePrice: json.purchase_price
        ? Number(json.purchase_price)
        : undefined,
      images: json.images
        ? json.images.map((img: any) => ({
            url: img.url,
            thumbnailUrl: img.formats?.thumbnail?.url,
          }))
        : [],
      inventory: json.inventory
        ? json.inventory.map((inv: any) => ({
            id: inv.id,
            quantity: inv.quantity || 0,
            godown: {
              id: inv.godown.id,
              name: inv.godown.name || "",
              location: inv.godown.location,
            },
          }))
        : [],
      categories: json.categories
        ? json.categories.map((cat: any) => ({
            id: cat.id,
            documentId: cat.documentId || "",
            name: cat.name || "",
            imageUrl: cat.image?.formats?.medium?.url || cat.image?.url,
          }))
        : [],
    };
  },

  async deleteProduct(jwt: string, productId: number): Promise<void> {
    await api.delete(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
  },

  async removeGodownFromProduct(
    jwt: string,
    productId: number,
    godownId: number
  ): Promise<void> {
    await api.post(
      "/products/godown",
      { productId, godownId },
      {
        headers: { Authorization: `Bearer ${jwt}` },
      }
    );
  },
};

// Category Service
export const categoryService = {
  async fetchCategories(jwt: string, godownId?: number): Promise<Category[]> {
    const params = godownId ? { godown: godownId.toString() } : {};
    const response = await api.get("/categories", {
      params,
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
    return response.data.data.map((json: any) => ({
      id: json.id,
      documentId: json.documentId || "",
      name: json.name || "",
      imageUrl: json.image?.formats?.medium?.url || json.image?.url,
    }));
  },

  async createCategory(
    jwt: string,
    name: string,
    imageId?: number
  ): Promise<Category> {
    const response = await api.post(
      "/categories",
      { name, ...(imageId && { imageId }) },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const json = response.data.data;
    return {
      id: json.id,
      documentId: json.documentId || "",
      name: json.name || "",
      imageUrl: json.image?.formats?.medium?.url || json.image?.url,
    };
  },

  async updateCategory(
    jwt: string,
    categoryId: number,
    name: string,
    imageId?: number
  ): Promise<Category> {
    const response = await api.put(
      `/categories/${categoryId}`,
      { name, ...(imageId && { imageId }) },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const json = response.data.data;
    return {
      id: json.id,
      documentId: json.documentId || "",
      name: json.name || "",
      imageUrl: json.image?.formats?.medium?.url || json.image?.url,
    };
  },
};

// Godown Service
export const godownService = {
  async fetchGodowns(jwt: string): Promise<Godown[]> {
    const response = await api.get("/godown", {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data.data.map((json: any) => ({
      id: json.id,
      name: json.name || "",
      location: json.location,
    }));
  },

  async createGodown(
    jwt: string,
    name: string,
    location?: string
  ): Promise<Godown> {
    const response = await api.post(
      "/godown",
      { name, ...(location && { location }) },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const json = response.data.data;
    return {
      id: json.id,
      name: json.name || "",
      location: json.location,
    };
  },

  async updateGodown(
    jwt: string,
    godownId: number,
    name: string,
    location?: string
  ): Promise<Godown> {
    const response = await api.put(
      `/godown/${godownId}`,
      { name, ...(location && { location }) },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const json = response.data.data;
    return {
      id: json.id,
      name: json.name || "",
      location: json.location,
    };
  },
};
