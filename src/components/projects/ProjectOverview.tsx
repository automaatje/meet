import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Building2, MapPin, Calendar, FileText, User, Clipboard } from 'lucide-react';
import CreateWorkOrderModal from '../work-orders/CreateWorkOrderModal';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  customer?: {
    id: string;
    company_name: string | null;
    contact_name: string;
    email: string | null;
    phone: string | null;
  };
};

interface ProjectOverviewProps {
  project: Project;
  onStatusChange: (status: 'draft' | 'sent' | 'accepted' | 'rejected') => void;
  onWorkOrderCreated?: () => void;
}

const statusOptions = [
  { value: 'draft', label: 'Concept', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Verstuurd', color: 'bg-blue-100 text-blue-800' },
  { value: 'accepted', label: 'Geaccepteerd', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Afgewezen', color: 'bg-red-100 text-red-800' },
] as const;

export default function ProjectOverview({ project, onStatusChange, onWorkOrderCreated }: ProjectOverviewProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [hasWorkOrder, setHasWorkOrder] = useState(false);
  const [checkingWorkOrder, setCheckingWorkOrder] = useState(true);

  const currentStatus = statusOptions.find(s => s.value === project.status);

  useEffect(() => {
    checkExistingWorkOrder();
  }, [project.id]);

  const checkExistingWorkOrder = async () => {
    setCheckingWorkOrder(true);
    const { data } = await supabase
      .from('work_orders')
      .select('id')
      .eq('project_id', project.id)
      .limit(1);

    setHasWorkOrder((data && data.length > 0) || false);
    setCheckingWorkOrder(false);
  };

  const handleStatusChange = (status: 'draft' | 'sent' | 'accepted' | 'rejected') => {
    onStatusChange(status);
    setShowStatusMenu(false);
  };

  const handleWorkOrderSuccess = () => {
    setShowWorkOrderModal(false);
    alert('Werkbon succesvol aangemaakt!');
    setHasWorkOrder(true);
    if (onWorkOrderCreated) {
      onWorkOrderCreated();
    }
  };

  const canCreateWorkOrder = project.status === 'accepted' && !hasWorkOrder && !checkingWorkOrder;

  const customerName = project.customer?.company_name || project.customer?.contact_name || 'Onbekende klant';

  return (
    <>
      {showWorkOrderModal && (
        <CreateWorkOrderModal
          projectId={project.id}
          projectTitle={project.title}
          customerName={customerName}
          onClose={() => setShowWorkOrderModal(false)}
          onSuccess={handleWorkOrderSuccess}
        />
      )}

      <div className="space-y-4">
        {canCreateWorkOrder && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Clipboard className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Werkbon aanmaken</h4>
                  <p className="text-sm text-gray-600">Project is geaccepteerd en klaar voor uitvoering</p>
                </div>
              </div>
              <button
                onClick={() => setShowWorkOrderModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition whitespace-nowrap"
              >
                Maak Werkbon
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Project status</h3>
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`px-4 py-2 rounded-lg font-medium ${currentStatus?.color}`}
              >
                {currentStatus?.label}
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        project.status === option.value ? 'bg-gray-50' : ''
                      }`}
                    >
                      <span className={`px-2 py-1 rounded text-sm font-medium ${option.color}`}>
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <FileText className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Offertenummer</div>
              <div className="font-medium">{project.quote_number || 'Nog niet toegewezen'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <div className="text-sm text-gray-500">Aangemaakt op</div>
              <div className="font-medium">
                {new Date(project.created_at).toLocaleDateString('nl-NL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-brand-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Klantgegevens</h3>
        </div>
        {project.customer ? (
          <div className="space-y-2">
            <div>
              <div className="text-sm text-gray-500">{project.customer.company_name ? 'Bedrijf' : 'Contactpersoon'}</div>
              <div className="font-medium text-gray-900">{project.customer.company_name || project.customer.contact_name}</div>
            </div>
            {project.customer.company_name && (
              <div>
                <div className="text-sm text-gray-500">Contactpersoon</div>
                <div className="font-medium text-gray-900">{project.customer.contact_name}</div>
              </div>
            )}
            {project.customer.email && (
              <div>
                <div className="text-sm text-gray-500">E-mail</div>
                <a href={`mailto:${project.customer.email}`} className="font-medium text-brand-primary hover:text-blue-700">
                  {project.customer.email}
                </a>
              </div>
            )}
            {project.customer.phone && (
              <div>
                <div className="text-sm text-gray-500">Telefoon</div>
                <a href={`tel:${project.customer.phone}`} className="font-medium text-brand-primary hover:text-blue-700">
                  {project.customer.phone}
                </a>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Geen klantgegevens beschikbaar</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="w-6 h-6 text-brand-secondary" />
          <h3 className="text-lg font-semibold text-gray-900">Projectdetails</h3>
        </div>
        <div className="space-y-3">
          {project.address && (
            <div>
              <div className="text-sm text-gray-500">Adres</div>
              <div className="font-medium text-gray-900">{project.address}</div>
            </div>
          )}
          {project.description && (
            <div>
              <div className="text-sm text-gray-500">Beschrijving</div>
              <div className="text-gray-900 whitespace-pre-wrap">{project.description}</div>
            </div>
          )}
          {!project.address && !project.description && (
            <p className="text-gray-500">Geen extra projectdetails</p>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
