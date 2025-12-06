import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Receipt, Filter, Plus } from 'lucide-react';
import { ListSkeleton } from '../components/LoadingSkeleton';
import InvoiceForm from '../components/invoices/InvoiceForm';

type InvoiceStatus = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  customer: {
    company_name: string | null;
    contact_name: string;
  };
}

export default function Invoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>('all');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(company_name, contact_name)
      `)
      .order('invoice_number', { ascending: false });

    if (error) {
      console.error('Error loading invoices:', error);
    } else {
      const updatedInvoices = data.map((invoice: any) => {
        if (
          invoice.status === 'sent' &&
          invoice.paid_amount < invoice.total_amount &&
          new Date(invoice.due_date) < new Date()
        ) {
          supabase.from('invoices').update({ status: 'overdue' }).eq('id', invoice.id);
          return { ...invoice, status: 'overdue' };
        }
        return invoice;
      });
      setInvoices(updatedInvoices);
    }

    setLoading(false);
  };

  const filteredInvoices = invoices.filter((invoice) =>
    statusFilter === 'all' ? true : invoice.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { label: 'Concept', color: 'bg-gray-100 text-gray-700' },
      sent: { label: 'Verzonden', color: 'bg-blue-100 text-blue-700' },
      paid: { label: 'Betaald', color: 'bg-green-100 text-green-700' },
      overdue: { label: 'Achterstallig', color: 'bg-red-100 text-red-700' },
    };
    return badges[status as keyof typeof badges] || badges.draft;
  };

  const filterButtons = [
    { id: 'all' as InvoiceStatus, label: 'Alle', count: invoices.length },
    { id: 'draft' as InvoiceStatus, label: 'Concept', count: invoices.filter((i) => i.status === 'draft').length },
    { id: 'sent' as InvoiceStatus, label: 'Verzonden', count: invoices.filter((i) => i.status === 'sent').length },
    { id: 'paid' as InvoiceStatus, label: 'Betaald', count: invoices.filter((i) => i.status === 'paid').length },
    { id: 'overdue' as InvoiceStatus, label: 'Achterstallig', count: invoices.filter((i) => i.status === 'overdue').length },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Receipt className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facturen</h1>
              <p className="text-gray-600 text-sm">Beheer je facturen en betalingen</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewInvoiceModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            Nieuw
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => setStatusFilter(button.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex-shrink-0 ${
              statusFilter === button.id
                ? 'bg-brand-primary text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
            }`}
          >
            {button.label} ({button.count})
          </button>
        ))}
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen facturen</h3>
          <p className="text-sm text-gray-600">
            {statusFilter === 'all'
              ? 'Maak je eerste factuur aan'
              : `Geen facturen met status "${filterButtons.find((b) => b.id === statusFilter)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => {
            const paymentProgress = (invoice.paid_amount / invoice.total_amount) * 100;
            const statusBadge = getStatusBadge(invoice.status);

            return (
              <div
                key={invoice.id}
                onClick={() => navigate(`/invoices/${invoice.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-mono text-lg font-bold text-gray-900 mb-1">
                      {invoice.invoice_number}
                    </div>
                    <p className="text-sm text-gray-600">
                      {invoice.customer.company_name || invoice.customer.contact_name}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Factuurdatum:</span>
                    <div className="font-medium text-gray-900">
                      {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Vervaldatum:</span>
                    <div className="font-medium text-gray-900">
                      {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Betaalstatus</span>
                    <span className="font-semibold text-gray-900">
                      €{invoice.paid_amount.toFixed(0)} / €{invoice.total_amount.toFixed(0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        paymentProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${paymentProgress}%` }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    €{invoice.total_amount.toFixed(2)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewInvoiceModal && (
        <InvoiceForm
          onClose={() => setShowNewInvoiceModal(false)}
          onSuccess={loadInvoices}
        />
      )}
    </div>
  );
}
