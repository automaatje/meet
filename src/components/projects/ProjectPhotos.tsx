import { useEffect, useState } from 'react';
import { projectService } from '../../lib/supabase';
import { Image as ImageIcon, Plus } from 'lucide-react';
import PhotoUpload from './PhotoUpload';
import PhotoGallery from './PhotoGallery';
import type { Database } from '../../lib/database.types';

type ProjectPhoto = Database['public']['Tables']['project_photos']['Row'];

interface ProjectPhotosProps {
  projectId: string;
}

export default function ProjectPhotos({ projectId }: ProjectPhotosProps) {
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, [projectId]);

  const loadPhotos = async () => {
    try {
      const data = await projectService.getPhotos(projectId);
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    loadPhotos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {photos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nog geen foto's
          </h3>
          <p className="text-gray-600 mb-6">
            Voeg foto's toe om je project te documenteren
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Foto toevoegen
          </button>
        </div>
      ) : (
        <>
          <PhotoGallery photos={photos} onPhotoDeleted={loadPhotos} />
          <button
            onClick={() => setShowUpload(true)}
            className="w-full bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition min-h-[48px] flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Meer foto's uploaden
          </button>
        </>
      )}

      {showUpload && (
        <PhotoUpload
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
          onCancel={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
