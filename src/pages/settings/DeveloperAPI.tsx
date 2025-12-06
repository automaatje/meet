import React, { useState, useEffect } from 'react';
import { Code, TrendingUp, Activity, AlertCircle, BookOpen } from 'lucide-react';
import { APIKeyManager } from '../../components/api/APIKeyManager';
import { APIDocumentation } from '../../components/api/APIDocumentation';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';

interface APIStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: { endpoint: string; count: number }[];
}

export function DeveloperAPI() {
  const { organization } = useOrganization();
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');
  const [stats, setStats] = useState<APIStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (organization) {
      loadStats();
    }
  }, [organization]);

  const loadStats = async () => {
    try {
      const { data: keys } = await supabase
        .from('api_keys')
        .select('id')
        .eq('organization_id', organization!.id);

      if (!keys || keys.length === 0) {
        setStats({
          totalRequests: 0,
          requestsToday: 0,
          requestsThisWeek: 0,
          requestsThisMonth: 0,
          averageResponseTime: 0,
          errorRate: 0,
          topEndpoints: [],
        });
        setLoadingStats(false);
        return;
      }

      const keyIds = keys.map((k) => k.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);

      const { data: allRequests } = await supabase
        .from('api_requests')
        .select('*')
        .in('api_key_id', keyIds);

      const { data: todayRequests } = await supabase
        .from('api_requests')
        .select('*')
        .in('api_key_id', keyIds)
        .gte('created_at', today.toISOString());

      const { data: weekRequests } = await supabase
        .from('api_requests')
        .select('*')
        .in('api_key_id', keyIds)
        .gte('created_at', weekAgo.toISOString());

      const { data: monthRequests } = await supabase
        .from('api_requests')
        .select('*')
        .in('api_key_id', keyIds)
        .gte('created_at', monthAgo.toISOString());

      const avgResponseTime =
        allRequests && allRequests.length > 0
          ? allRequests.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) /
            allRequests.length
          : 0;

      const errorCount =
        allRequests?.filter((r) => r.status_code && r.status_code >= 400).length || 0;
      const errorRate =
        allRequests && allRequests.length > 0 ? (errorCount / allRequests.length) * 100 : 0;

      const endpointCounts: { [key: string]: number } = {};
      allRequests?.forEach((r) => {
        endpointCounts[r.endpoint] = (endpointCounts[r.endpoint] || 0) + 1;
      });

      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        totalRequests: allRequests?.length || 0,
        requestsToday: todayRequests?.length || 0,
        requestsThisWeek: weekRequests?.length || 0,
        requestsThisMonth: monthRequests?.length || 0,
        averageResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 10) / 10,
        topEndpoints,
      });
    } catch (error) {
      console.error('Error loading API stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-brand-primary to-indigo-600 text-white rounded-xl p-8">
        <div className="flex items-start gap-4">
          <Code className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Developer API</h1>
            <p className="text-blue-100 text-lg mb-4">
              Integreer met BouwMeet via onze RESTful API. Perfect voor leveranciers, groothandels en
              systeem integraties.
            </p>
            <button
              onClick={() => setActiveTab('docs')}
              className="px-4 py-2 bg-white text-brand-primary rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Bekijk API Documentatie
            </button>
          </div>
        </div>
      </div>

      {!loadingStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-3 mx-auto">
              <Activity className="w-5 h-5 text-brand-primary" />
            </div>
            <p className="text-2xl font-bold text-gray-900 text-center mb-1">{stats.requestsToday}</p>
            <p className="text-xs text-gray-500 text-center">requests</p>
            <p className="text-xs font-medium text-gray-700 text-center mt-1">Vandaag</p>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-3 mx-auto">
              <TrendingUp className="w-5 h-5 text-brand-secondary" />
            </div>
            <p className="text-2xl font-bold text-gray-900 text-center mb-1">{stats.requestsThisWeek}</p>
            <p className="text-xs text-gray-500 text-center">requests</p>
            <p className="text-xs font-medium text-gray-700 text-center mt-1">Deze Week</p>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-3 mx-auto">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 text-center mb-1">{stats.averageResponseTime}</p>
            <p className="text-xs text-gray-500 text-center">milliseconden</p>
            <p className="text-xs font-medium text-gray-700 text-center mt-1">Gem. Response</p>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg mb-3 mx-auto">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 text-center mb-1">{stats.errorRate}%</p>
            <p className="text-xs text-gray-500 text-center">van alle requests</p>
            <p className="text-xs font-medium text-gray-700 text-center mt-1">Error Rate</p>
          </div>
        </div>
      )}

      {!loadingStats && stats && stats.topEndpoints.length > 0 && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Meest Gebruikte Endpoints</h3>
          <div className="space-y-3">
            {stats.topEndpoints.map((endpoint, index) => {
              const maxCount = stats.topEndpoints[0].count;
              const percentage = (endpoint.count / maxCount) * 100;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm font-mono text-gray-700">{endpoint.endpoint}</code>
                    <span className="text-sm font-semibold text-gray-900">
                      {endpoint.count} requests
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand-primary h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'keys'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'docs'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Documentatie
          </button>
        </div>
      </div>

      {activeTab === 'keys' && <APIKeyManager />}
      {activeTab === 'docs' && <APIDocumentation />}
    </div>
  );
}
