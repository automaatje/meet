import { useState, useRef } from 'react';
import { Camera, X, Upload, Loader } from 'lucide-react';
import { photoService } from '../../lib/supabase';

interface PhotoUploadProps {
  projectId: string;
  onUploadComplete: () => void;
  onCancel: () => void;
}

const photoTypes = [
  { value: 'before', label: 'Voor' },
  { value: 'after', label: 'Na' },
  { value: 'detail', label: 'Detail' },
] as const;

export default function PhotoUpload({ projectId, onUploadComplete, onCancel }: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'detail'>('detail');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecteer een geldige afbeelding');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Afbeelding is te groot (max 10MB)');
      return;
    }

    setSelectedFile(file);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    try {
      await photoService.uploadPhoto(selectedFile, projectId, caption, photoType);
      onUploadComplete();
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload mislukt. Probeer het opnieuw.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Foto toevoegen</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={uploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selecteer een foto
              </h3>
              <p className="text-gray-600 mb-6">
                Maximaal 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Kies foto
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type foto
                </label>
                <div className="flex gap-2">
                  {photoTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setPhotoType(type.value)}
                      disabled={uploading}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                        photoType === type.value
                          ? 'bg-brand-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschrijving (optioneel)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={uploading}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent transition resize-none"
                  placeholder="Voeg een beschrijving toe..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={uploading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition min-h-[48px] disabled:opacity-50"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Uploaden...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload foto
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
