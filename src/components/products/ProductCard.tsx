import { Pencil, Trash2 } from 'lucide-react';
import type { Product } from '../../pages/settings/Products';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const getCategoryLabel = (category: string) => {
    const labels = {
      window: 'Kozijn',
      door: 'Deur',
      exterior_door: 'Buitendeur'
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition group">
      <div className="aspect-square bg-gray-100 overflow-hidden">
        {product.product_image_url ? (
          <img
            src={product.product_image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-1">{product.brand}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded">
            <span
              className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
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
            <span className="truncate">{product.color}</span>
          </span>
          <span className="text-xs text-gray-500">
            {getCategoryLabel(product.category)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xl font-bold text-brand-secondary">
            €{product.price.toFixed(2)}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(product)}
              className="flex-1 p-2 text-brand-primary hover:bg-blue-50 rounded-lg transition"
              title="Bewerken"
            >
              <Pencil className="w-4 h-4 mx-auto" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Verwijderen"
            >
              <Trash2 className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
