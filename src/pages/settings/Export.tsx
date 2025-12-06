import React, { useState } from 'react';
import { Download, Users, Briefcase, Receipt, Archive, AlertTriangle, Loader2, FileText, CheckCircle2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { ExportWizard } from '../../components/export/ExportWizard';
import { supabase } from '../../lib/supabase';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateCSV } from '../../lib/export/csv-generator';
import {
  customerFieldsAvailable,
  projectFieldsAvailable,
  invoiceFieldsAvailable,
  customerMappingPresets,
  projectMappingPresets,
  invoiceMappingPresets
} from '../../lib/export/field-mappings';

type ExportEntity = 'customers' | 'projects' | 'invoices' | null;

interface InstructionSection {
  id: string;
  title: string;
  steps: string[];
  link?: string;
}

const exactOnlineInstructions: InstructionSection = {
  id: 'exact',
  title: 'Exact Online',
  steps: [
    'Log in op Exact Online',
    'Ga naar Relaties en klik op "Importeren" rechtsboven',
    'Kies "CSV upload"',
    'Upload het geëxporteerde bestand',
    'Map de kolommen (gebruik onze vooraf ingestelde "Exact Online" mapping)',
    'Klik op "Importeren" en controleer de preview',
    'Bevestig de import'
  ],
  link: 'https://support.exact.com/nl/docs/docview.aspx?documentid=HowtoImportRelations'
};

const twinfieldInstructions: InstructionSection = {
  id: 'twinfield',
  title: 'Twinfield',
  steps: [
    'Log in op Twinfield',
    'Ga naar Debiteuren > Debiteuren',
    'Klik op "Importeren"',
    'Selecteer het CSV bestand',
    'Volg de import wizard en map de velden',
    'Controleer de preview en bevestig'
  ],
  link: 'https://accounting.twinfield.com/help/nl/import.htm'
};

export function Export() {
  const [showWizard, setShowWizard] = useState<ExportEntity>(null);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [backupProgress, setBackupProgress] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [expandedInstructions, setExpandedInstructions] = useState<string | null>(null);

  const handleCompleteBackup = async () => {
    setShowBackupConfirm(false);
    setBackupProgress('Bezig met voorbereiden...');
    setBackupError(null);

    try {
      const zip = new JSZip();

      setBackupProgress('Klanten exporteren...');
      const { data: customers } = await supabase.from('customers').select('*');
      if (customers) {
        const customerMapping = customerMappingPresets[0].mapping;
        const customersCSV = generateCSV(customers, customerMapping);
        zip.file('customers.csv', customersCSV);
      }

      setBackupProgress('Projecten exporteren...');
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          *,
          customer:customers(contact_name, company_name, email, phone)
        `);
      if (projects) {
        const projectMapping = projectMappingPresets[0].mapping;
        const projectsCSV = generateCSV(projects, projectMapping);
        zip.file('projects.csv', projectsCSV);
      }

      setBackupProgress('Facturen exporteren...');
      const { data: invoices } = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(contact_name, company_name),
          project:projects(project_number, title)
        `);
      if (invoices) {
        const invoiceMapping = invoiceMappingPresets[0].mapping;
        const invoicesCSV = generateCSV(invoices, invoiceMapping);
        zip.file('invoices.csv', invoicesCSV);
      }

      setBackupProgress('Medewerkers exporteren...');
      const { data: employees } = await supabase.from('employees').select('*');
      if (employees) {
        const employeesCSV = generateCSV(employees, {
          'name': 'Naam',
          'email': 'E-mail',
          'phone': 'Telefoon',
          'role': 'Rol',
          'hourly_rate': 'Uurtarief',
          'active': 'Actief'
        });
        zip.file('employees.csv', employeesCSV);
      }

      setBackupProgress('Werkbonnen exporteren...');
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select(`
          *,
          project:projects(project_number, title),
          assigned_to:employees(name)
        `);
      if (workOrders) {
        const workOrdersCSV = generateCSV(workOrders, {
          'work_order_number': 'Werkbonnummer',
          'project.project_number': 'Projectnummer',
          'project.title': 'Project',
          'title': 'Titel',
          'status': 'Status',
          'priority': 'Prioriteit',
          'assigned_to.name': 'Toegewezen aan',
          'scheduled_date': 'Geplande datum',
          'completed_date': 'Afgerond op'
        });
        zip.file('work_orders.csv', workOrdersCSV);
      }

      setBackupProgress('Urenregistraties exporteren...');
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select(`
          *,
          employee:employees(name),
          work_order:work_orders(work_order_number)
        `);
      if (timeEntries) {
        const timeEntriesCSV = generateCSV(timeEntries, {
          'work_order.work_order_number': 'Werkbonnummer',
          'employee.name': 'Medewerker',
          'date': 'Datum',
          'hours': 'Uren',
          'description': 'Omschrijving',
          'billable': 'Facturabel'
        });
        zip.file('time_entries.csv', timeEntriesCSV);
      }

      setBackupProgress('Instellingen exporteren...');
      const settings = {
        exported_at: new Date().toISOString(),
        version: '1.0',
        entity_counts: {
          customers: customers?.length || 0,
          projects: projects?.length || 0,
          invoices: invoices?.length || 0,
          employees: employees?.length || 0,
          work_orders: workOrders?.length || 0,
          time_entries: timeEntries?.length || 0
        }
      };
      zip.file('backup_info.json', JSON.stringify(settings, null, 2));

      setBackupProgress('ZIP bestand maken...');
      const blob = await zip.generateAsync({ type: 'blob' });

      const timestamp = new Date().toISOString().split('T')[0];
      saveAs(blob, `bouwmeet-backup-${timestamp}.zip`);

      setBackupProgress('Backup voltooid!');
      setTimeout(() => {
        setBackupProgress(null);
      }, 3000);
    } catch (err) {
      console.error('Backup error:', err);
      setBackupError('Fout bij maken van backup. Probeer het opnieuw.');
      setBackupProgress(null);
    }
  };

  const exportCards = [
    {
      id: 'customers',
      icon: Users,
      title: 'Klanten Export',
      description: 'Exporteer al je klantgegevens naar CSV voor gebruik in CRM of boekhoudsystemen',
      color: 'blue'
    },
    {
      id: 'projects',
      icon: Briefcase,
      title: 'Projecten Export',
      description: 'Exporteer projectgegevens inclusief status, bedragen en klantinfo',
      color: 'green'
    },
    {
      id: 'invoices',
      icon: Receipt,
      title: 'Facturen Export',
      description: 'Exporteer factuurgegevens voor import in je boekhoudpakket',
      color: 'purple'
    },
    {
      id: 'backup',
      icon: Archive,
      title: 'Complete Backup',
      description: 'Maak een volledige backup van al je data in een ZIP bestand',
      color: 'orange'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-brand-primary hover:bg-blue-200',
    green: 'bg-green-100 text-brand-secondary hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
    orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Export & Backup</h2>
        <p className="text-gray-600 mt-1">Exporteer je data naar externe systemen of maak een backup</p>
      </div>

      {backupError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{backupError}</p>
          </div>
          <button onClick={() => setBackupError(null)} className="text-red-600 hover:text-red-700">
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      )}

      {backupProgress && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
          {backupProgress === 'Backup voltooid!' ? (
            <CheckCircle2 className="w-5 h-5 text-brand-secondary flex-shrink-0" />
          ) : (
            <Loader2 className="w-5 h-5 text-brand-primary flex-shrink-0 animate-spin" />
          )}
          <p className="text-sm text-blue-800">{backupProgress}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[card.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{card.description}</p>
              <button
                onClick={() => {
                  if (card.id === 'backup') {
                    setShowBackupConfirm(true);
                  } else {
                    setShowWizard(card.id as ExportEntity);
                  }
                }}
                className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                {card.id === 'backup' ? 'Backup Maken' : 'Exporteren'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-primary" />
          Hoe te gebruiken in externe systemen
        </h3>

        <div className="space-y-3">
          <button
            onClick={() => setExpandedInstructions(expandedInstructions === 'exact' ? null : 'exact')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="font-medium text-gray-900">Exact Online Import</span>
            {expandedInstructions === 'exact' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedInstructions === 'exact' && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                {exactOnlineInstructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              {exactOnlineInstructions.link && (
                <a
                  href={exactOnlineInstructions.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Bekijk officiële documentatie
                </a>
              )}
            </div>
          )}

          <button
            onClick={() => setExpandedInstructions(expandedInstructions === 'twinfield' ? null : 'twinfield')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
          >
            <span className="font-medium text-gray-900">Twinfield Import</span>
            {expandedInstructions === 'twinfield' ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedInstructions === 'twinfield' && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-3">
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                {twinfieldInstructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
              {twinfieldInstructions.link && (
                <a
                  href={twinfieldInstructions.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Bekijk officiële documentatie
                </a>
              )}
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Tip:</strong> Bij het exporteren kun je kiezen uit vooraf geconfigureerde mappings voor verschillende systemen.
              Dit zorgt ervoor dat de velden direct overeenkomen met wat jouw boekhoudsysteem verwacht.
            </p>
          </div>
        </div>
      </div>

      {showBackupConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Complete Backup Maken</h3>
                <p className="text-sm text-gray-600">
                  Dit maakt een volledige backup van al je data inclusief klanten, projecten, facturen, medewerkers en werkbonnen.
                  Dit kan enkele minuten duren voor grote datasets.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBackupConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuleren
              </button>
              <button
                onClick={handleCompleteBackup}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
              >
                Backup Maken
              </button>
            </div>
          </div>
        </div>
      )}

      {showWizard && (
        <ExportWizard
          entity={showWizard}
          onClose={() => setShowWizard(null)}
        />
      )}
    </div>
  );
}
