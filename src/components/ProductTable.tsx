"use client";

import React, { useState, useEffect } from "react";
import {
  Product,
  Category,
  Godown,
  CreateProductData,
  UpdateInventoryData,
} from "../types";
import { productService, categoryService, godownService } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Image as ImageIcon,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import StatsDashboard from "./StatsDashboard";

interface ProductTableProps {
  onEditProduct?: (product: Product) => void;
  onCreateProduct?: () => void;
}

const ProductTable: React.FC<ProductTableProps> = ({
  onEditProduct,
  onCreateProduct,
}) => {
  const { jwt } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGodown, setSelectedGodown] = useState<string>("");
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [inventoryData, setInventoryData] = useState<UpdateInventoryData[]>([]);

  useEffect(() => {
    if (jwt) {
      loadData();
    }
  }, [jwt]);

  const loadData = async () => {
    if (!jwt) return;

    try {
      setLoading(true);
      const [productsData, categoriesData, godownsData] = await Promise.all([
        productService.searchProducts(jwt),
        categoryService.fetchCategories(jwt),
        godownService.fetchGodowns(jwt),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setGodowns(godownsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory ||
      product.categories.some((cat) => cat.id.toString() === selectedCategory);
    const matchesGodown =
      !selectedGodown ||
      product.inventory.some(
        (inv) => inv.godown.id.toString() === selectedGodown
      );

    return matchesSearch && matchesCategory && matchesGodown;
  });

  const getTotalInventory = (product: Product) => {
    return product.inventory.reduce((total, inv) => total + inv.quantity, 0);
  };

  const getInventoryBreakdown = (product: Product) => {
    return product.inventory
      .map((inv) => `${inv.godown.name}: ${inv.quantity}`)
      .join(", ");
  };

  const handleEditInventory = (product: Product) => {
    setSelectedProduct(product);
    setInventoryData(
      product.inventory.map((inv) => ({
        productId: product.id,
        godownId: inv.godown.id,
        quantity: inv.quantity,
      }))
    );
    setShowInventoryModal(true);
  };

  const handleUpdateInventory = async () => {
    if (!jwt || !selectedProduct) return;

    try {
      for (const inv of inventoryData) {
        await productService.updateInventory(jwt, inv);
      }
      await loadData();
      setShowInventoryModal(false);
    } catch (error) {
      console.error("Error updating inventory:", error);
    }
  };

  const handleCreateProduct = () => {
    if (onCreateProduct) {
      onCreateProduct();
    }
  };

  const handleEditProduct = (product: Product) => {
    if (onEditProduct) {
      onEditProduct(product);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Product Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your inventory and product catalog
          </p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Stats Dashboard */}
      <StatsDashboard products={products} />

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Godown
            </label>
            <select
              value={selectedGodown}
              onChange={(e) => setSelectedGodown(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50"
            >
              <option value="">All Godowns</option>
              {godowns.map((godown) => (
                <option key={godown.id} value={godown.id.toString()}>
                  {godown.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadData}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl font-medium w-full justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Brand
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Inventory
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Images
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200/50">
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-blue-50/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.brand || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {cat.name}
                        </span>
                      ))}
                      {product.categories.length === 0 && (
                        <span className="text-gray-400 text-sm">
                          No categories
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {product.minimumSellingPrice && (
                        <div className="text-sm font-medium text-green-600">
                          Min: ₹{product.minimumSellingPrice.toLocaleString()}
                        </div>
                      )}
                      {product.purchasePrice && (
                        <div className="text-sm text-gray-600">
                          Cost: ₹{product.purchasePrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="text-sm font-semibold text-blue-600 cursor-pointer hover:text-blue-800 transition-colors"
                      title={getInventoryBreakdown(product)}
                    >
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4" />
                        <span>{getTotalInventory(product)} units</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {product.images.slice(0, 3).map((image, index) => (
                        <img
                          key={index}
                          src={image.thumbnailUrl || image.url}
                          alt={`${product.name} ${index + 1}`}
                          className="h-8 w-8 rounded-lg object-cover border border-gray-200"
                        />
                      ))}
                      {product.images.length > 3 && (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border border-gray-200">
                          +{product.images.length - 3}
                        </div>
                      )}
                      {product.images.length === 0 && (
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditInventory(product)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                        title="Edit Inventory"
                      >
                        <Package className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-lg transition-all duration-200"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Modal */}
      {showInventoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Edit Inventory
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedProduct.name}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {inventoryData.map((inv, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between space-x-4 p-3 bg-gray-50 rounded-xl"
                  >
                    <label className="text-sm font-medium text-gray-700 min-w-0 flex-1">
                      {godowns.find((g) => g.id === inv.godownId)?.name}:
                    </label>
                    <input
                      type="number"
                      value={inv.quantity}
                      onChange={(e) => {
                        const newData = [...inventoryData];
                        newData[index].quantity = parseInt(e.target.value) || 0;
                        setInventoryData(newData);
                      }}
                      className="w-20 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center font-medium"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowInventoryModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInventory}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Update Inventory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
