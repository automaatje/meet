import { useEffect, useState } from 'react';
import { Plus, Trash2, Star, Edit2, X, Save } from 'lucide-react';
import { pricingService } from '../../lib/supabase';

interface Template {
  id: string;
  name: string;
  material_price_m2: number;
  labor_price_m2: number;
  waste_percentage: number;
  vat_percentage: number;
  is_default: boolean;
}

export default function PriceTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    material_price_m2: '0',
    labor_price_m2: '0',
    waste_percentage: '10',
    vat_percentage: '21',
    is_default: false,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await pricingService.getTemplates();
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await pricingService.updateTemplate(editingId, {
          name: formData.name,
          material_price_m2: parseFloat(formData.material_price_m2),
          labor_price_m2: parseFloat(formData.labor_price_m2),
          waste_percentage: parseFloat(formData.waste_percentage),
          vat_percentage: parseFloat(formData.vat_percentage),
          is_default: formData.is_default,
        });
      } else {
        await pricingService.createTemplate({
          name: formData.name,
          material_price_m2: parseFloat(formData.material_price_m2),
          labor_price_m2: parseFloat(formData.labor_price_m2),
          waste_percentage: parseFloat(formData.waste_percentage),
          vat_percentage: parseFloat(formData.vat_percentage),
          is_default: formData.is_default,
        });
      }
      setEditingId(null);
      setShowNew(false);
      setFormData({
        name: '',
        material_price_m2: '0',
        labor_price_m2: '0',
        waste_percentage: '10',
        vat_percentage: '21',
        is_default: false,
      });
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      material_price_m2: template.material_price_m2.toString(),
      labor_price_m2: template.labor_price_m2.toString(),
      waste_percentage: template.waste_percentage.toString(),
      vat_percentage: template.vat_percentage.toString(),
      is_default: template.is_default,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit sjabloon wilt verwijderen?')) return;
    try {
      await pricingService.deleteTemplate(id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await pricingService.updateTemplate(id, { is_default: true });
      loadTemplates();
    } catch (error) {
      console.error('Error setting default:', error);
    }
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Prijssjablonen</h2>
        <button
          onClick={() => setShowNew(true)}
          className="bg-brand-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuw sjabloon
        </button>
      </div>

      {(showNew || editingId) && (
        <div className="bg-white rounded-xl shadow-sm p-4 border-2 border-blue-200">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Sjabloon naam"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Materiaal (€/m²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.material_price_m2}
                  onChange={(e) => setFormData({ ...formData, material_price_m2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Arbeid (€/m²)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.labor_price_m2}
                  onChange={(e) => setFormData({ ...formData, labor_price_m2: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Waste (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.waste_percentage}
                  onChange={(e) => setFormData({ ...formData, waste_percentage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">BTW (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.vat_percentage}
                  onChange={(e) => setFormData({ ...formData, vat_percentage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">Standaard sjabloon</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 bg-brand-primary hover:opacity-90 text-white py-2 rounded-lg transition inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Opslaan
              </button>
              <button
                onClick={() => {
                  setShowNew(false);
                  setEditingId(null);
                  setFormData({
                    name: '',
                    material_price_m2: '0',
                    labor_price_m2: '0',
                    waste_percentage: '10',
                    vat_percentage: '21',
                    is_default: false,
                  });
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition inline-flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                {template.is_default && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Standaard
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {!template.is_default && (
                  <button
                    onClick={() => handleSetDefault(template.id)}
                    className="text-gray-400 hover:text-yellow-600 transition"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleEdit(template)}
                  className="text-gray-400 hover:text-brand-primary transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Materiaal:</span>{' '}
                <span className="font-semibold">€{template.material_price_m2.toFixed(2)}/m²</span>
              </div>
              <div>
                <span className="text-gray-500">Arbeid:</span>{' '}
                <span className="font-semibold">€{template.labor_price_m2.toFixed(2)}/m²</span>
              </div>
              <div>
                <span className="text-gray-500">Waste:</span>{' '}
                <span className="font-semibold">{template.waste_percentage}%</span>
              </div>
              <div>
                <span className="text-gray-500">BTW:</span>{' '}
                <span className="font-semibold">{template.vat_percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
