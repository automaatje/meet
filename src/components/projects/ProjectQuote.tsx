import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import Calculator from '../pricing/Calculator';
import FinancingCalculator, { FinancingDetails } from '../pricing/FinancingCalculator';
import QuotePreview from '../quotes/QuotePreview';
import { generatePDFData, markQuoteAsSent } from '../../lib/pdf-generator';
import { projectService } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectQuoteProps {
  project: Project;
}

export default function ProjectQuote({ project }: ProjectQuoteProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  const initialFinancing: FinancingDetails | null = project.financing_enabled ? {
    loanAmount: project.financing_loan_amount || 0,
    term: (project.financing_term || 10) as 7 | 10 | 15 | 20,
    interestRate: project.financing_interest_rate || 0,
    monthlyPayment: project.financing_monthly_payment || 0,
    totalInterest: 0,
    totalRepayment: 0,
  } : null;

  const handlePreview = async () => {
    setLoading(true);
    try {
      const data = await generatePDFData({ projectId: project.id });
      setQuoteData(data);
      setShowPreview(true);
      await markQuoteAsSent(project.id);
    } catch (error) {
      console.error('Error generating quote:', error);
      alert('Fout bij genereren offerte. Controleer of alle gegevens compleet zijn in Instellingen.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinancingChange = async (financing: FinancingDetails | null) => {
    try {
      await projectService.update(project.id, {
        financing_enabled: !!financing,
        financing_loan_amount: financing?.loanAmount || null,
        financing_term: financing?.term || null,
        financing_interest_rate: financing?.interestRate || null,
        financing_monthly_payment: financing?.monthlyPayment || null,
      });
    } catch (error) {
      console.error('Error saving financing:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Calculator projectId={project.id} onTotalChange={setTotalAmount} />

      <FinancingCalculator
        totalAmount={totalAmount}
        onFinancingChange={handleFinancingChange}
        initialFinancing={initialFinancing}
      />

      <div className="bg-gradient-to-br from-blue-500 to-brand-primary rounded-xl shadow-sm p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <FileText className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Offerte delen</h3>
        </div>
        <p className="text-blue-50 mb-4">
          Genereer een professionele PDF offerte om te delen met je klant
        </p>
        <button
          onClick={handlePreview}
          disabled={loading}
          className="w-full bg-white hover:bg-blue-50 text-brand-primary font-medium py-3 px-4 rounded-lg transition min-h-[48px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Eye className="w-5 h-5" />
          {loading ? 'Bezig met laden...' : 'Bekijk & Download Offerte'}
        </button>
      </div>

      {quoteData && (
        <QuotePreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          quoteData={quoteData}
        />
      )}
    </div>
  );
}
