import { useState, useRef, ChangeEvent } from 'react';
import { ArrowLeft, Upload, X, Loader } from 'lucide-react';
import type { Product } from '../../pages/settings/Products';
import { supabase } from '../../lib/supabase';

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    category: product?.category || 'window',
    color: product?.color || '',
    style: product?.style || '',
    price: product?.price || 0,
    description: product?.description || '',
    product_image_url: product?.product_image_url || ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(product?.product_image_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Upload alleen afbeeldingsbestanden');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return formData.product_image_url || null;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Kon foto niet uploaden');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.price) {
      alert('Vul minimaal naam, categorie en prijs in');
      return;
    }

    setSaving(true);

    try {
      const photoUrl = await uploadPhoto();

      await onSubmit({
        ...formData,
        product_image_url: photoUrl || undefined
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Terug
          </button>
          <h2 className="text-2xl font-bold text-gray-900">
            {product ? 'Product Bewerken' : 'Nieuw Product'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              required
            >
              <option value="window">Kozijn</option>
              <option value="door">Deur</option>
              <option value="exterior_door">Buitendeur</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Productnaam *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Bijv. Standaard Kozijn 120x120"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Merk
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Bijv. Roto, Schüco, Reynaers"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kleur
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="Bijv. Wit, Antraciet"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stijl
              </label>
              <input
                type="text"
                value={formData.style}
                onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="Bijv. Modern, Klassiek"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prijs (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
              placeholder="Beschrijf het product..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto
            </label>

            {photoPreview ? (
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview('');
                    setFormData({ ...formData, product_image_url: '' });
                  }}
                  className="absolute top-2 right-2 bg-white hover:bg-gray-100 text-gray-700 rounded-lg p-2 shadow-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-64 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-gray-50 transition flex flex-col items-center justify-center gap-3 text-gray-600"
              >
                <Upload className="w-12 h-12" />
                <div>
                  <p className="font-medium">Klik om foto te uploaden</p>
                  <p className="text-sm text-gray-500">PNG, JPG of WEBP</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={uploading || saving}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(uploading || saving) ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  {uploading ? 'Uploaden...' : 'Opslaan...'}
                </>
              ) : (
                product ? 'Bijwerken' : 'Toevoegen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
