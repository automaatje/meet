import React, { useState } from 'react';
import { AlertCircle, Mail, Phone, CheckCircle, Clock, FileText, Users } from 'lucide-react';

interface Lead {
  id: string;
  title: string;
  source: string;
  assignedTo: string;
  createdHours: number;
  status: 'new' | 'contacted' | 'qualified';
}

interface FollowUp {
  id: string;
  customer: string;
  type: 'call' | 'email' | 'meeting';
  dueDate: Date;
  notes: string;
}

export function InsideSalesDashboard() {
  const [inboundLeads] = useState<Lead[]>([
    { id: '1', title: 'Spouwmuurisolatie 150m²', source: 'Website', assignedTo: 'Jan Bakker', createdHours: 2, status: 'new' },
    { id: '2', title: 'Kozijnen vervangen woning', source: 'Field Rep', assignedTo: 'Piet Jansen', createdHours: 28, status: 'new' },
    { id: '3', title: 'Dakisolatie bedrijfspand', source: 'Referral', assignedTo: 'Lisa de Vries', createdHours: 5, status: 'contacted' },
  ]);

  const [overdueFollowUps] = useState<FollowUp[]>([
    { id: '1', customer: 'IsoComfort BV', type: 'call', dueDate: new Date('2025-12-01'), notes: 'Offerte bespreken' },
    { id: '2', customer: 'Warmte Wonen', type: 'email', dueDate: new Date('2025-11-30'), notes: 'Prijsvraag beantwoorden' },
  ]);

  const [todayFollowUps] = useState<FollowUp[]>([
    { id: '3', customer: 'KozijnExpert', type: 'meeting', dueDate: new Date(), notes: 'Demo inplannen' },
    { id: '4', customer: 'GlasService', type: 'call', dueDate: new Date(), notes: 'Status check' },
  ]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inside Sales Dashboard</h1>
        <p className="text-gray-600 mt-1">Beheer je leads en follow-ups</p>
      </div>

      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-bold text-gray-900">Inbound Lead Queue</h2>
          <span className="ml-auto px-3 py-1 bg-red-600 text-white rounded-full text-sm font-semibold">
            {inboundLeads.filter(l => l.createdHours > 24).length} Urgent
          </span>
        </div>

        <div className="bg-white rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Lead</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bron</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Field Rep</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tijd</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inboundLeads.map((lead) => (
                <tr key={lead.id} className={lead.createdHours > 24 ? 'bg-red-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{lead.title}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{lead.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{lead.assignedTo}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${lead.createdHours > 24 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                      {lead.createdHours}u geleden
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="px-3 py-1 bg-brand-primary text-white rounded-lg hover:opacity-90 text-sm font-medium mr-2">
                      Claim
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                      Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Follow-up Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-red-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Overdue</h3>
              <span className="ml-auto px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold">
                {overdueFollowUps.length}
              </span>
            </div>
            <div className="space-y-2">
              {overdueFollowUps.map((followUp) => (
                <div key={followUp.id} className="bg-red-50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{followUp.customer}</div>
                      <div className="text-xs text-gray-600 mt-1">{followUp.notes}</div>
                    </div>
                    <button className="text-brand-secondary hover:text-green-700">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-orange-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Vandaag</h3>
              <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">
                {todayFollowUps.length}
              </span>
            </div>
            <div className="space-y-2">
              {todayFollowUps.map((followUp) => (
                <div key={followUp.id} className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{followUp.customer}</div>
                      <div className="text-xs text-gray-600 mt-1">{followUp.notes}</div>
                    </div>
                    <button className="text-brand-secondary hover:text-green-700">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border-2 border-green-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-brand-secondary" />
              <h3 className="font-semibold text-gray-900">Deze Week</h3>
              <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                5
              </span>
            </div>
            <div className="text-sm text-gray-600 text-center py-4">
              Geen urgente items
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quote Pipeline</h2>
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Klant</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Waarde</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Verzonden</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Dagen</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">IsoComfort BV</td>
                <td className="px-4 py-3 text-gray-900">€15.000</td>
                <td className="px-4 py-3 text-sm text-gray-600">28 nov</td>
                <td className="px-4 py-3 text-sm text-gray-600">4 dagen</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                    Vragen
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-brand-primary hover:text-blue-700 text-sm font-medium">
                    Beantwoorden
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Warmte Wonen</td>
                <td className="px-4 py-3 text-gray-900">€22.500</td>
                <td className="px-4 py-3 text-sm text-gray-600">25 nov</td>
                <td className="px-4 py-3 text-sm text-gray-600">7 dagen</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                    Wachten
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-brand-primary hover:text-blue-700 text-sm font-medium">
                    Follow-up
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-5 h-5 text-brand-primary" />
            <h2 className="text-lg font-bold text-gray-900">Communication Hub</h2>
          </div>
          <div className="space-y-3">
            <button className="w-full bg-brand-primary text-white py-2 rounded-lg hover:opacity-90 font-medium">
              Quick Email
            </button>
            <button className="w-full bg-brand-secondary text-white py-2 rounded-lg hover:opacity-90 font-medium">
              Log Call
            </button>
          </div>
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Communicatie</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>📧 Email naar IsoComfort - 1u geleden</div>
              <div>📞 Call met Warmte Wonen - 3u geleden</div>
              <div>📧 Email naar KozijnExpert - 5u geleden</div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-gray-900">Team Workload</h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Jij</span>
                <span className="font-semibold text-gray-900">12 leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-primary h-2 rounded-full" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Sophie</span>
                <span className="font-semibold text-gray-900">8 leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-brand-secondary h-2 rounded-full" style={{ width: '53%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">Mark</span>
                <span className="font-semibold text-gray-900">15 leads</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}
