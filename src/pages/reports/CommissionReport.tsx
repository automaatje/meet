import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { approveCommission, rejectCommission, getUserCommissionSummary } from '../../lib/commissions/calculator';

interface Commission {
  id: string;
  amount: number;
  deal_value: number;
  status: 'pending' | 'approved' | 'paid';
  period_start: string;
  period_end: string;
  created_at: string;
  paid_at?: string;
  notes?: string;
  user_id: string;
  project_id?: string;
  user_profile?: {
    contact_name: string;
  };
}

export function CommissionReport() {
  const { user } = useAuth();
  const { organization, currentMember } = useOrganization();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [summary, setSummary] = useState({ totalEarnedThisMonth: 0, pending: 0, approved: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedCommission, setSelectedCommission] = useState<string | null>(null);

  const isManager = currentMember && ['sales_manager', 'head_of_sales', 'admin', 'owner'].includes(currentMember.role);

  useEffect(() => {
    if (user && organization) {
      loadData();
    }
  }, [user, organization]);

  const loadData = async () => {
    setLoading(true);

    // Load commissions
    let query = supabase
      .from('commissions')
      .select('*, user_profile:user_profiles!commissions_user_id_fkey(contact_name)')
      .eq('organization_id', organization!.id)
      .order('created_at', { ascending: false });

    // If not a manager, only show own commissions
    if (!isManager) {
      query = query.eq('user_id', user!.id);
    }

    const { data: commissionsData } = await query;
    if (commissionsData) setCommissions(commissionsData);

    // Load summary
    const summaryData = await getUserCommissionSummary(user!.id, organization!.id);
    if (summaryData) setSummary(summaryData);

    setLoading(false);
  };

  const handleApprove = async (commissionId: string) => {
    const result = await approveCommission(commissionId);
    if (result) {
      loadData();
    }
  };

  const handleReject = async () => {
    if (!selectedCommission || !rejectReason.trim()) return;

    const result = await rejectCommission(selectedCommission, rejectReason);
    if (result) {
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedCommission(null);
      loadData();
    }
  };

  const filteredCommissions = commissions.filter(
    (c) => filter === 'all' || c.status === filter
  );

  const totalPending = commissions
    .filter((c) => c.status === 'pending')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalApproved = commissions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Betaald
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Goedgekeurd
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            In Afwachting
          </span>
        );
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isManager ? 'Team Commissies' : 'Mijn Commissies'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isManager ? 'Beheer en goedkeuren van team provisies' : 'Overzicht van je verdiende provisies'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-yellow-600" />
            <span className="text-sm text-gray-600">In Afwachting</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">€{totalPending.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {commissions.filter((c) => c.status === 'pending').length} commissies
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-brand-primary" />
            <span className="text-sm text-gray-600">Goedgekeurd</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">€{totalApproved.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Wachtend op betaling</div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-brand-secondary" />
            <span className="text-sm text-gray-600">Betaald</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">€{totalPaid.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Deze periode</div>
        </div>
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Alle
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Afwachting
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'approved'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Goedgekeurd
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'paid'
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Betaald
            </button>
          </div>
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {isManager && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Medewerker
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Deal Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Commissie
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Periode
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
              {isManager && (
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                  Acties
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCommissions.map((commission) => (
              <tr key={commission.id} className="hover:bg-gray-50">
                {isManager && (
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {commission.user_profile?.contact_name || 'Unknown'}
                  </td>
                )}
                <td className="px-6 py-4 text-gray-900">
                  €{commission.deal_value.toLocaleString()}
                </td>
                <td className="px-6 py-4 font-semibold text-brand-secondary">
                  €{commission.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(commission.period_start).toLocaleDateString('nl-NL', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-6 py-4">{getStatusBadge(commission.status)}</td>
                {isManager && (
                  <td className="px-6 py-4 text-right">
                    {commission.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(commission.id)}
                          className="px-3 py-1 bg-brand-secondary text-white rounded-lg hover:opacity-90 text-sm font-medium"
                        >
                          Goedkeuren
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCommission(commission.id);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                        >
                          Afwijzen
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCommissions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Geen commissies gevonden</p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Commissie Afwijzen</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reden voor afwijzing
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Geef een reden op..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none h-24"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedCommission(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Afwijzen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
