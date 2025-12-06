import { useState } from 'react';
import { X, Download, Send, Loader } from 'lucide-react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import QuotePDF from './QuotePDF';

interface QuotePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: {
    quote: {
      quoteNumber: string;
      date: string;
      validUntil: string;
    };
    company: {
      name: string;
      address: string;
      postalCode: string;
      city: string;
      phone: string;
      email: string;
      kvkNumber?: string;
      btwNumber?: string;
      logoUrl?: string;
    };
    customer: {
      name: string;
      address: string;
      postalCode: string;
      city: string;
      phone?: string;
      email?: string;
    };
    project: {
      title: string;
      address: string;
      description?: string;
    };
    lineItems: Array<{
      description: string;
      area_m2: number;
      price_per_m2: number;
      total: number;
    }>;
    totals: {
      subtotal: number;
      vat: number;
      total: number;
    };
    terms?: {
      payment?: string;
      conditions?: string;
    };
  };
}

export default function QuotePreview({ isOpen, onClose, quoteData }: QuotePreviewProps) {
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSendEmail = async () => {
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('Email verzenden functionaliteit komt binnenkort!');
    setSending(false);
  };

  const filename = `Offerte-${quoteData.quote.quoteNumber}-${(quoteData.customer.name || 'Klant').replace(/\s+/g, '-')}.pdf`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Offerte Preview</h2>
          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={<QuotePDF {...quoteData} />}
              fileName={filename}
              className="bg-brand-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center gap-2"
            >
              {({ loading }) =>
                loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Laden...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )
              }
            </PDFDownloadLink>
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="bg-brand-secondary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center gap-2 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Verzenden...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Verstuur Email
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <PDFViewer width="100%" height="100%" className="border-0">
            <QuotePDF {...quoteData} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
