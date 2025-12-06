import { useState, useRef } from 'react';
import { Camera, X, Save, Loader, Sparkles, Upload } from 'lucide-react';
import { measurementService, photoService, supabase } from '../../lib/supabase';

interface NewMeasurementProps {
  projectId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function NewMeasurement({ projectId, onComplete, onCancel }: NewMeasurementProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analyze'>('upload');
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [wallArea, setWallArea] = useState('0');
  const [doorsArea, setDoorsArea] = useState('0');
  const [windowsArea, setWindowsArea] = useState('0');
  const [notes, setNotes] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setStep('analyze');
    };
    reader.readAsDataURL(file);
  };

  const simulateAIAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setWallArea('25.50');
      setDoorsArea('4.20');
      setWindowsArea('3.80');
      setAnalyzing(false);
    }, 2000);
  };

  const netArea = () => {
    const wall = parseFloat(wallArea) || 0;
    const doors = parseFloat(doorsArea) || 0;
    const windows = parseFloat(windowsArea) || 0;
    return Math.max(0, wall - doors - windows);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('project-photos')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-photos')
        .getPublicUrl(filePath);

      await measurementService.create({
        project_id: projectId,
        photo_url: publicUrl,
        wall_area_m2: parseFloat(wallArea) || 0,
        doors_area_m2: parseFloat(doorsArea) || 0,
        windows_area_m2: parseFloat(windowsArea) || 0,
        net_area_m2: netArea(),
        notes: notes || null,
      });

      onComplete();
    } catch (error) {
      console.error('Error saving measurement:', error);
      alert('Fout bij opslaan. Probeer opnieuw.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nieuwe meting</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={saving || analyzing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {step === 'upload' ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Maak of upload een foto
              </h3>
              <p className="text-gray-600 mb-6">
                Foto van de te schilderen muur voor oppervlakte berekening
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Foto maken
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture');
                      fileInputRef.current.click();
                    }
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Uploaden
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <img
                  src={previewUrl!}
                  alt="Meting foto"
                  className="w-full h-64 object-cover rounded-lg"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-center">
                      <Loader className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Analyseren...</p>
                    </div>
                  </div>
                )}
              </div>

              {!analyzing && parseFloat(wallArea) === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">
                        AI Analyse (Demo)
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Simuleer AI analyse om automatisch oppervlaktes te berekenen
                      </p>
                      <button
                        onClick={simulateAIAnalysis}
                        className="bg-brand-primary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition min-h-[40px] inline-flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Analyse simuleren
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Oppervlaktes (m²)</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Totaal muuroppervlak *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={wallArea}
                    onChange={(e) => setWallArea(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deuren oppervlak
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={doorsArea}
                    onChange={(e) => setDoorsArea(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kozijnen oppervlak
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={windowsArea}
                    onChange={(e) => setWindowsArea(e.target.value)}
                    disabled={saving}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-900">Netto oppervlak</span>
                    <span className="text-2xl font-bold text-brand-secondary">
                      {netArea().toFixed(2)} m²
                    </span>
                  </div>
                  <p className="text-xs text-brand-secondary mt-1">
                    = Totaal - Deuren - Kozijnen
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notities
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition resize-none"
                    placeholder="Extra opmerkingen over deze meting..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition min-h-[48px] disabled:opacity-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || parseFloat(wallArea) === 0}
                  className="flex-1 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Meting opslaan
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
