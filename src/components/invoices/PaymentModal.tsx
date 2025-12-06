import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { DollarSign } from 'lucide-react';
import { triggerWebhooks } from '../../lib/webhooks/trigger';
import { WEBHOOK_EVENTS, EventPayloads } from '../../lib/webhooks/events';

interface PaymentModalProps {
  invoiceId: string;
  outstandingAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({ invoiceId, outstandingAmount, onClose, onSuccess }: PaymentModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState(outstandingAmount);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0 || amount > outstandingAmount) {
      showToast('Ongeldig bedrag', 'error');
      return;
    }

    if (!paymentMethod) {
      showToast('Selecteer een betaalmethode', 'error');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('payments').insert({
        invoice_id: invoiceId,
        user_id: user?.id,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference,
        notes,
      });

      if (error) throw error;

      const { data: invoice } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(id, contact_name, company_name, email)
        `)
        .eq('id', invoiceId)
        .single();

      if (invoice && invoice.customer && invoice.status === 'paid' && user) {
        await triggerWebhooks(
          user.id,
          WEBHOOK_EVENTS.INVOICE_PAID,
          EventPayloads[WEBHOOK_EVENTS.INVOICE_PAID](invoice, invoice.customer)
        );
      }

      showToast('Betaling geregistreerd', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error registering payment:', error);
      showToast('Fout bij registreren betaling', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Betaling Registreren</h2>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-brand-primary" />
              <div>
                <div className="text-sm text-gray-600">Nog te betalen</div>
                <div className="text-2xl font-bold text-brand-primary">€{outstandingAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bedrag *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0.01"
              max={outstandingAmount}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Betaaldatum *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Betaalmethode *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              required
            >
              <option value="">Selecteer methode</option>
              <option value="ideal">iDeal</option>
              <option value="bank">Bankoverschrijving</option>
              <option value="cash">Contant</option>
              <option value="pin">Pin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Referentie</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transactie ID of kenmerk"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notities (optioneel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Opslaan...' : 'Registreren'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
