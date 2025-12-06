import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import { customerService } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];

type ProjectFormData = {
  customer_id: string;
  title: string;
  description?: string;
  address?: string;
};

interface ProjectFormProps {
  onSubmit: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  preselectedCustomerId?: string;
}

export default function ProjectForm({ onSubmit, onCancel, isSubmitting: externalSubmitting, preselectedCustomerId }: ProjectFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    defaultValues: {
      customer_id: preselectedCustomerId || '',
    },
  });

  useEffect(() => {
    loadCustomers();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nieuw project</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Klant *
            </label>
            {loading ? (
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                Laden...
              </div>
            ) : (
              <select
                {...register('customer_id', { required: 'Selecteer een klant' })}
                disabled={!!preselectedCustomerId}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${
                  errors.customer_id ? 'border-red-500' : 'border-gray-300'
                } ${preselectedCustomerId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Selecteer een klant...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.company_name ? `${customer.company_name} - ${customer.contact_name}` : customer.contact_name}
                  </option>
                ))}
              </select>
            )}
            {errors.customer_id && (
              <p className="mt-1 text-sm text-red-600">{errors.customer_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project titel *
            </label>
            <input
              {...register('title', {
                required: 'Titel is verplicht',
                minLength: { value: 3, message: 'Minimaal 3 tekens' }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Bijv. Schilderwerk woonkamer"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschrijving
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition resize-none"
              placeholder="Omschrijf het project..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <input
              {...register('address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
              placeholder="Projectadres"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition min-h-[48px]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSubmitting || externalSubmitting}
              className="flex-1 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {(isSubmitting || externalSubmitting) ? 'Bezig...' : 'Project aanmaken'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
