import React, { useState, useEffect } from 'react';
import { Plus, Phone, Calendar, FileText, MapPin, TrendingUp, Target, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  appointmentsToday: number;
  leadsFollowUp: number;
  activeDealsValue: number;
  dealsClosedThisMonth: number;
  newLeadsCreated: number;
  meetingsDone: number;
  conversionRate: number;
}

export function FieldSalesDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    appointmentsToday: 0,
    leadsFollowUp: 0,
    activeDealsValue: 0,
    dealsClosedThisMonth: 0,
    newLeadsCreated: 0,
    meetingsDone: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // In een echte app zouden we leads/opportunities ophalen
      // Voor nu simuleren we de data
      setStats({
        appointmentsToday: 3,
        leadsFollowUp: 2,
        activeDealsValue: 45000,
        dealsClosedThisMonth: 5,
        newLeadsCreated: 12,
        meetingsDone: 18,
        conversionRate: 42,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24">
      <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <h1 className="text-2xl font-bold mb-6">Vandaag's Focus</h1>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white/20 backdrop-blur rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6" />
              <span className="text-lg font-semibold">{stats.appointmentsToday} Afspraken Vandaag</span>
            </div>
            <div className="space-y-2 ml-9">
              <div className="text-sm">• 10:00 - IsoComfort BV</div>
              <div className="text-sm">• 14:30 - Warmte Wonen</div>
              <div className="text-sm">• 16:00 - KozijnExpert</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/20 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">{stats.leadsFollowUp}</span>
              </div>
              <div className="text-sm">Leads Follow-up</div>
            </div>

            <div className="bg-white/20 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">€{(stats.activeDealsValue / 1000).toFixed(0)}k</span>
              </div>
              <div className="text-sm">In Onderhandeling</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/customers')}
            className="bg-white border-2 border-orange-200 rounded-xl p-6 hover:border-orange-400 transition-all active:scale-95"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-orange-100 rounded-2xl">
                <Plus className="w-8 h-8 text-orange-600" />
              </div>
              <span className="font-semibold text-gray-900">Nieuwe Lead</span>
            </div>
          </button>

          <button
            onClick={() => {}}
            className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 transition-all active:scale-95"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-blue-100 rounded-2xl">
                <Phone className="w-8 h-8 text-brand-primary" />
              </div>
              <span className="font-semibold text-gray-900">Log Gesprek</span>
            </div>
          </button>

          <button
            onClick={() => {}}
            className="bg-white border-2 border-green-200 rounded-xl p-6 hover:border-green-400 transition-all active:scale-95"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-green-100 rounded-2xl">
                <Calendar className="w-8 h-8 text-brand-secondary" />
              </div>
              <span className="font-semibold text-gray-900">Plan Afspraak</span>
            </div>
          </button>

          <button
            onClick={() => navigate('/projects')}
            className="bg-white border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all active:scale-95"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-purple-100 rounded-2xl">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <span className="font-semibold text-gray-900">Snelle Offerte</span>
            </div>
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Mijn Pipeline</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Nieuw</div>
            <div className="text-lg font-bold text-gray-900">8</div>
            <div className="text-xs text-gray-500">€52k</div>
          </div>
          <div className="bg-blue-100 rounded-lg p-3">
            <div className="text-xs text-brand-primary mb-1">Gekwalificeerd</div>
            <div className="text-lg font-bold text-blue-900">5</div>
            <div className="text-xs text-brand-primary">€38k</div>
          </div>
          <div className="bg-yellow-100 rounded-lg p-3">
            <div className="text-xs text-yellow-600 mb-1">Offerte</div>
            <div className="text-lg font-bold text-yellow-900">3</div>
            <div className="text-xs text-yellow-600">€45k</div>
          </div>
          <div className="bg-green-100 rounded-lg p-3">
            <div className="text-xs text-brand-secondary mb-1">Gewonnen</div>
            <div className="text-lg font-bold text-green-900">{stats.dealsClosedThisMonth}</div>
            <div className="text-xs text-brand-secondary">€67k</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Route Planning</h2>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Geschatte reistijd</span>
            <span className="font-semibold text-gray-900">1u 45m</span>
          </div>
          <button className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 font-semibold">
            Open Optimale Route in Maps
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Deze Maand</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.dealsClosedThisMonth}</div>
            <div className="text-sm text-gray-600">Deals Gesloten</div>
            <div className="text-xs text-brand-secondary mt-1">€67.000 waarde</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.newLeadsCreated}</div>
            <div className="text-sm text-gray-600">Nieuwe Leads</div>
            <div className="text-xs text-brand-primary mt-1">+20% vs vorige maand</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.meetingsDone}</div>
            <div className="text-sm text-gray-600">Meetings Gedaan</div>
            <div className="text-xs text-gray-500 mt-1">Gemiddeld 4 per week</div>
          </div>
          <div className="bg-white border rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
            <div className="text-xs text-brand-secondary mt-1">Boven gemiddelde</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recente Activiteit</h2>
        <div className="bg-white border rounded-xl divide-y">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Deal gewonnen: IsoComfort BV</div>
                <div className="text-sm text-gray-500">€15.000 • 2 uur geleden</div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Offerte verstuurd: Warmte Wonen</div>
                <div className="text-sm text-gray-500">€22.500 • 5 uur geleden</div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Meeting: KozijnExpert</div>
                <div className="text-sm text-gray-500">Productdemo • 1 dag geleden</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
