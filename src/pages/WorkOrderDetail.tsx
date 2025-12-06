import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { triggerWebhooks } from '../lib/webhooks/trigger';
import { WEBHOOK_EVENTS, EventPayloads } from '../lib/webhooks/events';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Play,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MoreVertical,
  ClipboardList,
  Clock,
} from 'lucide-react';
import TaskList from '../components/work-orders/TaskList';
import { ListSkeleton } from '../components/LoadingSkeleton';
import TimeTracker from '../components/work-orders/TimeTracker';
import TimeEntryList from '../components/work-orders/TimeEntryList';

interface WorkOrder {
  id: string;
  work_order_number: string;
  title: string;
  scheduled_date: string | null;
  status: 'planned' | 'in_progress' | 'completed';
  assigned_employees: any;
  estimated_hours: number | null;
  notes: string | null;
  project_id: string;
  project: {
    id: string;
    title: string;
    address: string;
    customer: {
      contact_name: string;
      company_name: string | null;
    };
  };
  tasks: Array<{
    id: string;
    description: string;
    is_completed: boolean;
  }>;
  employees_data?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveTab: setMainTab } = useStore();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'hours'>('overview');
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; role: string }>>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      loadWorkOrder();
      loadEmployees();
      loadTimeEntries();
    }
  }, [id]);

  const loadWorkOrder = async () => {
    setLoading(true);

    const { data: woData, error } = await supabase
      .from('work_orders')
      .select(
        `
        *,
        project:projects(
          id,
          title,
          address,
          customer:customers(
            contact_name,
            company_name
          )
        ),
        tasks:work_order_tasks(*)
      `
      )
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error loading work order:', error);
    }

    if (woData) {
      const employeeIds = Array.isArray(woData.assigned_employees)
        ? woData.assigned_employees
        : [];

      if (employeeIds.length > 0) {
        const { data: employeesData } = await supabase
          .from('employees')
          .select('id, name, role')
          .in('id', employeeIds);

        woData.employees_data = employeesData || [];
      } else {
        woData.employees_data = [];
      }

      woData.tasks = (woData.tasks || []).sort(
        (a: any, b: any) => a.sort_order - b.sort_order
      );
    }

    setWorkOrder(woData);
    setLoading(false);
  };

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name, role')
      .order('name');

    setEmployees(data || []);
  };

  const loadTimeEntries = async () => {
    const { data } = await supabase
      .from('time_entries')
      .select(`
        *,
        employee:employees(id, name, role)
      `)
      .eq('work_order_id', id)
      .order('date', { ascending: false });

    setTimeEntries(data || []);
  };

  const handleStartWork = async () => {
    if (!workOrder) return;

    await supabase
      .from('work_orders')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .eq('id', workOrder.id);

    loadWorkOrder();
  };

  const handleCompleteWork = async () => {
    if (!workOrder) return;

    await supabase
      .from('work_orders')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', workOrder.id);

    await supabase
      .from('projects')
      .update({ status: 'completed' })
      .eq('id', workOrder.project_id);

    const { data: { user } } = await supabase.auth.getUser();
    if (user && workOrder && workOrder.project && workOrder.project.customer) {
      await triggerWebhooks(
        user.id,
        WEBHOOK_EVENTS.WORK_ORDER_COMPLETED,
        EventPayloads[WEBHOOK_EVENTS.WORK_ORDER_COMPLETED](
          workOrder,
          workOrder.project,
          workOrder.project.customer
        )
      );
    }

    loadWorkOrder();
  };

  const handleTaskToggle = async (taskId: string, isCompleted: boolean) => {
    await supabase
      .from('work_order_tasks')
      .update({
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('id', taskId);

    loadWorkOrder();
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      planned: { label: 'Gepland', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'Bezig', color: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Voltooid', color: 'bg-green-100 text-green-700' },
    };
    return badges[status as keyof typeof badges] || badges.planned;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      schilder: 'Schilder',
      voorman: 'Voorman',
      leerling: 'Leerling',
      zzp: 'ZZP',
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      schilder: 'bg-blue-100 text-blue-700',
      voorman: 'bg-green-100 text-green-700',
      leerling: 'bg-orange-100 text-orange-700',
      zzp: 'bg-gray-100 text-gray-700',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <ListSkeleton count={5} />
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="p-4">
        <p>Werkbon niet gevonden</p>
      </div>
    );
  }

  const statusBadge = getStatusBadge(workOrder.status);
  const completedTasks = workOrder.tasks.filter((t) => t.is_completed).length;
  const totalTasks = workOrder.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const allTasksCompleted = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                setMainTab(3);
                navigate('/');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      navigate(`/projects/${workOrder.project_id}`);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Naar project
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="font-mono text-sm font-semibold text-gray-600 mb-1">
              {workOrder.work_order_number}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{workOrder.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
            {workOrder.status === 'planned' && (
              <button
                onClick={handleStartWork}
                className="flex items-center gap-2 px-4 py-1.5 bg-brand-secondary hover:opacity-90 text-white text-sm font-medium rounded-full transition"
              >
                <Play className="w-4 h-4" />
                Start Werk
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Voortgang</span>
            <span className="font-semibold text-gray-900">
              {completedTasks}/{totalTasks} taken
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-green-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Overzicht
          </button>
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'hours'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Uren
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Informatie</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600 mb-1">Klant</div>
              <div className="font-medium text-gray-900">
                {workOrder.project.customer.company_name || workOrder.project.customer.contact_name}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Project</div>
              <button
                onClick={() => navigate(`/projects/${workOrder.project_id}`)}
                className="font-medium text-brand-primary hover:text-blue-700 flex items-center gap-1"
              >
                {workOrder.project.title}
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
            {workOrder.project.address && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-900">{workOrder.project.address}</span>
              </div>
            )}
            {workOrder.scheduled_date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  {new Date(workOrder.scheduled_date).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            {workOrder.estimated_hours && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Geschatte uren</div>
                <div className="font-medium text-gray-900">{workOrder.estimated_hours}u</div>
              </div>
            )}
          </div>
        </div>

        {workOrder.employees_data && workOrder.employees_data.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Team</h2>
            </div>
            <div className="space-y-2">
              {workOrder.employees_data.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between">
                  <span className="text-gray-900">{employee.name}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(
                      employee.role
                    )}`}
                  >
                    {getRoleLabel(employee.role)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Taken</h2>
          {workOrder.tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Geen taken toegevoegd</p>
          ) : (
            <TaskList tasks={workOrder.tasks} onToggle={handleTaskToggle} />
          )}
        </div>

        {allTasksCompleted && workOrder.status !== 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-brand-secondary" />
              <p className="font-semibold text-green-900">Alle taken voltooid!</p>
            </div>
            <p className="text-sm text-green-700 mb-3">
              Werkbon markeren als voltooid?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCompleteWork}
                className="flex-1 bg-brand-secondary hover:opacity-90 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Ja, voltooien
              </button>
              <button
                onClick={() => {}}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition"
              >
                Nee, niet nu
              </button>
            </div>
          </div>
        )}

        {workOrder.notes && (
          <div className="bg-white rounded-xl shadow-sm">
            <button
              onClick={() => setNotesExpanded(!notesExpanded)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h2 className="font-semibold text-gray-900">Notities</h2>
              {notesExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {notesExpanded && (
              <div className="px-4 pb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{workOrder.notes}</p>
              </div>
            )}
          </div>
        )}
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="p-4 space-y-6">
          <TimeTracker
            workOrderId={id!}
            employees={employees}
            onEntrySaved={() => {
              loadTimeEntries();
              loadWorkOrder();
            }}
          />
          <TimeEntryList
            entries={timeEntries}
            onEntryDeleted={() => {
              loadTimeEntries();
              loadWorkOrder();
            }}
          />
        </div>
      )}
    </div>
  );
}
