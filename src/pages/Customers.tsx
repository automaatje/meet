import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Search, Plus, Building2, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import CustomerForm from '../components/customers/CustomerForm';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

type CustomerWithCount = {
  id: string;
  company_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  project_count: number;
};

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerWithCount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAllWithProjectCounts();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Kon klanten niet laden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (data: any) => {
    try {
      setSubmitting(true);
      await customerService.create(data);
      toast.success('Klant succesvol toegevoegd');
      setShowAddForm(false);
      loadCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Kon klant niet toevoegen. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Klanten</h1>
          <p className="text-gray-600 mt-1">{customers.length} klanten in totaal</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-brand-primary active:opacity-80 text-white p-3 rounded-full shadow-lg transition min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
          aria-label="Klant toevoegen"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Zoek klanten..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <EmptyState
              icon="customers"
              title={searchQuery ? 'Geen klanten gevonden' : 'Nog geen klanten'}
              description={
                searchQuery
                  ? 'Probeer een andere zoekopdracht'
                  : 'Voeg je eerste klant toe om te beginnen met het beheren van je projecten'
              }
              action={
                !searchQuery
                  ? {
                      label: 'Voeg eerste klant toe',
                      onClick: () => setShowAddForm(true),
                    }
                  : undefined
              }
            />
          ) : (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => navigate(`/customers/${customer.id}`)}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {customer.company_name || customer.contact_name}
                  </h3>
                  {customer.company_name && (
                    <p className="text-sm text-gray-600 mb-2">{customer.contact_name}</p>
                  )}

                  <div className="space-y-1">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.city && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{customer.city}</span>
                      </div>
                    )}
                  </div>

                  {customer.project_count > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-brand-primary font-medium">
                        <Briefcase className="w-4 h-4" />
                        <span>{customer.project_count} {customer.project_count === 1 ? 'project' : 'projecten'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {showAddForm && (
        <CustomerForm
          onSubmit={handleAddCustomer}
          onCancel={() => setShowAddForm(false)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}
