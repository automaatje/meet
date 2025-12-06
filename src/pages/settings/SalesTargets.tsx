import React, { useState, useEffect } from 'react';
import { Target, Plus, DollarSign, Activity, Award, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  user_profile: {
    contact_name: string;
    email: string;
  };
}

interface RevenueTarget {
  id: string;
  user_id: string;
  target_revenue: number;
  target_deals: number;
  period_type: string;
  period_start: string;
  period_end: string;
}

interface CommissionRule {
  id: string;
  name: string;
  commission_type: string;
  percentage?: number;
  fixed_amount?: number;
  applies_to_roles: string[];
}

interface NewTarget {
  user_id: string;
  target_revenue: number;
  target_deals: number;
  period_type: string;
  period_start: string;
  period_end: string;
}

interface NewCommissionRule {
  name: string;
  commission_type: string;
  percentage?: number;
  fixed_amount?: number;
  applies_to_roles: string[];
}

export function SalesTargets() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'revenue' | 'activity' | 'commission'>('revenue');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [revenueTargets, setRevenueTargets] = useState<RevenueTarget[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);

  useEffect(() => {
    if (organization) {
      loadData();
    }
  }, [organization]);

  const loadData = async () => {
    const [membersData, targetsData, rulesData] = await Promise.all([
      supabase
        .from('team_members')
        .select('*, user_profile:user_profiles!team_members_user_id_fkey(contact_name, email)')
        .eq('organization_id', organization!.id)
        .eq('is_active', true)
        .in('role', ['account_manager_field', 'commercial_inside', 'sales_manager']),
      supabase
        .from('revenue_targets')
        .select('*')
        .eq('organization_id', organization!.id)
        .eq('is_active', true),
      supabase.from('commission_rules').select('*').eq('organization_id', organization!.id),
    ]);

    if (membersData.data) setTeamMembers(membersData.data);
    if (targetsData.data) setRevenueTargets(targetsData.data);
    if (rulesData.data) setCommissionRules(rulesData.data);
  };

  const handleCreateTarget = async (target: NewTarget) => {
    const { error } = await supabase.from('revenue_targets').insert({
      ...target,
      organization_id: organization!.id,
      is_active: true,
    });

    if (!error) {
      setShowTargetModal(false);
      loadData();
    }
  };

  const handleCreateCommissionRule = async (rule: NewCommissionRule) => {
    const { error } = await supabase.from('commission_rules').insert({
      ...rule,
      organization_id: organization!.id,
      is_active: true,
    });

    if (!error) {
      setShowCommissionModal(false);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Sales Doelen & Commissies</h2>
        <p className="text-gray-600 mt-1">Beheer targets en provisiestructuur voor je team</p>
      </div>

      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'revenue'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Revenue Targets
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Activity Targets
          </button>
          <button
            onClick={() => setActiveTab('commission')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'commission'
                ? 'border-brand-primary text-brand-primary font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Commissies
          </button>
        </div>
      </div>

      {activeTab === 'revenue' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Targets</h3>
            <button
              onClick={() => setShowTargetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Nieuw Doel
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {teamMembers.map((member) => {
              const target = revenueTargets.find((t) => t.user_id === member.user_id);

              return (
                <div key={member.id} className="bg-white border rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {member.user_profile.contact_name}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {member.role.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <button className="text-brand-primary hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                  </div>

                  {target ? (
                    <>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Target</span>
                          <span className="font-semibold text-gray-900">
                            €{(target.target_revenue / 1000).toFixed(0)}k /{' '}
                            {target.period_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Deals Target</span>
                          <span className="font-semibold text-gray-900">
                            {target.target_deals} deals
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-brand-secondary h-2 rounded-full"
                          style={{ width: '45%' }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-1">45% behaald YTD</div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">Geen actief target</p>
                      <button className="text-brand-primary hover:text-blue-700 text-sm font-medium mt-2">
                        Target instellen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity Targets</h3>
            <button
              onClick={() => setShowActivityModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Nieuw Activity Target
            </button>
          </div>

          <div className="bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Activity targets configuratie</p>
            <p className="text-sm text-gray-500 mb-4">
              Stel targets in voor dagelijkse activiteiten zoals calls, meetings, quotes en demos
            </p>
            <button
              onClick={() => setShowActivityModal(true)}
              className="text-brand-primary hover:text-blue-700 font-medium"
            >
              Configureer activity targets
            </button>
          </div>
        </div>
      )}

      {activeTab === 'commission' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Commission Rules</h3>
            <button
              onClick={() => setShowCommissionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Regel
            </button>
          </div>

          <div className="space-y-4">
            {commissionRules.map((rule) => (
              <div key={rule.id} className="bg-white border rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-600" />
                    <div>
                      <div className="font-semibold text-gray-900">{rule.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {rule.commission_type === 'percentage' && `${rule.percentage}% van deal value`}
                        {rule.commission_type === 'fixed' && `€${rule.fixed_amount} per deal`}
                        {rule.commission_type === 'tiered' && 'Tiered commission structure'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Van toepassing op: {rule.applies_to_roles.join(', ')}
                      </div>
                    </div>
                  </div>
                  <button className="text-brand-primary hover:text-blue-700 text-sm font-medium">
                    Edit
                  </button>
                </div>
              </div>
            ))}

            {commissionRules.length === 0 && (
              <div className="bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center">
                <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Nog geen commissie regels ingesteld</p>
                <button
                  onClick={() => setShowCommissionModal(true)}
                  className="mt-4 text-brand-primary hover:text-blue-700 font-medium"
                >
                  Maak je eerste commissie regel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showTargetModal && <TargetModal onClose={() => setShowTargetModal(false)} onSave={handleCreateTarget} teamMembers={teamMembers} />}
      {showCommissionModal && <CommissionModal onClose={() => setShowCommissionModal(false)} onSave={handleCreateCommissionRule} />}
      {showActivityModal && <ActivityTargetModal onClose={() => setShowActivityModal(false)} />}
    </div>
  );
}

function TargetModal({ onClose, onSave, teamMembers }: { onClose: () => void; onSave: (target: NewTarget) => void; teamMembers: TeamMember[] }) {
  const [formData, setFormData] = useState<NewTarget>({
    user_id: '',
    target_revenue: 0,
    target_deals: 0,
    period_type: 'quarterly',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nieuw Revenue Target</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
              required
            >
              <option value="">Selecteer team member</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.user_id}>
                  {member.user_profile.contact_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Revenue (€)</label>
            <input
              type="number"
              value={formData.target_revenue}
              onChange={(e) => setFormData({ ...formData, target_revenue: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Deals</label>
            <input
              type="number"
              value={formData.target_deals}
              onChange={(e) => setFormData({ ...formData, target_deals: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode Type</label>
            <select
              value={formData.period_type}
              onChange={(e) => setFormData({ ...formData, period_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
            >
              <option value="monthly">Maandelijks</option>
              <option value="quarterly">Kwartaal</option>
              <option value="yearly">Jaarlijks</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Datum</label>
              <input
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Eind Datum</label>
              <input
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommissionModal({ onClose, onSave }: { onClose: () => void; onSave: (rule: NewCommissionRule) => void }) {
  const [formData, setFormData] = useState<NewCommissionRule>({
    name: '',
    commission_type: 'percentage',
    percentage: 5,
    applies_to_roles: [],
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const roles = [
    { value: 'account_manager_field', label: 'Account Manager (Field)' },
    { value: 'commercial_inside', label: 'Commercial Inside' },
    { value: 'sales_manager', label: 'Sales Manager' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nieuwe Commissie Regel</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regel Naam</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
              placeholder="Bijv. Standaard Sales Commissie"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commissie Type</label>
            <select
              value={formData.commission_type}
              onChange={(e) => setFormData({ ...formData, commission_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Vast Bedrag</option>
              <option value="tiered">Gelaagd</option>
            </select>
          </div>

          {formData.commission_type === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.percentage || 0}
                onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
          )}

          {formData.commission_type === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vast Bedrag (€)</label>
              <input
                type="number"
                value={formData.fixed_amount || 0}
                onChange={(e) => setFormData({ ...formData, fixed_amount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Van toepassing op rollen</label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label key={role.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.applies_to_roles.includes(role.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          applies_to_roles: [...formData.applies_to_roles, role.value],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          applies_to_roles: formData.applies_to_roles.filter((r) => r !== role.value),
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                  />
                  <span className="text-sm text-gray-700">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivityTargetModal({ onClose }: { onClose: () => void }) {
  const activityTypes = [
    { id: 'calls', label: 'Telefoongesprekken', icon: '📞', unit: 'calls' },
    { id: 'meetings', label: 'Afspraken', icon: '🤝', unit: 'meetings' },
    { id: 'quotes', label: 'Offertes', icon: '📄', unit: 'quotes' },
    { id: 'demos', label: "Demo's", icon: '🎯', unit: 'demos' },
  ];

  const [targets, setTargets] = useState<Record<string, { daily: number; weekly: number }>>({
    calls: { daily: 20, weekly: 100 },
    meetings: { daily: 5, weekly: 25 },
    quotes: { daily: 3, weekly: 15 },
    demos: { daily: 2, weekly: 10 },
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSave = () => {
    alert('Activity targets opgeslagen! (Demo functie - database integratie volgt later)');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity Targets Configureren</h3>
            <p className="text-sm text-gray-600 mt-1">
              Stel dagelijkse en wekelijkse targets in voor je team
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {activityTypes.map((activity) => (
            <div key={activity.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{activity.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{activity.label}</h4>
                  <p className="text-xs text-gray-600">
                    Minimale activiteit verwachting per sales medewerker
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dagelijks Target
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={targets[activity.id]?.daily || 0}
                      onChange={(e) =>
                        setTargets({
                          ...targets,
                          [activity.id]: {
                            ...targets[activity.id],
                            daily: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                      min="0"
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      per dag
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wekelijks Target
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={targets[activity.id]?.weekly || 0}
                      onChange={(e) =>
                        setTargets({
                          ...targets,
                          [activity.id]: {
                            ...targets[activity.id],
                            weekly: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary"
                      min="0"
                    />
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      per week
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Deze targets zijn van toepassing op alle Account Managers en
              Inside Sales medewerkers. Individuele targets kunnen later per persoon aangepast
              worden.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
            >
              Targets Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
