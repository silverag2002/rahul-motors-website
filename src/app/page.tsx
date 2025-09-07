"use client";

import { AuthProvider, useAuth } from "../contexts/AuthContext";
import LoginForm from "../components/LoginForm";
import Layout from "../components/Layout";
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import { useState } from "react";

function MainContent() {
  const { user, loading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">RM</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <ProductTable
        onCreateProduct={() => setShowCreateModal(true)}
        onEditProduct={(product) => {
          setSelectedProduct(product);
          setShowEditModal(true);
        }}
      />
      {showCreateModal && (
        <ProductForm
          product={null}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}
      {showEditModal && selectedProduct && (
        <ProductForm
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </Layout>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
