import { useState, useEffect } from 'react';
import { Calculator } from 'lucide-react';

interface FinancingCalculatorProps {
  totalAmount: number;
  onFinancingChange: (financing: FinancingDetails | null) => void;
  initialFinancing?: FinancingDetails | null;
}

export interface FinancingDetails {
  loanAmount: number;
  term: 7 | 10 | 15 | 20;
  interestRate: number;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
}

const INTEREST_RATES = {
  7: 3.61,
  10: 3.61,
  15: 4.11,
  20: 4.16,
} as const;

const MIN_AMOUNT_20_YEARS = 15000;

export default function FinancingCalculator({
  totalAmount,
  onFinancingChange,
  initialFinancing
}: FinancingCalculatorProps) {
  const [enabled, setEnabled] = useState(!!initialFinancing);
  const [loanAmount, setLoanAmount] = useState(initialFinancing?.loanAmount?.toString() || totalAmount.toString());
  const [term, setTerm] = useState<7 | 10 | 15 | 20>(initialFinancing?.term || 10);

  const calculateMonthlyPayment = (principal: number, annualRate: number, years: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    const numberOfPayments = years * 12;

    if (monthlyRate === 0) return principal / numberOfPayments;

    const monthlyPayment = principal *
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
  };

  const calculateFinancing = (): FinancingDetails | null => {
    const amount = parseFloat(loanAmount) || 0;
    if (!enabled || amount <= 0) return null;

    const rate = INTEREST_RATES[term];
    const monthly = calculateMonthlyPayment(amount, rate, term);
    const totalRepay = monthly * term * 12;
    const totalInt = totalRepay - amount;

    return {
      loanAmount: amount,
      term,
      interestRate: rate,
      monthlyPayment: monthly,
      totalInterest: totalInt,
      totalRepayment: totalRepay,
    };
  };

  useEffect(() => {
    const financing = calculateFinancing();
    onFinancingChange(financing);
  }, [enabled, loanAmount, term]);

  useEffect(() => {
    if (!initialFinancing) {
      setLoanAmount(totalAmount.toString());
    }
  }, [totalAmount]);

  const financing = calculateFinancing();
  const is20YearAllowed = parseFloat(loanAmount) >= MIN_AMOUNT_20_YEARS;

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="bg-brand-secondary p-2 rounded-lg">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Financiering Nationaal Warmtefonds
          </h3>
          <p className="text-sm text-gray-600">
            Spreid de kosten met een voordelige lening
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-secondary"></div>
        </label>
      </div>

      {enabled && (
        <div className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Te lenen bedrag
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                min="0"
                max={totalAmount}
                step="100"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Maximaal: € {totalAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Looptijd
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[7, 10, 15, 20].map((years) => {
                const isDisabled = years === 20 && !is20YearAllowed;
                return (
                  <button
                    key={years}
                    type="button"
                    onClick={() => !isDisabled && setTerm(years as 7 | 10 | 15 | 20)}
                    disabled={isDisabled}
                    className={`py-3 px-4 rounded-lg border-2 transition ${
                      term === years
                        ? 'border-brand-secondary bg-green-50 text-green-700 font-semibold'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold">{years} jaar</div>
                      <div className="text-xs mt-1">
                        {INTEREST_RATES[years as keyof typeof INTEREST_RATES]}% rente
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {!is20YearAllowed && (
              <p className="text-xs text-amber-600 mt-2">
                * 20 jaar looptijd is alleen mogelijk bij leningen vanaf € 15.000
              </p>
            )}
          </div>

          {financing && (
            <div className="bg-white rounded-lg p-4 space-y-3 border-2 border-green-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Maandlast</span>
                <span className="text-2xl font-bold text-green-700">
                  € {financing.monthlyPayment.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hoofdsom</span>
                  <span className="font-medium">
                    € {financing.loanAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Totale rente ({financing.term} jaar)</span>
                  <span className="font-medium">
                    € {financing.totalInterest.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">Totaal terug te betalen</span>
                  <span className="font-bold text-gray-900">
                    € {financing.totalRepayment.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 mt-3">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong>Nationaal Warmtefonds:</strong> Gespecialiseerd in het financieren van energiebesparende maatregelen.
                  Rentetarieven per 16 mei 2025.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
