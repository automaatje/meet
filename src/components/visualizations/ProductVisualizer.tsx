import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  Loader2,
  Eye,
  Download,
  Package,
} from 'lucide-react';
import ReactCompareImage from 'react-compare-image';
import { analyzeGevel, fileToBase64, resizeImageIfNeeded } from '../../lib/ai/detectron-api';
import { generateVisualization, imageUrlToBase64 } from '../../lib/ai/visualization-api';
import { photoService, visualizationService, productService } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import ProductSelector from './ProductSelector';
import type { DetectionResult } from '../../types/measurements';
import type { DetectedObject, ProductSelection } from '../../types/visualizations';
import type { Database } from '../../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductVisualizerProps {
  projectId: string;
  onSuccess?: () => void;
}

type Step = 'upload' | 'detect' | 'select' | 'preview';

export default function ProductVisualizer({ projectId, onSuccess }: ProductVisualizerProps) {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<number, Product>>(new Map());
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<number | null>(null);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setDetectionResult(null);
    setDetectedObjects([]);
    setSelectedProducts(new Map());

    if (!file.type.startsWith('image/')) {
      setError('Selecteer een geldige afbeelding');
      return;
    }

    try {
      const resizedFile = await resizeImageIfNeeded(file, 2);
      setSelectedFile(resizedFile);
      const preview = URL.createObjectURL(resizedFile);
      setPreviewUrl(preview);
      setStep('detect');
    } catch (err) {
      setError('Kon afbeelding niet laden');
      console.error('Error loading image:', err);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleDetect = async () => {
    if (!selectedFile) return;

    setDetecting(true);
    setError(null);
    setDetectionResult(null);
    setDetectedObjects([]);

    try {
      const base64 = await fileToBase64(selectedFile);
      const result = await analyzeGevel(base64);
      setDetectionResult(result);

      const objects: DetectedObject[] = [
        ...result.windows.map((w, idx) => ({
          object_id: idx,
          type: 'window' as const,
          bbox: w.bbox,
          confidence: w.confidence,
          area_m2: w.area_m2,
        })),
        ...result.doors.map((d, idx) => ({
          object_id: result.windows.length + idx,
          type: 'door' as const,
          bbox: d.bbox,
          confidence: d.confidence,
          area_m2: d.area_m2,
        })),
      ];

      if (objects.length === 0) {
        setError('Geen ramen of deuren gedetecteerd op de foto');
        toast.error('Geen objecten gevonden');
        return;
      }

      setDetectedObjects(objects);
      setStep('select');
      toast.success(`${objects.length} objecten gedetecteerd`);
    } catch (err: any) {
      const errorMessage = err.message || 'Kon objecten niet detecteren';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error detecting objects:', err);
    } finally {
      setDetecting(false);
    }
  };

  const handleSelectProduct = (objectId: number) => {
    setSelectedObjectId(objectId);
    setShowProductSelector(true);
  };

  const handleProductSelected = (productId: string, product: Product) => {
    if (selectedObjectId === null) return;

    const newMap = new Map(selectedProducts);
    newMap.set(selectedObjectId, product);
    setSelectedProducts(newMap);
    setShowProductSelector(false);
    setSelectedObjectId(null);
  };

  const handleGeneratePreview = async () => {
    if (!selectedFile || selectedProducts.size === 0) return;

    setGenerating(true);
    setError(null);

    try {
      const originalBase64 = await fileToBase64(selectedFile);

      const detectionsWithProducts = await Promise.all(
        Array.from(selectedProducts.entries()).map(async ([objectId, product]) => {
          const object = detectedObjects.find((obj) => obj.object_id === objectId);
          if (!object || !product.product_image_url) {
            throw new Error('Product afbeelding ontbreekt');
          }

          const productBase64 = await imageUrlToBase64(product.product_image_url);

          return {
            object_id: objectId,
            bbox: object.bbox,
            product_image: productBase64,
          };
        })
      );

      const result = await generateVisualization({
        original_image: originalBase64,
        detections: detectionsWithProducts,
      });

      setBeforeImage(`data:image/jpeg;base64,${result.before_image}`);
      setAfterImage(`data:image/jpeg;base64,${result.after_image}`);
      setStep('preview');
      toast.success('Visualisatie gegenereerd!');
    } catch (err: any) {
      const errorMessage = err.message || 'Kon visualisatie niet genereren';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error generating visualization:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !afterImage || !beforeImage) return;

    setSaving(true);
    setError(null);

    try {
      const originalPhotoData = await photoService.uploadPhoto(
        selectedFile,
        projectId,
        'AI Visualisatie - Original',
        'before'
      );

      const afterBlob = await fetch(afterImage).then((r) => r.blob());
      const afterFile = new File([afterBlob], 'visualization.png', { type: 'image/png' });

      const visualizationPhotoData = await photoService.uploadPhoto(
        afterFile,
        projectId,
        'AI Visualisatie - After',
        'after'
      );

      const detectionsWithProducts = detectedObjects.map((obj) => ({
        ...obj,
        product_id: selectedProducts.get(obj.object_id)?.id || null,
      }));

      await visualizationService.create({
        project_id: projectId,
        original_photo_url: originalPhotoData.photo_url,
        visualization_photo_url: visualizationPhotoData.photo_url,
        detected_objects: detectionsWithProducts,
      });

      toast.success('Visualisatie succesvol opgeslagen');
      handleReset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kon visualisatie niet opslaan';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving visualization:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = (type: 'before' | 'after') => {
    const imageUrl = type === 'before' ? beforeImage : afterImage;
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `visualisatie-${type}-${Date.now()}.png`;
    link.click();
    toast.success(`${type === 'before' ? 'Voor' : 'Na'} foto gedownload`);
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setDetectedObjects([]);
    setSelectedProducts(new Map());
    setBeforeImage(null);
    setAfterImage(null);
    setError(null);
  };

  const getObjectTypeLabel = (type: string) => {
    switch (type) {
      case 'window':
        return 'Raam';
      case 'door':
        return 'Deur';
      case 'exterior_door':
        return 'Buitendeur';
      default:
        return type;
    }
  };

  const currentStepNumber = ['upload', 'detect', 'select', 'preview'].indexOf(step) + 1;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-6 h-6" />
          <h2 className="text-xl font-bold">Product Visualizer</h2>
        </div>
        <p className="text-blue-100 text-sm">
          Upload een foto, detecteer objecten, selecteer producten en genereer een before/after visualisatie
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          {[
            { num: 1, label: 'Upload', icon: Upload },
            { num: 2, label: 'Detecteer', icon: Eye },
            { num: 3, label: 'Selecteer', icon: Package },
            { num: 4, label: 'Preview', icon: CheckCircle },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    currentStepNumber >= s.num
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStepNumber > s.num ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <s.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs mt-2 font-medium ${
                    currentStepNumber >= s.num ? 'text-brand-primary' : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`h-0.5 flex-1 mx-2 ${
                    currentStepNumber > s.num ? 'bg-brand-primary' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fout</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {step === 'upload' && (
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
            <div className="text-xs text-gray-400">JPG, PNG of WEBP - Max 2MB</div>
          </div>
        </div>
      )}

      {step === 'detect' && previewUrl && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
          <div className="p-4 flex gap-3">
            <button
              onClick={handleDetect}
              disabled={detecting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Detecteren...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Detecteer Ramen/Deuren
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={detecting}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {detecting && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
          <p className="text-brand-primary font-medium mb-1">AI detecteert objecten...</p>
          <p className="text-sm text-gray-600">Dit kan 7-10 seconden duren</p>
        </div>
      )}

      {step === 'select' && detectedObjects.length > 0 && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">
                {detectedObjects.length} objecten gedetecteerd
              </p>
              <p className="text-sm text-green-700">
                Selecteer een product voor elk object
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Gedetecteerde Objecten</h3>
            <div className="space-y-3">
              {detectedObjects.map((obj) => {
                const hasProduct = selectedProducts.has(obj.object_id);
                const product = selectedProducts.get(obj.object_id);

                return (
                  <div
                    key={obj.object_id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-brand-primary transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {getObjectTypeLabel(obj.type)} {obj.object_id + 1}
                        </span>
                        <span className="text-sm text-gray-500">
                          {obj.area_m2.toFixed(2)} m² • {(obj.confidence * 100).toFixed(0)}%
                          zekerheid
                        </span>
                      </div>
                      {hasProduct && product && (
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {product.name} {product.brand ? `- ${product.brand}` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleSelectProduct(obj.object_id)}
                      className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                        hasProduct
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-brand-primary text-white hover:opacity-90'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      {hasProduct ? 'Wijzig' : 'Selecteer'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleGeneratePreview}
              disabled={selectedProducts.size === 0 || generating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-secondary text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Genereren...
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  Genereer Preview ({selectedProducts.size}/{detectedObjects.length})
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={generating}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {generating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-3" />
          <p className="text-brand-primary font-medium mb-1">
            Visualisatie aan het genereren...
          </p>
          <p className="text-sm text-gray-600">Dit kan 15-20 seconden duren</p>
        </div>
      )}

      {step === 'preview' && beforeImage && afterImage && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Visualisatie gegenereerd!</p>
              <p className="text-sm text-green-700">
                Gebruik de slider om te vergelijken
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-96">
              <ReactCompareImage
                leftImage={beforeImage}
                rightImage={afterImage}
                sliderLineColor="#2563EB"
                sliderLineWidth={4}
              />
            </div>
          </div>

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
              onClick={() => handleDownload('before')}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Voor
            </button>
            <button
              onClick={() => handleDownload('after')}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Na
            </button>
            <button
              onClick={handleReset}
              disabled={saving}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Nieuwe
            </button>
          </div>
        </div>
      )}

      {!detecting && !generating && detectedObjects.length === 0 && step === 'upload' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Tips voor beste resultaten
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload een duidelijke foto van de gevel</li>
            <li>• Zorg dat ramen en deuren goed zichtbaar zijn</li>
            <li>• Maak de foto bij goed daglicht</li>
            <li>• Vermijd schaduw en reflecties waar mogelijk</li>
          </ul>
        </div>
      )}

      {showProductSelector && selectedObjectId !== null && (
        <ProductSelector
          category={
            detectedObjects.find((obj) => obj.object_id === selectedObjectId)?.type || 'window'
          }
          selectedProductId={selectedProducts.get(selectedObjectId)?.id}
          onChange={handleProductSelected}
          onCancel={() => {
            setShowProductSelector(false);
            setSelectedObjectId(null);
          }}
        />
      )}
    </div>
  );
}
