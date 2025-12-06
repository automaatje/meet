import React, { useState } from 'react';
import { Check, Save, Trash2, Plus, Minus } from 'lucide-react';
import {
  FieldMapping,
  MappingPreset,
  getPresetsForEntity,
  getCustomMappings,
  saveCustomMapping,
  deleteCustomMapping
} from '../../lib/export/field-mappings';

interface FieldMapperProps {
  entity: 'customers' | 'projects' | 'invoices';
  availableFields: FieldMapping[];
  selectedMapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export function FieldMapper({ entity, availableFields, selectedMapping, onMappingChange }: FieldMapperProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(Object.keys(selectedMapping))
  );
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customMappingName, setCustomMappingName] = useState('');

  const presets = [...getPresetsForEntity(entity), ...getCustomMappings(entity)];

  const handleFieldToggle = (sourceField: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(sourceField)) {
      newSelected.delete(sourceField);
      const newMapping = { ...selectedMapping };
      delete newMapping[sourceField];
      onMappingChange(newMapping);
    } else {
      newSelected.add(sourceField);
      const field = availableFields.find(f => f.sourceField === sourceField);
      if (field) {
        onMappingChange({
          ...selectedMapping,
          [sourceField]: field.targetField
        });
      }
    }
    setSelectedFields(newSelected);
  };

  const handleTargetFieldChange = (sourceField: string, targetField: string) => {
    onMappingChange({
      ...selectedMapping,
      [sourceField]: targetField
    });
  };

  const handlePresetSelect = (preset: MappingPreset) => {
    onMappingChange(preset.mapping);
    setSelectedFields(new Set(Object.keys(preset.mapping)));
  };

  const handleSaveMapping = () => {
    if (!customMappingName.trim()) return;
    saveCustomMapping(entity, customMappingName, selectedMapping);
    setCustomMappingName('');
    setShowSaveDialog(false);
  };

  const handleDeleteMapping = (id: string) => {
    if (confirm('Weet je zeker dat je deze mapping wilt verwijderen?')) {
      deleteCustomMapping(entity, id);
    }
  };

  const handleSelectAll = () => {
    const allFields = new Set(availableFields.map(f => f.sourceField));
    setSelectedFields(allFields);
    const newMapping: Record<string, string> = {};
    availableFields.forEach(field => {
      newMapping[field.sourceField] = field.targetField;
    });
    onMappingChange(newMapping);
  };

  const handleDeselectAll = () => {
    setSelectedFields(new Set());
    onMappingChange({});
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Selecteer een preset mapping</h3>
          <button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            className="text-sm text-brand-primary hover:text-blue-700 flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Huidige mapping opslaan
          </button>
        </div>

        {showSaveDialog && (
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={customMappingName}
              onChange={(e) => setCustomMappingName(e.target.value)}
              placeholder="Naam voor deze mapping..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleSaveMapping}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 text-sm"
            >
              Opslaan
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetSelect(preset)}
              className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{preset.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{preset.description}</div>
                </div>
                {preset.id.startsWith('custom_') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMapping(preset.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Pas velden aan</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-brand-primary hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Alles selecteren
          </button>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
          >
            <Minus className="w-4 h-4" />
            Alles deselecteren
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">BouwMeet Velden</h4>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availableFields.map((field) => (
              <label
                key={field.sourceField}
                className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedFields.has(field.sourceField)}
                  onChange={() => handleFieldToggle(field.sourceField)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{field.targetField}</div>
                  <div className="text-xs text-gray-500">{field.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Export Veldnamen</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Array.from(selectedFields).map((sourceField) => {
              const field = availableFields.find(f => f.sourceField === sourceField);
              if (!field) return null;

              return (
                <div key={sourceField} className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500 mb-1">{field.description}</div>
                  <input
                    type="text"
                    value={selectedMapping[sourceField] || ''}
                    onChange={(e) => handleTargetFieldChange(sourceField, e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                    placeholder="Exportveld naam..."
                  />
                </div>
              );
            })}
            {selectedFields.size === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                Selecteer velden aan de linkerkant
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Check className="w-4 h-4 text-brand-secondary" />
          <span>
            {selectedFields.size} {selectedFields.size === 1 ? 'veld' : 'velden'} geselecteerd voor export
          </span>
        </div>
      </div>
    </div>
  );
}
