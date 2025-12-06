import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../../lib/supabase';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Edit, Building2, Mail, Phone, MapPin, Briefcase, Plus, Calendar, Euro } from 'lucide-react';
import CustomerForm from './CustomerForm';
import ProjectForm from '../projects/ProjectForm';
import { projectService } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'] & {
  project_count?: number;
};

type Project = Database['public']['Tables']['projects']['Row'];

const statusConfig = {
  draft: { label: 'Concept', color: 'bg-yellow-100 text-yellow-800' },
  sent: { label: 'Verstuurd', color: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Geaccepteerd', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Afgewezen', color: 'bg-red-100 text-red-800' },
};

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setActiveTab } = useStore();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);

  useEffect(() => {
    if (id) {
      loadCustomerData();
    }
  }, [id]);

  const loadCustomerData = async () => {
    try {
      const customerData = await customerService.getWithProjectCount(id!);

      if (!customerData) {
        setCustomer(null);
        setProjects([]);
        setLoading(false);
        return;
      }

      const projectsData = await customerService.getProjects(id!);
      setCustomer(customerData);
      setProjects(projectsData || []);
    } catch (error) {
      console.error('Error loading customer:', error);
      setCustomer(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (data: any) => {
    try {
      await customerService.update(id!, data);
      setShowEditForm(false);
      loadCustomerData();
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      setSubmittingProject(true);
      const projectData = {
        ...data,
        customer_id: data.customer_id || id!,
      };
      const newProject = await projectService.create(projectData);
      setShowNewProjectForm(false);
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setSubmittingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">Klant niet gevonden</p>
        <button
          onClick={() => {
            setActiveTab(1);
            navigate('/');
          }}
          className="mt-4 text-brand-primary hover:text-blue-700"
        >
          Terug naar klanten
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setActiveTab(1);
              navigate('/');
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Terug</span>
          </button>
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center gap-2 text-brand-primary hover:text-blue-700 font-medium"
          >
            <Edit className="w-5 h-5" />
            <span>Bewerken</span>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Building2 className="w-8 h-8 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {customer.company_name || customer.contact_name}
              </h1>
              {customer.company_name && (
                <p className="text-lg text-gray-600">{customer.contact_name}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 mt-6">
            {customer.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="w-5 h-5 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="hover:text-brand-primary">
                  {customer.email}
                </a>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="w-5 h-5 text-gray-400" />
                <a href={`tel:${customer.phone}`} className="hover:text-brand-primary">
                  {customer.phone}
                </a>
              </div>
            )}
            {(customer.address || customer.city) && (
              <div className="flex items-start gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  {customer.address && <div>{customer.address}</div>}
                  {(customer.postal_code || customer.city) && (
                    <div>
                      {customer.postal_code} {customer.city}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {customer.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Notities</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">
                Projecten ({customer.project_count || 0})
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Nog geen projecten</p>
                <button
                  onClick={() => setShowNewProjectForm(true)}
                  className="bg-brand-primary hover:opacity-90 text-white font-medium py-2 px-6 rounded-lg transition min-h-[48px] inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nieuw project
                </button>
              </div>
            ) : (
              <>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{project.title}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusConfig[project.status as keyof typeof statusConfig].color
                        }`}
                      >
                        {statusConfig[project.status as keyof typeof statusConfig].label}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.created_at).toLocaleDateString('nl-NL')}</span>
                      </div>
                      {project.total_price > 0 && (
                        <div className="flex items-center gap-1 font-semibold text-brand-secondary">
                          <Euro className="w-4 h-4" />
                          <span>{project.total_price.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setShowNewProjectForm(true)}
                  className="w-full bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition min-h-[48px] flex items-center justify-center gap-2 mt-4"
                >
                  <Plus className="w-5 h-5" />
                  Nieuw project
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <CustomerForm
          customer={customer}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditForm(false)}
        />
      )}

      {showNewProjectForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowNewProjectForm(false)}
          isSubmitting={submittingProject}
          preselectedCustomerId={id}
        />
      )}
    </div>
  );
}
