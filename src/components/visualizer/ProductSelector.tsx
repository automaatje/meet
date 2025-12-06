import { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../pages/settings/Products';
import type { ObjectType } from '../../lib/visualizer/types';

interface ProductSelectorProps {
  objectType: ObjectType;
  objectIndex: number;
  onSelect: (product: Product) => void;
  onCancel: () => void;
}

export default function ProductSelector({
  objectType,
  objectIndex,
  onSelect,
  onCancel
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, [objectType]);

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const categoryMap: Record<ObjectType, string> = {
        window: 'window',
        door: 'door',
        exterior_door: 'exterior_door'
      };

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', categoryMap[objectType])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setTimeout(() => {
      onSelect(product);
    }, 300);
  };

  const getObjectTypeLabel = () => {
    const labels = {
      window: 'kozijn',
      door: 'deur',
      exterior_door: 'buitendeur'
    };
    return labels[objectType];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Selecteer een {getObjectTypeLabel()}
              </h2>
              <p className="text-gray-600 mt-1">
                Voor object {objectIndex + 1}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-brand-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Geen producten gevonden in deze categorie.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Voeg eerst producten toe in de instellingen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className={`
                    bg-white rounded-xl border-2 overflow-hidden hover:shadow-lg transition-all duration-200
                    ${selectedProduct?.id === product.id
                      ? 'border-brand-primary scale-95'
                      : 'border-gray-200 hover:border-blue-400 hover:scale-105'
                    }
                  `}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.product_image_url ? (
                      <img
                        src={product.product_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-gray-300"
                          style={{
                            backgroundColor: product.color.toLowerCase() === 'wit' || product.color.toLowerCase() === 'white'
                              ? '#ffffff'
                              : product.color.toLowerCase() === 'antraciet' || product.color.toLowerCase() === 'anthracite'
                              ? '#2d3748'
                              : product.color.toLowerCase() === 'zwart' || product.color.toLowerCase() === 'black'
                              ? '#000000'
                              : product.color.toLowerCase() === 'grijs' || product.color.toLowerCase() === 'grey' || product.color.toLowerCase() === 'gray'
                              ? '#718096'
                              : '#3b82f6'
                          }}
                        />
                        {product.color}
                      </span>
                      <span className="text-sm font-bold text-brand-secondary">
                        €{product.price.toFixed(0)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
