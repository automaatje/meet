import { useState } from 'react';
import { Maximize2, Package, Save, Loader, RotateCcw, Download } from 'lucide-react';
import PhotoUploader from '../../components/visualizer/PhotoUploader';
import CanvasEditor from '../../components/visualizer/CanvasEditor';
import ProductSelector from './ProductSelector';
import BeforeAfterSlider from './BeforeAfterSlider';
import type { DetectedObject } from '../../lib/visualizer/types';
import type { Product } from '../../pages/settings/Products';
import { supabase } from '../../lib/supabase';
import { generateVisualization, dataURLtoBlob, uploadVisualization } from '../../lib/visualizer/image-processor';
import { useToast } from '../../hooks/useToast';

interface VisualizerProps {
  projectId: string;
}

export default function Visualizer({ projectId }: VisualizerProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [objects, setObjects] = useState<DetectedObject[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null);
  const [objectProducts, setObjectProducts] = useState<Map<string, Product>>(new Map());
  const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const { showToast } = useToast();

  const handlePhotoSelect = (file: File, preview: string) => {
    setPhotoFile(file);
    setPhotoPreview(preview);
    setObjects([]);
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setObjects([]);
    setIsDrawingMode(false);
    setObjectProducts(new Map());
    setVisualizedImage(null);
    setMode('edit');
  };

  const handleChooseProduct = (index: number) => {
    setSelectedObjectIndex(index);
    setShowProductSelector(true);
  };

  const handleProductSelect = async (product: Product) => {
    if (selectedObjectIndex === null) return;

    setShowProductSelector(false);
    setIsGenerating(true);

    try {
      const newMap = new Map(objectProducts);
      const objectId = objects[selectedObjectIndex].id;
      newMap.set(objectId, product);
      setObjectProducts(newMap);

      await generateAndShowVisualization(newMap);
    } catch (error) {
      console.error('Error generating visualization:', error);
      showToast('Kon visualisatie niet genereren', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAndShowVisualization = async (products: Map<string, Product>) => {
    if (!photoPreview) return;

    const overlays = objects
      .filter(obj => products.has(obj.id))
      .map(obj => ({
        objectId: obj.id,
        productImageUrl: products.get(obj.id)!.photo_url!,
        bounds: {
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height
        }
      }));

    if (overlays.length === 0) return;

    const visualized = await generateVisualization(photoPreview, overlays);
    setVisualizedImage(visualized);
    setMode('preview');
  };

  const handleBackToEdit = () => {
    setMode('edit');
    setVisualizedImage(null);
  };

  const handleSave = async () => {
    if (!photoFile || !visualizedImage) {
      showToast('Genereer eerst een visualisatie', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = photoFile.name.split('.').pop();
      const originalFileName = `${user.id}/${Date.now()}-original.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('visualization-photos')
        .upload(originalFileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl: originalUrl } } = supabase.storage
        .from('visualization-photos')
        .getPublicUrl(originalFileName);

      const visualizedBlob = dataURLtoBlob(visualizedImage);
      const visualizedUrl = await uploadVisualization(visualizedBlob, projectId, user.id);

      const firstProduct = Array.from(objectProducts.values())[0];

      const { error: insertError } = await supabase
        .from('visualizations')
        .insert({
          project_id: projectId,
          original_photo_url: originalUrl,
          visualization_photo_url: visualizedUrl,
          detected_objects: objects,
          selected_product_id: firstProduct?.id
        });

      if (insertError) throw insertError;

      showToast('Visualisatie opgeslagen!', 'success');
      handleClearPhoto();
    } catch (error) {
      console.error('Error saving visualization:', error);
      showToast('Kon visualisatie niet opslaan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (!visualizedImage) return;

    const link = document.createElement('a');
    link.href = visualizedImage;
    link.download = `visualisatie-${Date.now()}.jpg`;
    link.click();
    showToast('Visualisatie gedownload', 'success');
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-gray-50 rounded-xl">
        <Loader className="w-12 h-12 animate-spin text-brand-primary mb-4" />
        <p className="text-lg font-medium text-gray-900">Visualisatie genereren...</p>
        <p className="text-sm text-gray-600 mt-1">Even geduld</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      <div className="flex-1 bg-gray-900 rounded-xl overflow-hidden relative">
        {!photoPreview ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <PhotoUploader onPhotoSelect={handlePhotoSelect} />
            </div>
          </div>
        ) : mode === 'edit' ? (
          <div className="relative w-full h-full">
            <div
              className="absolute inset-0"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(2px)'
              }}
            />
            <PhotoUploader
              onPhotoSelect={handlePhotoSelect}
              currentPhoto={photoPreview}
              onClear={handleClearPhoto}
            />
            <div className="absolute inset-0 pointer-events-none">
              <CanvasEditor
                photoUrl={photoPreview}
                objects={objects}
                onObjectsChange={setObjects}
                isDrawingMode={isDrawingMode}
              />
            </div>
            {photoPreview && (
              <button
                onClick={handleClearPhoto}
                className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-700 rounded-lg px-4 py-2 shadow-lg font-medium transition flex items-center gap-2 z-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Nieuwe foto
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full">
            <BeforeAfterSlider
              beforeImage={photoPreview}
              afterImage={visualizedImage!}
            />
          </div>
        )}
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
        {mode === 'edit' ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <button
                  onClick={() => setIsDrawingMode(!isDrawingMode)}
                  disabled={!photoPreview}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition flex items-center gap-2
                    ${isDrawingMode
                      ? 'bg-brand-primary text-white hover:opacity-90'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <Maximize2 className="w-4 h-4" />
                  {isDrawingMode ? 'Stop Markeren' : 'Markeer Object'}
                </button>

                {objects.length > 0 && (
                  <div className="flex gap-2">
                    {objects.map((obj, index) => {
                      const hasProduct = objectProducts.has(obj.id);
                      return (
                        <button
                          key={obj.id}
                          onClick={() => handleChooseProduct(index)}
                          className={`
                            px-4 py-2 rounded-lg font-medium transition flex items-center gap-2
                            ${hasProduct
                              ? 'bg-green-100 text-green-700 border-2 border-green-500 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                          `}
                        >
                          <Package className="w-4 h-4" />
                          Product {index + 1}
                          {hasProduct && ' ✓'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {objects.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">
                  {objects.length} {objects.length === 1 ? 'object' : 'objecten'} gemarkeerd
                  {objectProducts.size > 0 && ` • ${objectProducts.size} ${objectProducts.size === 1 ? 'product' : 'producten'} geselecteerd`}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={() => handleChooseProduct(0)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium transition flex items-center gap-2 hover:bg-blue-200"
              >
                <Package className="w-4 h-4" />
                Ander Product
              </button>

              <button
                onClick={handleBackToEdit}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium transition flex items-center gap-2 hover:bg-gray-200"
              >
                <RotateCcw className="w-4 h-4" />
                Opnieuw Markeren
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium transition flex items-center gap-2 hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                Downloaden
              </button>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-brand-secondary text-white rounded-lg font-medium transition flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Opslaan Visualisatie
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showProductSelector && selectedObjectIndex !== null && (
        <ProductSelector
          objectType={objects[selectedObjectIndex].type}
          objectIndex={selectedObjectIndex}
          onSelect={handleProductSelect}
          onCancel={() => setShowProductSelector(false)}
        />
      )}
    </div>
  );
}
