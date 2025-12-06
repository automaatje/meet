import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerFormData = {
  company_name?: string;
  contact_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  notes?: string;
};

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function CustomerForm({ customer, onSubmit, onCancel, isSubmitting: externalSubmitting }: CustomerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    defaultValues: customer ? {
      company_name: customer.company_name,
      contact_name: customer.contact_name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      notes: customer.notes || '',
    } : undefined,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? 'Klant bewerken' : 'Nieuwe klant'}
          </h2>
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
              Bedrijfsnaam
            </label>
            <input
              {...register('company_name', {
                minLength: { value: 2, message: 'Minimaal 2 tekens' }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${
                errors.company_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Bedrijfsnaam B.V."
            />
            {errors.company_name && (
              <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contactpersoon *
            </label>
            <input
              {...register('contact_name', {
                required: 'Contactpersoon is verplicht',
                minLength: { value: 2, message: 'Minimaal 2 tekens' }
              })}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${
                errors.contact_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Naam contactpersoon"
            />
            {errors.contact_name && (
              <p className="mt-1 text-sm text-red-600">{errors.contact_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mailadres
            </label>
            <input
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Ongeldig e-mailadres'
                }
              })}
              type="email"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="email@bedrijf.nl"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefoonnummer
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
              placeholder="+31 6 12345678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adres
            </label>
            <input
              {...register('address')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
              placeholder="Straatnaam 123"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postcode
              </label>
              <input
                {...register('postal_code')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                placeholder="1234 AB"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plaats
              </label>
              <input
                {...register('city')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                placeholder="Amsterdam"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notities
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition resize-none"
              placeholder="Extra informatie over deze klant..."
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
              {(isSubmitting || externalSubmitting) ? 'Bezig...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
