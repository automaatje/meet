import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'schilder' | 'voorman' | 'leerling' | 'zzp';
  hourly_rate: number;
  is_active: boolean;
}

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'schilder' as Employee['role'],
    hourly_rate: 0,
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      loadEmployees();
    }
  }, [user]);

  const loadEmployees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', user!.id)
      .order('name');

    setEmployees(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      await supabase
        .from('employees')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          hourly_rate: formData.hourly_rate,
          is_active: formData.is_active,
        })
        .eq('id', editingEmployee.id);
    } else {
      await supabase.from('employees').insert({
        user_id: user!.id,
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        role: formData.role,
        hourly_rate: formData.hourly_rate,
        is_active: formData.is_active,
      });
    }

    resetForm();
    loadEmployees();
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role,
      hourly_rate: employee.hourly_rate,
      is_active: employee.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Weet je zeker dat je dit teamlid wilt verwijderen?')) {
      await supabase.from('employees').delete().eq('id', id);
      loadEmployees();
    }
  };

  const toggleActive = async (employee: Employee) => {
    await supabase
      .from('employees')
      .update({ is_active: !employee.is_active })
      .eq('id', employee.id);
    loadEmployees();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'schilder',
      hourly_rate: 0,
      is_active: true,
    });
    setEditingEmployee(null);
    setShowForm(false);
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
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Team</h2>
              <p className="text-sm text-gray-600">Beheer je medewerkers</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Nieuw Teamlid
          </button>
        </div>
      </div>

      {showForm && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingEmployee ? 'Teamlid bewerken' : 'Nieuw teamlid toevoegen'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Naam *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefoon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as Employee['role'] })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                >
                  <option value="schilder">Schilder</option>
                  <option value="voorman">Voorman</option>
                  <option value="leerling">Leerling</option>
                  <option value="zzp">ZZP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uurtarief (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Actief
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-brand-primary hover:opacity-90 text-white py-2 px-4 rounded-lg transition"
              >
                {editingEmployee ? 'Bijwerken' : 'Toevoegen'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg transition"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {employees.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Nog geen teamleden toegevoegd</p>
            <p className="text-sm mt-1">Klik op "Nieuw Teamlid" om te beginnen</p>
          </div>
        ) : (
          employees.map((employee) => (
            <div key={employee.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{employee.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getRoleBadgeColor(
                        employee.role
                      )}`}
                    >
                      {getRoleLabel(employee.role)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-600">
                    {employee.phone && <span className="truncate">{employee.phone}</span>}
                    {employee.email && <span className="truncate">{employee.email}</span>}
                    {employee.hourly_rate > 0 && (
                      <span className="text-brand-secondary font-medium">€{employee.hourly_rate.toFixed(2)}/u</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(employee)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      employee.is_active ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                    title={employee.is_active ? 'Actief' : 'Inactief'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        employee.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => handleEdit(employee)}
                    className="p-2 text-brand-primary hover:bg-blue-50 rounded-lg transition"
                    title="Bewerken"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
