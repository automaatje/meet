import { useState } from 'react';
import { X, Trash2, AlertCircle } from 'lucide-react';
import { photoService } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type ProjectPhoto = Database['public']['Tables']['project_photos']['Row'];

interface PhotoGalleryProps {
  photos: ProjectPhoto[];
  onPhotoDeleted: () => void;
}

const photoTypeLabels = {
  before: 'Voor',
  after: 'Na',
  detail: 'Detail',
};

const photoTypeColors = {
  before: 'bg-yellow-100 text-yellow-800',
  after: 'bg-green-100 text-green-800',
  detail: 'bg-blue-100 text-blue-800',
};

export default function PhotoGallery({ photos, onPhotoDeleted }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (photo: ProjectPhoto) => {
    setDeleting(true);
    try {
      await photoService.deletePhoto(photo.id, photo.photo_url);
      setDeleteConfirm(null);
      setSelectedPhoto(null);
      onPhotoDeleted();
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
            onClick={() => setSelectedPhoto(photo)}
          >
            <div className="relative">
              <img
                src={photo.photo_url}
                alt={photo.caption || 'Project foto'}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              <span
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                  photoTypeColors[photo.photo_type as keyof typeof photoTypeColors]
                }`}
              >
                {photoTypeLabels[photo.photo_type as keyof typeof photoTypeLabels]}
              </span>
            </div>
            {photo.caption && (
              <div className="p-3">
                <p className="text-sm text-gray-600 line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50"
          onClick={() => !deleteConfirm && setSelectedPhoto(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  photoTypeColors[selectedPhoto.photo_type as keyof typeof photoTypeColors]
                }`}
              >
                {photoTypeLabels[selectedPhoto.photo_type as keyof typeof photoTypeLabels]}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(selectedPhoto.id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition"
                  disabled={deleting}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedPhoto(null);
                    setDeleteConfirm(null);
                  }}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition"
                  disabled={deleting}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <img
              src={selectedPhoto.photo_url}
              alt={selectedPhoto.caption || 'Project foto'}
              className="w-full max-h-[70vh] object-contain rounded-lg"
            />

            {selectedPhoto.caption && (
              <div className="mt-4 bg-white bg-opacity-10 rounded-lg p-4">
                <p className="text-white text-center">{selectedPhoto.caption}</p>
              </div>
            )}

            {deleteConfirm === selectedPhoto.id && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">
                      Foto verwijderen?
                    </h3>
                    <p className="text-sm text-red-700 mb-4">
                      Deze actie kan niet ongedaan worden gemaakt.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        disabled={deleting}
                        className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={() => handleDelete(selectedPhoto)}
                        disabled={deleting}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        {deleting ? 'Verwijderen...' : 'Verwijderen'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
