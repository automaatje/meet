import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Download,
  Send,
  Save
} from 'lucide-react';

interface InvoiceFormProps {
  projectId?: string;
  customerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Customer {
  id: string;
  company_name: string | null;
  contact_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

export default function InvoiceForm({ projectId, customerId, onClose, onSuccess }: InvoiceFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [paymentTerms, setPaymentTerms] = useState('Betaling binnen 30 dagen na factuurdatum');

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, total: 0 },
  ]);

  useEffect(() => {
    loadInitialData();
  }, [projectId, customerId]);

  const loadInitialData = async () => {
    if (customerId) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (data) {
        setCustomer(data);
      }
    } else if (projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select('customer:customers(*)')
        .eq('id', projectId)
        .single();

      if (project?.customer) {
        setCustomer(project.customer as any);
      }
    }

    const { data: invoiceNum } = await supabase
      .rpc('generate_invoice_number', { user_uuid: user?.id });

    if (invoiceNum) {
      setInvoiceNumber(invoiceNum);
    }
  };

  const loadQuoteLineItems = async () => {
    if (!projectId) return;

    const { data: quote } = await supabase
      .from('quotes')
      .select('line_items:quote_line_items(*)')
      .eq('project_id', projectId)
      .maybeSingle();

    if (quote?.line_items && Array.isArray(quote.line_items) && quote.line_items.length > 0) {
      const items = quote.line_items.map((item: any) => ({
        id: crypto.randomUUID(),
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total: item.total || 0,
      }));
      setLineItems(items);
      showToast('Offerte regels geïmporteerd', 'success');
    } else {
      showToast('Geen offerte regels gevonden', 'warning');
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(items =>
      items.map(item => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === 'quantity' || field === 'unit_price') {
          updated.total = updated.quantity * updated.unit_price;
        }

        return updated;
      })
    );
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0, total: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      showToast('Minimaal 1 regel vereist', 'error');
      return;
    }
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = subtotal * 0.21;
    const total = subtotal + vatAmount;
    return { subtotal, vatAmount, total };
  };

  const validateStep = (stepNum: number) => {
    if (stepNum === 1) {
      if (!invoiceNumber || !invoiceDate || !dueDate) {
        showToast('Vul alle verplichte velden in', 'error');
        return false;
      }
      if (new Date(dueDate) < new Date(invoiceDate)) {
        showToast('Vervaldatum moet na factuurdatum zijn', 'error');
        return false;
      }
    }

    if (stepNum === 2) {
      const hasEmptyItems = lineItems.some(item => !item.description || item.quantity <= 0);
      if (hasEmptyItems) {
        showToast('Alle factuurregels moeten ingevuld zijn', 'error');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!validateStep(2)) return;
    if (!customer) return;

    setLoading(true);

    try {
      const { subtotal, vatAmount, total } = calculateTotals();

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user?.id,
          project_id: projectId || null,
          customer_id: customer.id,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          status: status,
          subtotal,
          vat_amount: vatAmount,
          total_amount: total,
          payment_terms: paymentTerms,
          sent_at: status === 'sent' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const lineItemsData = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        sort_order: index,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsData);

      if (lineItemsError) throw lineItemsError;

      showToast(
        status === 'draft' ? 'Factuur opgeslagen als concept' : 'Factuur verzonden',
        'success'
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showToast('Fout bij opslaan factuur', 'error');
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, vatAmount, total } = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Nieuwe Factuur</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= num
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > num ? <Check className="w-5 h-5" /> : num}
                </div>
                <div className="ml-3 flex-1">
                  <div className={`text-sm font-medium ${step >= num ? 'text-gray-900' : 'text-gray-500'}`}>
                    {num === 1 && 'Basis Informatie'}
                    {num === 2 && 'Factuurregels'}
                    {num === 3 && 'Preview'}
                  </div>
                </div>
                {num < 3 && (
                  <div className={`h-0.5 w-full mx-4 ${step > num ? 'bg-brand-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Klantgegevens</h3>
                {customer ? (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p className="font-medium">{customer.company_name || customer.contact_name}</p>
                    {customer.company_name && <p>{customer.contact_name}</p>}
                    {customer.email && <p>{customer.email}</p>}
                    {customer.phone && <p>{customer.phone}</p>}
                    {customer.address && <p className="text-gray-600">{customer.address}</p>}
                  </div>
                ) : (
                  <p className="text-gray-500">Geen klant geselecteerd</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factuurnummer *
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Factuurdatum *
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vervaldatum *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betalingsvoorwaarden
                </label>
                <textarea
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {projectId && (
                <button
                  onClick={loadQuoteLineItems}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
                >
                  <Download className="w-4 h-4" />
                  Importeer uit Offerte
                </button>
              )}

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          placeholder="Omschrijving *"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        />

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Aantal</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Prijs p/st</label>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Totaal</label>
                            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg font-semibold text-gray-900">
                              €{item.total.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeLineItem(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition mt-1"
                        title="Verwijder regel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={addLineItem}
                className="flex items-center gap-2 px-4 py-2 text-brand-primary border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Regel toevoegen
              </button>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Subtotaal</span>
                    <span className="font-medium text-gray-900">€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">BTW (21%)</span>
                    <span className="font-medium text-gray-900">€{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-green-300 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900">Totaal incl. BTW</span>
                    <span className="text-2xl font-bold text-brand-secondary">€{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Factuurvoorbeeld</h3>

                <div className="bg-white rounded-lg p-6 mb-4">
                  <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">FACTUUR</h1>
                    <p className="text-lg font-mono text-gray-600 mt-2">{invoiceNumber}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Aan:</h4>
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{customer?.company_name || customer?.contact_name}</p>
                        {customer?.company_name && <p>{customer?.contact_name}</p>}
                        {customer?.email && <p>{customer?.email}</p>}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm"><span className="font-medium">Factuurdatum:</span> {new Date(invoiceDate).toLocaleDateString('nl-NL')}</p>
                      <p className="text-sm"><span className="font-medium">Vervaldatum:</span> {new Date(dueDate).toLocaleDateString('nl-NL')}</p>
                    </div>
                  </div>

                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="text-left py-2 text-sm font-semibold">Omschrijving</th>
                        <th className="text-right py-2 text-sm font-semibold">Aantal</th>
                        <th className="text-right py-2 text-sm font-semibold">Prijs</th>
                        <th className="text-right py-2 text-sm font-semibold">Totaal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item) => (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="py-2 text-sm">{item.description}</td>
                          <td className="text-right py-2 text-sm">{item.quantity}</td>
                          <td className="text-right py-2 text-sm">€{item.unit_price.toFixed(2)}</td>
                          <td className="text-right py-2 text-sm font-medium">€{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotaal</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>BTW (21%)</span>
                        <span>€{vatAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t-2 border-gray-300 pt-2">
                        <span>Totaal</span>
                        <span>€{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {paymentTerms && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-between">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Annuleren' : 'Vorige'}
          </button>

          <div className="flex gap-2">
            {step === 3 && (
              <>
                <button
                  onClick={() => handleSave('draft')}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  Opslaan als Concept
                </button>
                <button
                  onClick={() => handleSave('sent')}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Versturen
                </button>
              </>
            )}

            {step < 3 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition"
              >
                Volgende
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
