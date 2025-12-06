import { Calendar, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Database } from '../../lib/database.types';

type Measurement = Database['public']['Tables']['measurements']['Row'];

interface MeasurementCardProps {
  measurement: Measurement;
  onDelete: (id: string) => void;
}

export default function MeasurementCard({ measurement, onDelete }: MeasurementCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex gap-4">
        {measurement.photo_url ? (
          <img
            src={measurement.photo_url}
            alt="Meting"
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-2xl font-bold text-brand-secondary">
                {measurement.net_area_m2.toFixed(2)} m²
              </div>
              <div className="text-xs text-gray-500">Netto oppervlak</div>
            </div>
            <button
              onClick={() => onDelete(measurement.id)}
              className="text-red-600 hover:text-red-700 p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <div className="text-xs text-gray-500">Totaal</div>
              <div className="text-sm font-semibold text-gray-900">
                {measurement.wall_area_m2.toFixed(1)} m²
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Deuren</div>
              <div className="text-sm font-semibold text-gray-900">
                {measurement.doors_area_m2.toFixed(1)} m²
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Kozijnen</div>
              <div className="text-sm font-semibold text-gray-900">
                {measurement.windows_area_m2.toFixed(1)} m²
              </div>
            </div>
          </div>

          {measurement.notes && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{measurement.notes}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{new Date(measurement.created_at).toLocaleDateString('nl-NL')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
