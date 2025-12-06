import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { X, Plus, Trash2 } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
}

interface CreateWorkOrderModalProps {
  projectId: string;
  projectTitle: string;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWorkOrderModal({
  projectId,
  projectTitle,
  customerName,
  onClose,
  onSuccess,
}: CreateWorkOrderModalProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: projectTitle,
    scheduled_date: '',
    estimated_hours: '',
    assigned_employees: [] as string[],
    notes: '',
  });
  const [tasks, setTasks] = useState<string[]>(['']);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('employees')
      .select('id, name')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('name');

    setEmployees(data || []);
  };

  const generateWorkOrderNumber = async () => {
    const year = new Date().getFullYear();

    // Get the count of all work orders for this user this year
    const { count } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`);

    const nextNumber = (count || 0) + 1;
    return `WO-${year}-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const workOrderNumber = await generateWorkOrderNumber();

      const { data: workOrder, error: woError } = await supabase
        .from('work_orders')
        .insert({
          project_id: projectId,
          user_id: user!.id,
          work_order_number: workOrderNumber,
          title: formData.title,
          scheduled_date: formData.scheduled_date || null,
          estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : null,
          assigned_employees: formData.assigned_employees,
          notes: formData.notes || null,
          status: 'planned',
        })
        .select()
        .single();

      if (woError) throw woError;

      const validTasks = tasks.filter((t) => t.trim() !== '');
      if (validTasks.length > 0) {
        const taskInserts = validTasks.map((task, index) => ({
          work_order_id: workOrder.id,
          description: task,
          sort_order: index,
        }));

        await supabase.from('work_order_tasks').insert(taskInserts);
      }

      onSuccess();
    } catch (error) {
      console.error('Error creating work order:', error);
      alert('Er is een fout opgetreden bij het aanmaken van de werkbon');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData({
      ...formData,
      assigned_employees: formData.assigned_employees.includes(employeeId)
        ? formData.assigned_employees.filter((id) => id !== employeeId)
        : [...formData.assigned_employees, employeeId],
    });
  };

  const addTask = () => {
    setTasks([...tasks, '']);
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nieuwe Werkbon</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <div className="text-sm text-gray-600">Klant</div>
              <div className="font-medium text-gray-900">{customerName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Project</div>
              <div className="font-medium text-gray-900">{projectTitle}</div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geplande datum
              </label>
              <input
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschatte uren
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>
          </div>

          {employees.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toegewezen medewerkers
              </label>
              <div className="flex flex-wrap gap-2">
                {employees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => toggleEmployee(employee.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      formData.assigned_employees.includes(employee.id)
                        ? 'bg-brand-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {employee.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Taken</label>
              <button
                type="button"
                onClick={addTask}
                className="flex items-center gap-1 text-sm text-brand-primary hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Taak toevoegen
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={task}
                    onChange={(e) => updateTask(index, e.target.value)}
                    placeholder="Taak beschrijving"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notities
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Aanvullende informatie of opmerkingen..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-brand-primary hover:opacity-90 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Bezig met aanmaken...' : 'Werkbon aanmaken'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition"
            >
              Annuleren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
