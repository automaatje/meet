import { useEffect, useState } from 'react';
import { measurementService } from '../../lib/supabase';
import { Ruler, Plus, AlertCircle } from 'lucide-react';
import MeasurementCard from '../measurements/MeasurementCard';
import NewMeasurement from '../measurements/NewMeasurement';
import type { Database } from '../../lib/database.types';

type Measurement = Database['public']['Tables']['measurements']['Row'];

interface ProjectMeasurementsProps {
  projectId: string;
}

export default function ProjectMeasurements({ projectId }: ProjectMeasurementsProps) {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMeasurement, setShowNewMeasurement] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadMeasurements();
  }, [projectId]);

  const loadMeasurements = async () => {
    try {
      const data = await measurementService.getByProject(projectId);
      setMeasurements(data || []);
    } catch (error) {
      console.error('Error loading measurements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMeasurementComplete = () => {
    setShowNewMeasurement(false);
    loadMeasurements();
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await measurementService.delete(deleteConfirm);
      setDeleteConfirm(null);
      loadMeasurements();
    } catch (error) {
      console.error('Error deleting measurement:', error);
      alert('Fout bij verwijderen. Probeer opnieuw.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  const totalM2 = measurements.reduce((sum, m) => sum + m.net_area_m2, 0);

  return (
    <div className="space-y-4">
      {totalM2 > 0 && (
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="text-sm opacity-90 mb-1">Totaal te schilderen oppervlak</div>
          <div className="text-4xl font-bold">{totalM2.toFixed(2)} m²</div>
          <div className="text-sm opacity-75 mt-2">
            {measurements.length} {measurements.length === 1 ? 'meting' : 'metingen'}
          </div>
        </div>
      )}

      {measurements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Ruler className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nog geen metingen
          </h3>
          <p className="text-gray-600 mb-6">
            Upload foto's en gebruik AI om automatisch oppervlaktes te berekenen
          </p>
          <button
            onClick={() => setShowNewMeasurement(true)}
            className="bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nieuwe meting
          </button>
        </div>
      ) : (
        <>
          {measurements.map((measurement) => (
            <MeasurementCard
              key={measurement.id}
              measurement={measurement}
              onDelete={handleDelete}
            />
          ))}
          <button
            onClick={() => setShowNewMeasurement(true)}
            className="w-full bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition min-h-[48px] flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nieuwe meting toevoegen
          </button>
        </>
      )}

      {showNewMeasurement && (
        <NewMeasurement
          projectId={projectId}
          onComplete={handleNewMeasurementComplete}
          onCancel={() => setShowNewMeasurement(false)}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Meting verwijderen?
                </h3>
                <p className="text-sm text-gray-600">
                  Deze actie kan niet ongedaan worden gemaakt. Het totale oppervlak van het project wordt automatisch bijgewerkt.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition min-h-[48px]"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition min-h-[48px]"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
