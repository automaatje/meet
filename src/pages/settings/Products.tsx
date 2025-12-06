import { useState, useEffect } from 'react';
import { Plus, Loader } from 'lucide-react';
import ProductGrid from '../../components/products/ProductGrid';
import ProductForm from '../../components/products/ProductForm';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  category: 'window' | 'door' | 'exterior_door';
  color: string;
  style?: string;
  price: number;
  description?: string;
  product_image_url?: string;
  created_at: string;
  updated_at: string;
}

type FilterType = 'all' | 'window' | 'door' | 'exterior_door';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === filter));
    }
  }, [filter, products]);

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        await seedDefaultProducts(user.id);
        await loadProducts();
        return;
      }

      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      showToast('Kon producten niet laden', 'error');
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultProducts = async (userId: string) => {
    const defaultProducts = [
      {
        user_id: userId,
        name: 'Standaard Kozijn 120x120',
        brand: 'Roto',
        category: 'window',
        color: 'Wit',
        style: 'Modern',
        price: 650,
        description: 'Kunststof kozijn met dubbel glas, energiezuinig',
        product_image_url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Standaard Kozijn 100x150',
        brand: 'Roto',
        category: 'window',
        color: 'Wit',
        style: 'Modern',
        price: 700,
        description: 'Kunststof kozijn met triple glas',
        product_image_url: 'https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Groot Kozijn 150x150',
        brand: 'Schüco',
        category: 'window',
        color: 'Wit',
        style: 'Modern',
        price: 850,
        description: 'Premium kunststof kozijn met HR++ glas',
        product_image_url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'XL Kozijn 180x150',
        brand: 'Schüco',
        category: 'window',
        color: 'Wit',
        style: 'Modern',
        price: 900,
        description: 'Extra groot kozijn voor maximaal licht',
        product_image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Aluminium Kozijn 120x120',
        brand: 'Reynaers',
        category: 'window',
        color: 'Antraciet',
        style: 'Modern',
        price: 850,
        description: 'Duurzaam aluminium kozijn, onderhoudsarm',
        product_image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Aluminium Kozijn 100x150',
        brand: 'Reynaers',
        category: 'window',
        color: 'Antraciet',
        style: 'Modern',
        price: 950,
        description: 'Strak design met smalle profielen',
        product_image_url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Aluminium Kozijn 150x150',
        brand: 'Schüco',
        category: 'window',
        color: 'Antraciet',
        style: 'Modern',
        price: 1100,
        description: 'Premium aluminium met perfecte isolatie',
        product_image_url: 'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'XL Aluminium Kozijn 180x150',
        brand: 'Schüco',
        category: 'window',
        color: 'Antraciet',
        style: 'Modern',
        price: 1200,
        description: 'Extra groot aluminium kozijn',
        product_image_url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Moderne Binnendeur',
        brand: 'Svedex',
        category: 'door',
        color: 'Wit',
        style: 'Modern',
        price: 350,
        description: 'Strakke opdekdeur met verborgen scharnieren',
        product_image_url: 'https://images.unsplash.com/photo-1534172553917-0c9644ec821e?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Landelijke Binnendeur',
        brand: 'Bruynzeel',
        category: 'door',
        color: 'Grijs',
        style: 'Landelijk',
        price: 450,
        description: 'Klassieke paneeldeur met detail',
        product_image_url: 'https://images.unsplash.com/photo-1563298723-dcfebaa392e3?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Klassieke Voordeur',
        brand: 'Weekamp',
        category: 'exterior_door',
        color: 'Antraciet',
        style: 'Klassiek',
        price: 1800,
        description: 'Veilige voordeur met meerpuntsluiting',
        product_image_url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=400&fit=crop'
      },
      {
        user_id: userId,
        name: 'Design Voordeur',
        brand: 'Hörmann',
        category: 'exterior_door',
        color: 'Zwart',
        style: 'Modern',
        price: 2200,
        description: 'Luxe voordeur met glas detail',
        product_image_url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=400&fit=crop'
      }
    ];

    try {
      const { error } = await supabase
        .from('products')
        .insert(defaultProducts);

      if (error) throw error;
    } catch (error) {
      console.error('Error seeding products:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      showToast('Product verwijderd', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Kon product niet verwijderen', 'error');
    }
  };

  const handleFormSubmit = async (formData: Partial<Product>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProduct.id);

        if (error) throw error;

        setProducts(products.map(p =>
          p.id === editingProduct.id
            ? { ...p, ...formData, updated_at: new Date().toISOString() }
            : p
        ));
        showToast('Product bijgewerkt', 'success');
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert({
            ...formData,
            user_id: user.id
          })
          .select()
          .single();

        if (error) throw error;

        setProducts([data, ...products]);
        showToast('Product toegevoegd', 'success');
      }

      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Kon product niet opslaan', 'error');
    }
  };

  const getFilterLabel = (filterType: FilterType) => {
    const labels = {
      all: 'Alle Producten',
      window: 'Kozijnen',
      door: 'Deuren',
      exterior_door: 'Buitendeuren'
    };
    return labels[filterType];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Producten</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-2 bg-brand-primary text-white rounded-lg font-medium transition hover:opacity-90 flex items-center gap-2 whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nieuw Product</span>
            <span className="sm:hidden">Nieuw</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['all', 'window', 'door', 'exterior_door'] as FilterType[]).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition
                ${filter === filterType
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                }
              `}
            >
              {getFilterLabel(filterType)}
            </button>
          ))}
        </div>
      </div>

      <ProductGrid
        products={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Geen producten gevonden</p>
        </div>
      )}
    </div>
  );
}
