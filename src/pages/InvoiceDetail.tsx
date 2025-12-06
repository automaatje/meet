import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import {
  ArrowLeft,
  Download,
  DollarSign,
  Calendar,
  Building2,
  MoreVertical,
  Plus,
} from 'lucide-react';
import { ListSkeleton } from '../components/LoadingSkeleton';
import PaymentModal from '../components/invoices/PaymentModal';
import { generateInvoicePDF } from '../components/invoices/InvoicePDF';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveTab } = useStore();
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadInvoice();
      loadPayments();
    }
  }, [id]);

  const loadInvoice = async () => {
    const { data } = await supabase
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        project:projects(id, title),
        line_items:invoice_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (data) {
      setInvoice(data);
    }
    setLoading(false);
  };

  const loadPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false });

    if (data) {
      setPayments(data);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    const blob = await generateInvoicePDF(invoice);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoice_number}.pdf`;
    a.click();
  };

  if (loading) {
    return (
      <div className="p-4">
        <ListSkeleton count={3} />
      </div>
    );
  }

  if (!invoice) {
    return <div className="p-4">Factuur niet gevonden</div>;
  }

  const statusBadge = {
    draft: { label: 'Concept', color: 'bg-gray-100 text-gray-700' },
    sent: { label: 'Verzonden', color: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Betaald', color: 'bg-green-100 text-green-700' },
    overdue: { label: 'Achterstallig', color: 'bg-red-100 text-red-700' },
  }[invoice.status] || { label: 'Concept', color: 'bg-gray-100 text-gray-700' };

  const outstandingAmount = invoice.total_amount - invoice.paid_amount;
  const paymentProgress = (invoice.paid_amount / invoice.total_amount) * 100;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="font-mono text-xl font-bold text-gray-900 mb-1">
              {invoice.invoice_number}
            </div>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {invoice.status !== 'paid' && outstandingAmount > 0 && (
          <div className="bg-gradient-to-br from-blue-500 to-brand-primary rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-blue-100 text-sm mb-1">Betaalstatus</div>
                <div className="text-3xl font-bold">€{invoice.paid_amount.toFixed(0)}</div>
                <div className="text-blue-100 text-sm">van €{invoice.total_amount.toFixed(0)}</div>
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-brand-primary rounded-lg hover:bg-blue-50 transition font-medium"
              >
                <Plus className="w-4 h-4" />
                Betaling
              </button>
            </div>
            <div className="w-full bg-blue-400 rounded-full h-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-300"
                style={{ width: `${paymentProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Klantgegevens</h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <div className="font-medium text-gray-900">
                  {invoice.customer.company_name || invoice.customer.contact_name}
                </div>
                {invoice.customer.company_name && (
                  <div className="text-sm text-gray-600">{invoice.customer.contact_name}</div>
                )}
                {invoice.customer.email && <div className="text-sm text-gray-600">{invoice.customer.email}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Factuurdetails</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Factuurdatum: </span>
                <span className="font-medium text-gray-900">
                  {new Date(invoice.invoice_date).toLocaleDateString('nl-NL')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <span className="text-sm text-gray-600">Vervaldatum: </span>
                <span className="font-medium text-gray-900">
                  {new Date(invoice.due_date).toLocaleDateString('nl-NL')}
                </span>
              </div>
            </div>
            {invoice.project && (
              <div>
                <span className="text-sm text-gray-600">Project: </span>
                <button
                  onClick={() => navigate(`/projects/${invoice.project.id}`)}
                  className="font-medium text-brand-primary hover:text-blue-700"
                >
                  {invoice.project.title}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Factuurregels</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {invoice.line_items.map((item: any) => (
              <div key={item.id} className="p-4">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-900">{item.description}</span>
                  <span className="font-semibold text-gray-900">€{item.total.toFixed(2)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {item.quantity} × €{item.unit_price.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotaal</span>
              <span className="font-medium text-gray-900">€{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">BTW (21%)</span>
              <span className="font-medium text-gray-900">€{invoice.vat_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-900">Totaal</span>
              <span className="text-xl font-bold text-gray-900">€{invoice.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Betalingen</h2>
              <span className="text-sm text-gray-600">{payments.length} registratie(s)</span>
            </div>
            <div className="divide-y divide-gray-200">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">€{payment.amount.toFixed(2)}</span>
                    <span className="text-sm text-gray-600">
                      {new Date(payment.payment_date).toLocaleDateString('nl-NL')}
                    </span>
                  </div>
                  {payment.payment_method && (
                    <div className="text-sm text-gray-600 capitalize">{payment.payment_method}</div>
                  )}
                  {payment.reference && (
                    <div className="text-xs text-gray-500 mt-1">Ref: {payment.reference}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          invoiceId={id!}
          outstandingAmount={outstandingAmount}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            loadInvoice();
            loadPayments();
          }}
        />
      )}
    </div>
  );
}
