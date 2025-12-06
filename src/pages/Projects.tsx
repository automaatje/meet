import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Filter, Briefcase, MapPin, Euro, Calendar, Plus, Ruler } from 'lucide-react';
import ProjectForm from '../components/projects/ProjectForm';
import { ListSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'] & {
  customer?: {
    company_name: string;
    contact_name: string;
  };
};

type StatusFilter = 'all' | 'draft' | 'sent' | 'accepted' | 'rejected';

const statusConfig = {
  draft: { label: 'Concept', color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Offerte', color: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Gewonnen', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Afgerond', color: 'bg-gray-400 text-gray-800' },
};

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll();
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Kon projecten niet laden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      setSubmitting(true);
      const newProject = await projectService.create(data);
      toast.success('Project succesvol aangemaakt');
      setShowNewProjectForm(false);
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Kon project niet aanmaken. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) => statusFilter === 'all' || project.status === statusFilter
  );

  const statusCounts = {
    all: projects.length,
    draft: projects.filter(p => p.status === 'draft').length,
    sent: projects.filter(p => p.status === 'sent').length,
    accepted: projects.filter(p => p.status === 'accepted').length,
    rejected: projects.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projecten</h1>
          <p className="text-gray-600 mt-1">{projects.length} projecten in totaal</p>
        </div>
        <button
          onClick={() => setShowNewProjectForm(true)}
          className="bg-brand-primary active:opacity-80 text-white p-3 rounded-full shadow-lg transition min-h-[48px] min-w-[48px] flex items-center justify-center active:scale-95"
          aria-label="Nieuw project"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filter op status</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3">
          {(['all', 'draft', 'sent', 'accepted', 'rejected'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition min-h-[44px] active:scale-95 ${
                statusFilter === status
                  ? 'bg-brand-primary text-white active:opacity-80'
                  : 'bg-gray-100 text-gray-700 active:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Alle' : statusConfig[status].label} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : (
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <EmptyState
              icon="projects"
              title="Geen projecten gevonden"
              description={
                statusFilter === 'all'
                  ? 'Maak je eerste project aan om te beginnen met offertes maken'
                  : `Geen projecten met status "${statusConfig[statusFilter as keyof typeof statusConfig]?.label}"`
              }
              action={
                statusFilter === 'all'
                  ? {
                      label: 'Maak eerste project',
                      onClick: () => setShowNewProjectForm(true),
                    }
                  : undefined
              }
            />
          ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                  {project.customer && (
                    <p className="text-sm text-gray-600 mb-2">
                      {project.customer.company_name}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
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

              <div className="space-y-2">
                {project.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{project.address}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.created_at).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {project.total_m2 > 0 && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Ruler className="w-4 h-4" />
                        <span>{project.total_m2.toFixed(0)} m²</span>
                      </div>
                    )}
                    {project.total_price > 0 && (
                      <div className="flex items-center gap-1 font-semibold text-brand-secondary">
                        <Euro className="w-4 h-4" />
                        <span>{project.total_price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
          )}
        </div>
      )}

      {showNewProjectForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowNewProjectForm(false)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}
