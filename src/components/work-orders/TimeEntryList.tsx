import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, User, Coffee, ChevronDown, ChevronUp, Calendar, Trash2 } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';

interface TimeEntry {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  total_hours: number;
  notes: string | null;
  employee: {
    id: string;
    name: string;
    role: string;
  };
}

interface TimeEntryListProps {
  entries: TimeEntry[];
  onEntryDeleted: () => void;
}

export default function TimeEntryList({ entries, onEntryDeleted }: TimeEntryListProps) {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  const filteredEntries = entries.filter((entry) => {
    if (!dateRange.start && !dateRange.end) return true;
    const entryDate = new Date(entry.date);
    if (dateRange.start && entryDate < new Date(dateRange.start)) return false;
    if (dateRange.end && entryDate > new Date(dateRange.end)) return false;
    return true;
  });

  const groupedByDate = filteredEntries.reduce((acc, entry) => {
    const date = entry.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, TimeEntry[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  const totalHours = filteredEntries.reduce((sum, entry) => sum + Number(entry.total_hours), 0);

  const handleDelete = async (entryId: string) => {
    const confirmed = await confirm({
      title: 'Urenregistratie verwijderen',
      message: 'Weet je zeker dat je deze urenregistratie wilt verwijderen?',
      confirmText: 'Verwijderen',
      cancelText: 'Annuleren',
    });

    if (!confirmed) return;

    const { error } = await supabase.from('time_entries').delete().eq('id', entryId);

    if (error) {
      showToast('Fout bij verwijderen', 'error');
      return;
    }

    showToast('Urenregistratie verwijderd', 'success');
    onEntryDeleted();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Vandaag';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gisteren';
    } else {
      return date.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
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

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen uren geregistreerd</h3>
        <p className="text-gray-600">Start de timer of voer handmatig uren in</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand-primary to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-100">Totaal geregistreerde uren</span>
          <Clock className="w-5 h-5 text-blue-200" />
        </div>
        <div className="text-4xl font-bold">{totalHours.toFixed(1)} uur</div>
        <div className="text-blue-100 text-sm mt-1">
          {filteredEntries.length} registratie{filteredEntries.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filter op periode</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Van</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Tot</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
        </div>
        {(dateRange.start || dateRange.end) && (
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="text-sm text-brand-primary hover:text-blue-700 mt-3 font-medium"
          >
            Filter wissen
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sortedDates.map((date) => {
          const dateEntries = groupedByDate[date];
          const dateTotalHours = dateEntries.reduce(
            (sum, entry) => sum + Number(entry.total_hours),
            0
          );
          const isExpanded = expandedDates.has(date);

          return (
            <div key={date} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleDate(date)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-brand-primary">
                      {new Date(date).getDate()}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{formatDate(date)}</div>
                    <div className="text-sm text-gray-600">
                      {dateEntries.length} registratie{dateEntries.length !== 1 ? 's' : ''} ·{' '}
                      {dateTotalHours.toFixed(1)} uur
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 divide-y divide-gray-200">
                  {dateEntries.map((entry) => (
                    <div key={entry.id} className="p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-brand-primary rounded-full flex items-center justify-center text-white font-semibold">
                            {entry.employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{entry.employee.name}</div>
                            <div className="text-xs text-gray-500">
                              {getRoleLabel(entry.employee.role)}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>
                            {entry.start_time?.slice(0, 5)} - {entry.end_time?.slice(0, 5)}
                          </span>
                        </div>
                        {entry.break_minutes > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Coffee className="w-4 h-4" />
                            <span>{entry.break_minutes} min</span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-lg font-bold text-brand-primary">
                            {Number(entry.total_hours).toFixed(1)}u
                          </span>
                        </div>
                      </div>

                      {entry.notes && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-2">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
