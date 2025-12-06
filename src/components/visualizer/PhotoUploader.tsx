import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Loader, X } from 'lucide-react';

interface PhotoUploaderProps {
  onPhotoSelect: (file: File, preview: string) => void;
  currentPhoto?: string;
  onClear?: () => void;
}

export default function PhotoUploader({ onPhotoSelect, currentPhoto, onClear }: PhotoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Upload alleen afbeeldingsbestanden');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      onPhotoSelect(file, preview);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  if (currentPhoto) {
    return (
      <div className="relative w-full h-full pointer-events-none">
        <img
          src={currentPhoto}
          alt="Uploaded"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition
        ${isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }
        ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex flex-col items-center gap-4">
        {isUploading ? (
          <>
            <Loader className="w-12 h-12 text-brand-primary animate-spin" />
            <p className="text-lg font-medium text-gray-700">Foto uploaden...</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                {isDragging
                  ? 'Laat de foto hier los...'
                  : 'Sleep een foto hierheen of klik om te uploaden'
                }
              </p>
              <p className="text-sm text-gray-500">
                PNG, JPG, JPEG of WEBP (max 10MB)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
