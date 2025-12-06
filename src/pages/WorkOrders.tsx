import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clipboard, Filter } from 'lucide-react';
import WorkOrderCard from '../components/work-orders/WorkOrderCard';
import { ListSkeleton } from '../components/LoadingSkeleton';

type WorkOrderStatus = 'planned' | 'in_progress' | 'completed' | 'all';

interface WorkOrder {
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
}

export default function WorkOrders() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus>('all');

  useEffect(() => {
    if (user) {
      loadWorkOrders();
    }
  }, [user]);

  const loadWorkOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('work_orders')
      .select(
        `
        *,
        project:projects(
          customer:customers(
            contact_name,
            company_name
          )
        ),
        tasks:work_order_tasks(is_completed)
      `
      )
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error loading work orders:', error);
    }

    setWorkOrders(data || []);
    setLoading(false);
  };

  const filteredWorkOrders = workOrders.filter((wo) =>
    statusFilter === 'all' ? true : wo.status === statusFilter
  );

  const filterButtons = [
    { id: 'all' as WorkOrderStatus, label: 'Alle', count: workOrders.length },
    {
      id: 'planned' as WorkOrderStatus,
      label: 'Gepland',
      count: workOrders.filter((wo) => wo.status === 'planned').length,
    },
    {
      id: 'in_progress' as WorkOrderStatus,
      label: 'Bezig',
      count: workOrders.filter((wo) => wo.status === 'in_progress').length,
    },
    {
      id: 'completed' as WorkOrderStatus,
      label: 'Voltooid',
      count: workOrders.filter((wo) => wo.status === 'completed').length,
    },
  ];

  if (loading) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <ListSkeleton count={5} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Clipboard className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Werkbonnen</h1>
            <p className="text-gray-600 text-sm">Beheer je uitvoeringswerk</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {filterButtons.map((button) => (
          <button
            key={button.id}
            onClick={() => setStatusFilter(button.id)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition whitespace-nowrap
              ${
                statusFilter === button.id
                  ? 'bg-brand-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
              }
            `}
          >
            {button.label} ({button.count})
          </button>
        ))}
      </div>

      {filteredWorkOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Clipboard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen werkbonnen</h3>
          <p className="text-sm text-gray-600">
            {statusFilter === 'all'
              ? 'Maak je eerste werkbon aan vanuit een project'
              : `Geen werkbonnen met status "${filterButtons.find((b) => b.id === statusFilter)?.label}"`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredWorkOrders.map((workOrder) => (
            <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
          ))}
        </div>
      )}
    </div>
  );
}
