import { useEffect, useState } from 'react';
import { supabase, customerService, projectService } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useOrganization } from '../contexts/OrganizationContext';
import { useToast } from '../hooks/useToast';
import { useStore } from '../store/useStore';
import { TrendingUp, TrendingDown, Users, Briefcase, FileText, Target, UserPlus, FolderPlus, Clock } from 'lucide-react';
import CustomerForm from '../components/customers/CustomerForm';
import ProjectForm from '../components/projects/ProjectForm';
import { FieldSalesDashboard } from './dashboards/FieldSalesDashboard';
import { InsideSalesDashboard } from './dashboards/InsideSalesDashboard';
import { ManagerDashboard } from './dashboards/ManagerDashboard';
import type { Database } from '../lib/database.types';

type Project = Database['public']['Tables']['projects']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface Stats {
  leads: number;
  quotes: number;
  thisMonthRevenue: number;
  conversionRate: number;
}

interface RecentActivity {
  id: string;
  title: string;
  customer: string;
  status: string;
  updated_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { currentMember, effectiveRole } = useOrganization();
  const { setActiveTab } = useStore();
  const toast = useToast();

  if (currentMember) {
    switch (effectiveRole) {
      case 'account_manager_field':
        return <FieldSalesDashboard />;
      case 'commercial_inside':
        return <InsideSalesDashboard />;
      case 'sales_manager':
      case 'head_of_sales':
        return <ManagerDashboard />;
    }
  }

  const [stats, setStats] = useState<Stats>({
    leads: 0,
    quotes: 0,
    thisMonthRevenue: 0,
    conversionRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    const [projectsResult, customersResult] = await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false }),
      supabase
        .from('customers')
        .select('id, company_name, contact_name'),
    ]);

    const projects = projectsResult.data || [];
    const customers = customersResult.data || [];

    const leads = projects.filter(p => p.status === 'lead').length;
    const quotes = projects.filter(p => p.status === 'quote_sent').length;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthProjects = projects.filter(p => {
      if (p.status !== 'accepted' && p.status !== 'completed') return false;
      const updatedAt = new Date(p.updated_at || p.created_at);
      return updatedAt >= firstDayOfMonth;
    });
    const thisMonthRevenue = thisMonthProjects.reduce((sum, p) => sum + (p.total_price || 0), 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentProjects = projects.filter(p => {
      const createdAt = new Date(p.created_at);
      return createdAt >= thirtyDaysAgo;
    });
    const recentLeads = recentProjects.filter(p => p.status === 'lead').length;
    const recentWon = recentProjects.filter(p => p.status === 'accepted' || p.status === 'completed').length;
    const conversionRate = recentLeads > 0 ? (recentWon / recentLeads) * 100 : 0;

    setStats({
      leads,
      quotes,
      thisMonthRevenue,
      conversionRate,
    });

    const customerMap = new Map(customers.map(c => [c.id, c.company_name || c.contact_name]));
    const activities = projects.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      customer: customerMap.get(p.customer_id) || 'Onbekend',
      status: p.status,
      updated_at: p.updated_at || p.created_at,
    }));
    setRecentActivity(activities);

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'quote_sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'lead':
        return 'Lead';
      case 'quote_sent':
        return 'Offerte verstuurd';
      case 'accepted':
        return 'Geaccepteerd';
      case 'in_progress':
        return 'In uitvoering';
      case 'completed':
        return 'Afgerond';
      case 'cancelled':
        return 'Geannuleerd';
      default:
        return status;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minuten geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dagen geleden`;
    return past.toLocaleDateString('nl-NL');
  };

  const handleAddCustomer = async (data: any) => {
    try {
      setSubmitting(true);
      await customerService.create(data);
      toast.success('Klant succesvol toegevoegd');
      setShowCustomerForm(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Kon klant niet toevoegen. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProject = async (data: any) => {
    try {
      setSubmitting(true);
      await projectService.create(data);
      toast.success('Project succesvol aangemaakt');
      setShowProjectForm(false);
      setActiveTab(2); // Switch to Projects tab
      loadDashboardData();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Kon project niet aanmaken. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welkom terug, bekijk je overzicht</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Target className="w-5 h-5 text-brand-primary" />
            </div>
            <TrendingUp className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.leads}</div>
          <div className="text-sm text-gray-600 mt-1">Leads</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.quotes}</div>
          <div className="text-sm text-gray-600 mt-1">Offertes</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-brand-secondary" />
            </div>
            <TrendingUp className="w-4 h-4 text-brand-secondary" />
          </div>
          <div className="text-2xl font-bold text-gray-900">€{stats.thisMonthRevenue.toFixed(0)}</div>
          <div className="text-sm text-gray-600 mt-1">Deze maand</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            {stats.conversionRate >= 30 ? (
              <TrendingUp className="w-4 h-4 text-brand-secondary" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats.conversionRate.toFixed(0)}<span className="text-sm">%</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">Conversie</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowCustomerForm(true)}
            className="bg-brand-primary active:opacity-80 text-white font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 min-h-[44px] active:scale-95 shadow-sm"
          >
            <UserPlus className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap text-sm">Nieuwe Klant</span>
          </button>
          <button
            onClick={() => setShowProjectForm(true)}
            className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 min-h-[44px] active:scale-95 shadow-sm"
            style={{
              backgroundColor: 'var(--color-secondary, #10B981)'
            }}
          >
            <FolderPlus className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap text-sm">Nieuw Project</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recente Activiteit</h2>
          <button
            onClick={() => setActiveTab(2)}
            className="text-sm text-brand-primary hover:text-blue-700 font-medium active:text-blue-800 transition"
          >
            Alles bekijken
          </button>
        </div>
        <div className="space-y-3">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Nog geen projecten</p>
              <button
                onClick={() => setShowProjectForm(true)}
                className="mt-3 text-brand-primary hover:text-blue-700 active:text-blue-800 font-medium text-sm transition"
              >
                Maak je eerste project aan
              </button>
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                onClick={() => setActiveTab(2)}
                className="flex items-center justify-between p-3 hover:bg-gray-50 active:bg-gray-100 rounded-lg cursor-pointer transition"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.title}</div>
                  <div className="text-sm text-gray-500">{activity.customer}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                    {getStatusLabel(activity.status)}
                  </span>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(activity.updated_at)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCustomerForm && (
        <CustomerForm
          onSubmit={handleAddCustomer}
          onCancel={() => setShowCustomerForm(false)}
          isSubmitting={submitting}
        />
      )}

      {showProjectForm && (
        <ProjectForm
          onSubmit={handleCreateProject}
          onCancel={() => setShowProjectForm(false)}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}
