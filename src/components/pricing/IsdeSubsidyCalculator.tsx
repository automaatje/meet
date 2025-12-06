import { Info, AlertCircle } from 'lucide-react';

interface IsdeSubsidyCalculatorProps {
  subsidyType: string | null;
  areaM2: number;
  totalMeasuresInProject: number;
  onSubsidyTypeChange: (type: string | null) => void;
}

interface SubsidyConfig {
  label: string;
  singleRate: number;
  doubleRate: number;
  minArea: number;
  maxArea: number;
}

const SUBSIDY_TYPES: Record<string, SubsidyConfig> = {
  spouwmuurisolatie: {
    label: 'Spouwmuurisolatie',
    singleRate: 5.25,
    doubleRate: 10.50,
    minArea: 10,
    maxArea: 170,
  },
  vloerisolatie: {
    label: 'Vloerisolatie',
    singleRate: 5.50,
    doubleRate: 11.00,
    minArea: 20,
    maxArea: 130,
  },
  dakisolatie: {
    label: 'Dakisolatie',
    singleRate: 16.25,
    doubleRate: 32.50,
    minArea: 20,
    maxArea: 200,
  },
  kunststof_kozijnen_triple_glas: {
    label: 'Kunststof kozijnen met triple glas',
    singleRate: 111,
    doubleRate: 222,
    minArea: 3,
    maxArea: 45,
  },
};

export default function IsdeSubsidyCalculator({
  subsidyType,
  areaM2,
  totalMeasuresInProject,
  onSubsidyTypeChange,
}: IsdeSubsidyCalculatorProps) {
  const config = subsidyType ? SUBSIDY_TYPES[subsidyType] : null;
  const isDoubleMeasure = totalMeasuresInProject >= 2;

  const calculateSubsidy = () => {
    if (!config) return 0;

    const cappedArea = Math.min(Math.max(areaM2, 0), config.maxArea);
    const rate = isDoubleMeasure ? config.doubleRate : config.singleRate;

    return cappedArea * rate;
  };

  const getValidationMessage = () => {
    if (!config || areaM2 === 0) return null;

    if (areaM2 < config.minArea) {
      return `Let op: minimaal ${config.minArea}m² vereist voor subsidie`;
    }
    if (areaM2 > config.maxArea) {
      return `Let op: subsidie wordt berekend over maximaal ${config.maxArea}m² (huidige oppervlakte: ${areaM2.toFixed(2)}m²)`;
    }
    return null;
  };

  const subsidyAmount = calculateSubsidy();
  const validationMessage = getValidationMessage();
  const isEligible = config && areaM2 >= config.minArea;

  return (
    <div className="border-t pt-3 mt-3 space-y-3">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-brand-primary mt-0.5 flex-shrink-0" />
        <div className="text-xs text-gray-600">
          <p className="font-medium text-gray-900 mb-1">ISDE Subsidie (RVO)</p>
          <p>Investeringssubsidie duurzame energie en energiebesparing</p>
          {totalMeasuresInProject >= 2 && (
            <p className="mt-1 font-medium text-green-700">
              Dubbele subsidie actief (2+ maatregelen in offerte)
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Subsidie type
        </label>
        <select
          value={subsidyType || ''}
          onChange={(e) => onSubsidyTypeChange(e.target.value || null)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        >
          <option value="">Geen subsidie</option>
          {Object.entries(SUBSIDY_TYPES).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label} (€{isDoubleMeasure ? config.doubleRate : config.singleRate}/m²)
            </option>
          ))}
        </select>
      </div>

      {config && (
        <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-blue-900">Tarief:</span>
              <span className="font-medium text-blue-900">
                €{isDoubleMeasure ? config.doubleRate : config.singleRate} per m²
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-900">Oppervlakte:</span>
              <span className="font-medium text-blue-900">{areaM2.toFixed(2)} m²</span>
            </div>
            <div className="text-blue-700 text-[10px]">
              Min: {config.minArea}m² | Max: {config.maxArea}m²
            </div>
          </div>
        </div>
      )}

      {validationMessage && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-2">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">{validationMessage}</p>
        </div>
      )}

      {isEligible && subsidyAmount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-900">ISDE Subsidie:</span>
            <span className="text-lg font-bold text-green-700">€{subsidyAmount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-brand-secondary mt-1">
            {Math.min(areaM2, config.maxArea).toFixed(2)} m² × €{isDoubleMeasure ? config.doubleRate : config.singleRate}
          </p>
        </div>
      )}
    </div>
  );
}
