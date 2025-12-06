import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { ArrowLeft, FileText, Ruler, Image as ImageIcon, Euro, Sparkles, TrendingUp, Receipt } from 'lucide-react';
import ProjectOverview from './ProjectOverview';
import ProjectMeasurements from './ProjectMeasurements';
import ProjectPhotos from './ProjectPhotos';
import ProjectQuote from './ProjectQuote';
import Visualizer from '../visualizer/Visualizer';
import Profitability from './Profitability';
import InvoiceForm from '../invoices/InvoiceForm';
import type { Database } from '../../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  customer?: {
    id: string;
    company_name: string;
    contact_name: string;
    email: string | null;
    phone: string | null;
  };
};

const tabs = [
  { id: 'overview', label: 'Overzicht', icon: FileText },
  { id: 'measurements', label: 'Metingen', icon: Ruler },
  { id: 'photos', label: "Foto's", icon: ImageIcon },
  { id: 'visualizer', label: 'Visualisatie', icon: Sparkles },
  { id: 'quote', label: 'Offerte', icon: Euro },
  { id: 'profitability', label: 'Winstanalyse', icon: TrendingUp },
];

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveTab: setMainTab } = useStore();
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const data = await projectService.getById(id!);
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: 'draft' | 'sent' | 'accepted' | 'rejected') => {
    try {
      await projectService.updateStatus(id!, status);
      loadProject();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Project niet gevonden</p>
        <button
          onClick={() => {
            setMainTab(2);
            navigate('/');
          }}
          className="mt-4 text-brand-primary hover:text-blue-700"
        >
          Terug naar projecten
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <button
            onClick={() => {
              setMainTab(2);
              navigate('/');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Terug</span>
          </button>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{project.title}</h1>
              {project.customer && (
                <p className="text-sm text-gray-600">{project.customer.company_name}</p>
              )}
            </div>
            {(project.status === 'in_progress' || project.status === 'completed') && (
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="flex items-center gap-2 px-3 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
              >
                <Receipt className="w-4 h-4" />
                Factuur
              </button>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={activeTab === 'visualizer' ? 'p-4' : 'max-w-lg mx-auto p-4'}>
        {activeTab === 'overview' && (
          <ProjectOverview project={project} onStatusChange={handleStatusChange} onWorkOrderCreated={loadProject} />
        )}
        {activeTab === 'measurements' && <ProjectMeasurements projectId={project.id} />}
        {activeTab === 'photos' && <ProjectPhotos projectId={project.id} />}
        {activeTab === 'visualizer' && <Visualizer projectId={project.id} />}
        {activeTab === 'quote' && <ProjectQuote project={project} />}
        {activeTab === 'profitability' && <Profitability projectId={project.id} />}
      </div>

      {showInvoiceForm && (
        <InvoiceForm
          projectId={project.id}
          customerId={project.customer_id}
          onClose={() => setShowInvoiceForm(false)}
          onSuccess={() => {
            setShowInvoiceForm(false);
          }}
        />
      )}
    </div>
  );
}
