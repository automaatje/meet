import { Calendar, Users, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkOrderCardProps {
  workOrder: {
    id: string;
    work_order_number: string;
    title: string;
    scheduled_date: string | null;
    status: 'planned' | 'in_progress' | 'completed';
    assigned_employees: any;
    project: {
      customer: {
        contact_name: string;
        company_name: string | null;
      } | null;
    } | null;
    tasks: Array<{ is_completed: boolean }>;
  };
}

export default function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const badges = {
      planned: { label: 'Gepland', color: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'Bezig', color: 'bg-yellow-100 text-yellow-700' },
      completed: { label: 'Voltooid', color: 'bg-green-100 text-green-700' },
    };
    return badges[status as keyof typeof badges] || badges.planned;
  };

  const statusBadge = getStatusBadge(workOrder.status);
  const completedTasks = workOrder.tasks.filter((t) => t.is_completed).length;
  const totalTasks = workOrder.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const employeeIds = Array.isArray(workOrder.assigned_employees)
    ? workOrder.assigned_employees
    : [];

  return (
    <div
      onClick={() => navigate(`/work-orders/${workOrder.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-sm font-semibold text-gray-900 mb-1">
            {workOrder.work_order_number}
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-1">{workOrder.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {workOrder.project?.customer?.company_name || workOrder.project?.customer?.contact_name || 'Onbekende klant'}
          </p>
        </div>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
          {statusBadge.label}
        </span>
      </div>

      {workOrder.scheduled_date && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <Calendar className="w-4 h-4" />
          <span>{new Date(workOrder.scheduled_date).toLocaleDateString('nl-NL')}</span>
        </div>
      )}

      {employeeIds.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gray-400" />
          <div className="flex -space-x-2">
            {employeeIds.slice(0, 3).map((empId: string, idx: number) => (
              <div
                key={empId}
                className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                style={{ zIndex: 3 - idx }}
              >
                {idx + 1}
              </div>
            ))}
            {employeeIds.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                +{employeeIds.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {completedTasks} van {totalTasks} taken
            </span>
          </div>
          <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-green-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
