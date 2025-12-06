import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Pause, Square, RotateCcw, Clock, Calendar } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface TimeTrackerProps {
  workOrderId: string;
  employees: Array<{ id: string; name: string }>;
  onEntrySaved: () => void;
}

type Mode = 'timer' | 'manual';

export default function TimeTracker({ workOrderId, employees, onEntrySaved }: TimeTrackerProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<Mode>('timer');

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualEmployee, setManualEmployee] = useState('');
  const [manualStartTime, setManualStartTime] = useState('08:00');
  const [manualEndTime, setManualEndTime] = useState('17:00');
  const [manualBreak, setManualBreak] = useState(30);
  const [manualNotes, setManualNotes] = useState('');

  useEffect(() => {
    const savedState = localStorage.getItem(`timer_${workOrderId}`);
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.isRunning) {
        const elapsed = Math.floor((Date.now() - new Date(state.startTime).getTime()) / 1000);
        setElapsedSeconds(elapsed);
        setStartTime(new Date(state.startTime));
        setIsRunning(true);
        setIsPaused(false);
      }
    }
  }, [workOrderId]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isRunning && startTime) {
      localStorage.setItem(
        `timer_${workOrderId}`,
        JSON.stringify({
          isRunning: true,
          startTime: startTime.toISOString(),
        })
      );
    } else {
      localStorage.removeItem(`timer_${workOrderId}`);
    }
  }, [isRunning, startTime, workOrderId]);

  useEffect(() => {
    if (elapsedSeconds > 36000) {
      showToast('Timer loopt al meer dan 10 uur. Vergeten te stoppen?', 'warning');
    }
  }, [elapsedSeconds]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRunning) {
        e.preventDefault();
        e.returnValue = 'De timer loopt nog. Weet je zeker dat je wilt afsluiten?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setIsRunning(true);
    setIsPaused(false);
    setElapsedSeconds(0);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    if (!startTime) return;

    const endTime = new Date();
    const start = startTime.toTimeString().slice(0, 5);
    const end = endTime.toTimeString().slice(0, 5);

    setShowSaveDialog(true);
    setSelectedDate(startTime.toISOString().split('T')[0]);

    setIsRunning(false);
    setIsPaused(false);
  };

  const handleReset = () => {
    setElapsedSeconds(0);
    setIsRunning(false);
    setIsPaused(false);
    setStartTime(null);
    localStorage.removeItem(`timer_${workOrderId}`);
  };

  const calculateTotalHours = (start: string, end: string, breakMins: number) => {
    const startDate = new Date(`2000-01-01T${start}`);
    const endDate = new Date(`2000-01-01T${end}`);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.max(0, diffHours - breakMins / 60);
  };

  const handleSaveTimerEntry = async () => {
    if (!selectedEmployee || !startTime) return;

    setSaving(true);
    const endTime = new Date(startTime.getTime() + elapsedSeconds * 1000);
    const start = startTime.toTimeString().slice(0, 8);
    const end = endTime.toTimeString().slice(0, 8);
    const totalHours = calculateTotalHours(start.slice(0, 5), end.slice(0, 5), breakMinutes);

    const { error } = await supabase.from('time_entries').insert({
      work_order_id: workOrderId,
      employee_id: selectedEmployee,
      date: selectedDate,
      start_time: start,
      end_time: end,
      break_minutes: breakMinutes,
      total_hours: totalHours,
      notes: notes,
      user_id: user?.id,
    });

    setSaving(false);

    if (error) {
      showToast('Fout bij opslaan urenregistratie', 'error');
      return;
    }

    showToast('Uren succesvol geregistreerd', 'success');
    setShowSaveDialog(false);
    handleReset();
    setBreakMinutes(0);
    setNotes('');
    onEntrySaved();
  };

  const handleSaveManualEntry = async () => {
    if (!manualEmployee) {
      showToast('Selecteer een medewerker', 'error');
      return;
    }

    setSaving(true);
    const totalHours = calculateTotalHours(manualStartTime, manualEndTime, manualBreak);

    if (totalHours <= 0) {
      showToast('Eindtijd moet na starttijd zijn', 'error');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('time_entries').insert({
      work_order_id: workOrderId,
      employee_id: manualEmployee,
      date: manualDate,
      start_time: manualStartTime,
      end_time: manualEndTime,
      break_minutes: manualBreak,
      total_hours: totalHours,
      notes: manualNotes,
      user_id: user?.id,
    });

    setSaving(false);

    if (error) {
      showToast('Fout bij opslaan urenregistratie', 'error');
      return;
    }

    showToast('Uren succesvol geregistreerd', 'success');
    setManualNotes('');
    onEntrySaved();
  };

  const manualTotalHours = calculateTotalHours(manualStartTime, manualEndTime, manualBreak);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-2 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setMode('timer')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
            mode === 'timer'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Timer Modus
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
            mode === 'manual'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Handmatig
        </button>
      </div>

      {mode === 'timer' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center mb-8">
            <div className="text-6xl font-mono font-bold text-gray-900 mb-6">
              {formatTime(elapsedSeconds)}
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-8 py-3 bg-brand-secondary text-white rounded-lg hover:opacity-90 transition font-medium text-lg"
                >
                  <Play className="w-5 h-5" />
                  Start
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium"
                  >
                    <Pause className="w-5 h-5" />
                    {isPaused ? 'Hervatten' : 'Pauze'}
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    <Square className="w-5 h-5" />
                    Stop
                  </button>
                </>
              )}

              {!isRunning && elapsedSeconds > 0 && (
                <button
                  onClick={handleReset}
                  className="p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  title="Reset"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {showSaveDialog && startTime && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Urenregistratie opslaan</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medewerker *
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    required
                  >
                    <option value="">Selecteer medewerker</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starttijd
                    </label>
                    <input
                      type="text"
                      value={startTime.toTimeString().slice(0, 5)}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Eindtijd
                    </label>
                    <input
                      type="text"
                      value={new Date(startTime.getTime() + elapsedSeconds * 1000)
                        .toTimeString()
                        .slice(0, 5)}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pauze (minuten)
                  </label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notities (optioneel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                    placeholder="Wat heb je gedaan?"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveTimerEntry}
                    disabled={!selectedEmployee || saving}
                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving ? 'Opslaan...' : 'Opslaan'}
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      handleReset();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Handmatige invoer</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Datum *</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medewerker *
              </label>
              <select
                value={manualEmployee}
                onChange={(e) => setManualEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              >
                <option value="">Selecteer medewerker</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starttijd *
                </label>
                <input
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eindtijd *
                </label>
                <input
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pauze (minuten)
              </label>
              <input
                type="number"
                value={manualBreak}
                onChange={(e) => setManualBreak(Number(e.target.value))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
            </div>

            {manualTotalHours > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Totaal</div>
                  <div className="text-3xl font-bold text-brand-secondary">
                    {manualTotalHours.toFixed(1)} uur
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notities (optioneel)
              </label>
              <textarea
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                placeholder="Wat heb je gedaan?"
              />
            </div>

            <button
              onClick={handleSaveManualEntry}
              disabled={!manualEmployee || saving || manualTotalHours <= 0}
              className="w-full px-4 py-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Opslaan...' : 'Uren registreren'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
