import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, Sparkles, CheckCircle, XCircle, AlertCircle, Save, Loader2 } from 'lucide-react';
import { analyzeGevel, fileToBase64, resizeImageIfNeeded } from '../../lib/ai/detectron-api';
import { photoService, measurementService } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import type { DetectionResult } from '../../types/measurements';

interface MeasurementScannerProps {
  projectId: string;
  onSuccess?: () => void;
}

export default function MeasurementScanner({ projectId, onSuccess }: MeasurementScannerProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setResult(null);

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      setError('Selecteer een geldige afbeelding');
      return;
    }

    try {
      // Resize if needed
      const resizedFile = await resizeImageIfNeeded(file, 2);

      setSelectedFile(resizedFile);
      const preview = URL.createObjectURL(resizedFile);
      setPreviewUrl(preview);
    } catch (err) {
      setError('Kon afbeelding niet laden');
      console.error('Error loading image:', err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(selectedFile);
      const detectionResult = await analyzeGevel(base64);

      setResult(detectionResult);

      // Auto-fill notes with detection summary
      const autoNotes = `AI analyse: ${detectionResult.windows.length} ramen, ${detectionResult.doors.length} deuren`;
      setNotes(autoNotes);

      toast.success('Gevel succesvol geanalyseerd');
    } catch (err: any) {
      const errorMessage = err.message || 'Kon gevel niet analyseren';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error analyzing facade:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !selectedFile) return;

    setSaving(true);
    setError(null);

    try {
      // Upload photo to Supabase Storage
      const photoData = await photoService.uploadPhoto(
        selectedFile,
        projectId,
        'AI gevel analyse',
        'detail'
      );

      // Save measurement to database
      await measurementService.create({
        project_id: projectId,
        photo_url: photoData.photo_url,
        wall_area_m2: result.facade_area_m2,
        doors_area_m2: result.total_doors_area_m2,
        windows_area_m2: result.total_windows_area_m2,
        net_area_m2: result.net_area_m2,
        reference_height: 2.1, // Standard door height in meters
        notes: notes || `AI analyse: ${result.windows.length} ramen, ${result.doors.length} deuren`,
      });

      toast.success('Meting succesvol opgeslagen');

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setResult(null);
      setNotes('');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kon meting niet opslaan';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving measurement:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-xl font-bold">AI Gevel Scanner</h2>
        </div>
        <p className="text-blue-100 text-sm">
          Upload een foto van de gevel en laat AI automatisch ramen, deuren en oppervlaktes berekenen
        </p>
      </div>

      {/* Upload Area */}
      {!previewUrl && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            isDragActive
              ? 'border-brand-primary bg-blue-50'
              : 'border-gray-300 hover:border-brand-primary hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            {isDragActive ? (
              <Upload className="w-12 h-12 text-brand-primary" />
            ) : (
              <Camera className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isDragActive ? 'Laat foto los...' : 'Upload gevel foto'}
              </p>
              <p className="text-sm text-gray-500">
                Sleep een foto hierheen of klik om te selecteren
              </p>
            </div>
            <div className="text-xs text-gray-400">
              JPG, PNG of WEBP - Max 2MB
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          <div className="p-4 flex gap-3">
            {!result && (
              <>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyseren met AI
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  disabled={analyzing}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Annuleren
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
          <p className="text-brand-primary font-medium mb-1">AI aan het werk...</p>
          <p className="text-sm text-gray-600">
            Dit kan 7-10 seconden duren
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fout</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Success Header */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Analyse voltooid</p>
              <p className="text-sm text-green-700">
                De gevel is succesvol geanalyseerd
              </p>
            </div>
          </div>

          {/* Result Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Totale Gevel</div>
              <div className="text-2xl font-bold text-gray-900">
                {result.facade_area_m2.toFixed(1)} m²
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Netto Oppervlak</div>
              <div className="text-2xl font-bold text-brand-primary">
                {result.net_area_m2.toFixed(1)} m²
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Ramen</div>
              <div className="text-xl font-bold text-gray-900">
                {result.windows.length}x ({result.total_windows_area_m2.toFixed(1)} m²)
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Deuren</div>
              <div className="text-xl font-bold text-gray-900">
                {result.doors.length}x ({result.total_doors_area_m2.toFixed(1)} m²)
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {(result.windows.length > 0 || result.doors.length > 0) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 mb-3">Details</h3>

              {result.windows.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-2">Ramen:</p>
                  <div className="space-y-1">
                    {result.windows.map((window, idx) => (
                      <div key={window.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">Raam {idx + 1}</span>
                        <span className="font-medium">
                          {window.area_m2.toFixed(2)} m²
                          <span className="text-gray-500 ml-2">
                            ({(window.confidence * 100).toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.doors.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Deuren:</p>
                  <div className="space-y-1">
                    {result.doors.map((door, idx) => (
                      <div key={door.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">Deur {idx + 1}</span>
                        <span className="font-medium">
                          {door.area_m2.toFixed(2)} m²
                          <span className="text-gray-500 ml-2">
                            ({(door.confidence * 100).toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Low Confidence Warning */}
          {(result.windows.some(w => w.confidence < 0.7) || result.doors.some(d => d.confidence < 0.7)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Let op</p>
                <p className="text-sm text-yellow-700">
                  Sommige detecties hebben een lage betrouwbaarheid. Controleer de resultaten.
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
              placeholder="Voeg extra notities toe..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Opslaan
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Nieuwe Scan
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      {!selectedFile && !result && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Tips voor beste resultaten
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Zorg dat de gevel volledig in beeld is</li>
            <li>• Maak de foto bij goed daglicht</li>
            <li>• Zorg dat minstens één deur zichtbaar is (voor kalibratie)</li>
            <li>• Vermijd schaduw en reflecties waar mogelijk</li>
          </ul>
        </div>
      )}
    </div>
  );
}
