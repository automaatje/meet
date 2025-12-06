import { useState, useEffect } from 'react';
import { X, Search, Package, Loader2 } from 'lucide-react';
import { productService } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductSelectorProps {
  category: 'window' | 'door' | 'exterior_door';
  selectedProductId?: string;
  onChange: (productId: string, product: Product) => void;
  onCancel: () => void;
}

export default function ProductSelector({
  category,
  selectedProductId,
  onChange,
  onCancel,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProducts();
  }, [category]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getByCategory(category);
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.color?.toLowerCase().includes(query)
    );
  });

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'window':
        return 'Ramen';
      case 'door':
        return 'Deuren';
      case 'exterior_door':
        return 'Buitendeuren';
      default:
        return cat;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Selecteer Product - {getCategoryLabel(category)}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op naam, merk of kleur..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-3" />
              <p className="text-gray-600">Producten laden...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-1">
                {searchQuery ? 'Geen producten gevonden' : 'Geen producten beschikbaar'}
              </p>
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? 'Probeer een andere zoekopdracht'
                  : 'Voeg eerst producten toe in Settings → Producten'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => onChange(product.id, product)}
                  className={`p-4 border-2 rounded-xl text-left transition hover:border-brand-primary hover:shadow-md ${
                    selectedProductId === product.id
                      ? 'border-brand-primary bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex gap-4">
                    {product.product_image_url ? (
                      <img
                        src={product.product_image_url}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg bg-gray-100"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 truncate">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-sm text-gray-600 mb-1">{product.brand}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {product.color && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {product.color}
                          </span>
                        )}
                        {product.style && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                            {product.style}
                          </span>
                        )}
                      </div>
                      {product.price && (
                        <p className="text-sm font-semibold text-brand-primary mt-2">
                          €{product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>

                  {selectedProductId === product.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-sm text-brand-primary font-medium">
                        ✓ Geselecteerd
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
