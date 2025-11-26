"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product, Category, Godown, CreateProductData } from "../types";
import { productService, categoryService, godownService } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { X, ChevronDown, Search, Check } from "lucide-react";

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const { jwt } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ categories?: string; godown?: string }>({});
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<CreateProductData>({
    name: "",
    minimum_selling_price: 0,
    purchase_price: 0,
    description: "",
    brand: "",
    car_name: "",
    part_no: "",
    categories: [],
    inventory: [],
    imageIds: [],
  });

  useEffect(() => {
    if (jwt) {
      loadData();
    }
    if (product) {
      setFormData({
        name: product.name,
        minimum_selling_price: product.minimumSellingPrice || 0,
        purchase_price: product.purchasePrice || 0,
        description: product.description || "",
        brand: product.brand || "",
        car_name: "",
        part_no: "",
        categories: product.categories.map((cat) => cat.id),
        inventory: product.inventory.map((inv) => ({
          godownId: inv.godown.id,
          quantity: inv.quantity,
        })),
        imageIds: [],
      });
    }
  }, [jwt, product]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadData = async () => {
    if (!jwt) return;

    try {
      const [categoriesData, godownsData] = await Promise.all([
        categoryService.fetchCategories(jwt),
        godownService.fetchGodowns(jwt),
      ]);

      setCategories(categoriesData);
      setGodowns(godownsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jwt) return;

    // Validate categories
    if (formData.categories.length === 0) {
      setErrors({ categories: "Please select at least one category" });
      return;
    }

    // Validate godown (at least one godown must have quantity > 0)
    const hasValidGodown = formData.inventory.some((inv) => inv.quantity > 0);
    if (!hasValidGodown) {
      setErrors({ godown: "Please set quantity for at least one godown" });
      return;
    }

    // Clear errors if validation passes
    setErrors({});

    try {
      setLoading(true);
      if (product) {
        await productService.updateProduct(jwt, product.id, formData);
      } else {
        await productService.createProduct(jwt, formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryId]
        : prev.categories.filter((id) => id !== categoryId),
    }));
    // Clear error when category is selected
    if (checked && errors.categories) {
      setErrors((prev) => ({ ...prev, categories: undefined }));
    }
  };

  const removeCategory = (categoryId: number) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((id) => id !== categoryId),
    }));
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const getSelectedCategoryNames = () => {
    return categories
      .filter((cat) => formData.categories.includes(cat.id))
      .map((cat) => cat.name);
  };

  const handleInventoryChange = (godownId: number, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      inventory: prev.inventory.some((inv) => inv.godownId === godownId)
        ? prev.inventory.map((inv) =>
            inv.godownId === godownId ? { ...inv, quantity } : inv
          )
        : [...prev.inventory, { godownId, quantity }],
    }));
    // Clear error when a valid quantity is set
    if (quantity > 0 && errors.godown) {
      setErrors((prev) => ({ ...prev, godown: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
              {/* <Package className="h-5 w-5 text-blue-600" /> */}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {product ? "Edit Product" : "Create New Product"}
              </h3>
              <p className="text-sm text-gray-500">
                {product
                  ? "Update product information"
                  : "Add a new product to your inventory"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Car Name
                </label>
                <input
                  type="text"
                  name="car_name"
                  value={formData.car_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter car name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Part Number
                </label>
                <input
                  type="text"
                  name="part_no"
                  value={formData.part_no}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="Enter part number"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Selling Price (₹)
                </label>
                <input
                  type="number"
                  name="minimum_selling_price"
                  value={formData.minimum_selling_price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Purchase Price (₹)
                </label>
                <input
                  type="number"
                  name="purchase_price"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
                placeholder="Enter product description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categories *
              </label>
              <div className="relative" ref={categoryDropdownRef}>
                <div
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 cursor-pointer flex items-center justify-between min-h-[48px]"
                >
                  <div className="flex flex-wrap gap-2 flex-1">
                    {formData.categories.length === 0 ? (
                      <span className="text-gray-400 text-sm">
                        Select categories...
                      </span>
                    ) : (
                      getSelectedCategoryNames().map((name, index) => {
                        const categoryId = categories.find((c) => c.name === name)?.id;
                        return (
                          <span
                            key={categoryId}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (categoryId) removeCategory(categoryId);
                              }}
                              className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      isCategoryDropdownOpen ? "transform rotate-180" : ""
                    }`}
                  />
                </div>

                {isCategoryDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearchTerm}
                          onChange={(e) => {
                            setCategorySearchTerm(e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                      {filteredCategories.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          No categories found
                        </div>
                      ) : (
                        filteredCategories.map((category) => {
                          const isSelected = formData.categories.includes(
                            category.id
                          );
                          return (
                            <div
                              key={category.id}
                              onClick={() =>
                                handleCategoryChange(category.id, !isSelected)
                              }
                              className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center flex-1">
                                <div
                                  className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center ${
                                    isSelected
                                      ? "bg-blue-600 border-blue-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-700">
                                  {category.name}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
              {errors.categories && (
                <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Inventory Distribution *
              </label>
              <div className="space-y-3">
                {godowns.map((godown) => (
                  <div
                    key={godown.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100"
                  >
                    <label className="text-sm font-medium text-gray-700">
                      {godown.name}:
                    </label>
                    <input
                      type="number"
                      value={
                        formData.inventory.find(
                          (inv) => inv.godownId === godown.id
                        )?.quantity || 0
                      }
                      onChange={(e) =>
                        handleInventoryChange(
                          godown.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                      min="0"
                    />
                  </div>
                ))}
              </div>
              {errors.godown && (
                <p className="mt-2 text-sm text-red-600">{errors.godown}</p>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200/50 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {product ? "Updating..." : "Creating..."}
              </div>
            ) : product ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
