'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type DayState = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

const initialState: DayState[] = DAYS.map(() => ({
  enabled: false,
  startTime: '09:00',
  endTime: '17:00',
}));

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<DayState[]>(initialState);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadAvailability() {
      const { data, error } = await supabase.from('availability').select('*');
      if (error) {
        console.error('Error loading availability:', error);
        return;
      }
      if (data && data.length > 0) {
        setAvailability((prev) => {
          const updated = [...prev];
          data.forEach((row) => {
            const index: number = row.day_of_week;
            if (index >= 0 && index <= 6) {
              updated[index] = {
                enabled: true,
                startTime: row.start_time,
                endTime: row.end_time,
              };
            }
          });
          return updated;
        });
      }
    }
    loadAvailability();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const rows = availability
      .map((day, index) => ({ day, index }))
      .filter(({ day }) => day.enabled)
      .map(({ day, index }) => ({
        day_of_week: index,
        start_time: day.startTime,
        end_time: day.endTime,
      }));

    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows }),
    });

    if (!res.ok) {
      setMessage('Error saving — please try again.');
      return;
    }

    setMessage('Availability saved!');
  }

  function toggleDay(index: number) {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, enabled: !day.enabled } : day))
    );
  }

  function updateTime(index: number, field: 'startTime' | 'endTime', value: string) {
    setAvailability((prev) =>
      prev.map((day, i) => (i === index ? { ...day, [field]: value } : day))
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Availability</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set your weekly working hours. Visitors can only book during these times.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">

        {/* Blue accent bar — matches meeting types cards */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400" />

        {/* Timezone banner */}
        <div className="flex items-center gap-2.5 px-7 py-4 border-b border-slate-100 bg-slate-50/60">
          <svg className="h-4 w-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[12.5px] text-slate-500">
            Your timezone:{' '}
            <span className="font-semibold text-slate-700">
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          </span>
        </div>

        <form onSubmit={handleSave}>
          <div className="px-7 py-2 divide-y divide-slate-100">
            {DAYS.map((day, index) => {
              const { enabled, startTime, endTime } = availability[index];
              return (
                <div
                  key={day}
                  className={`flex items-center gap-5 py-5 transition-colors duration-150 ${
                    enabled ? '' : 'opacity-50'
                  }`}
                >
                  {/* Custom checkbox */}
                  <label className="relative flex-shrink-0 cursor-pointer">
                    <input
                      type="checkbox"
                      id={day}
                      checked={enabled}
                      onChange={() => toggleDay(index)}
                      className="sr-only peer"
                    />
                    <div className={`h-6 w-6 rounded-lg border-2 transition-all duration-150 flex items-center justify-center shadow-sm ${
                      enabled
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-slate-300 hover:border-slate-400'
                    }`}>
                      {enabled && (
                        <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>

                  {/* Day label */}
                  <label
                    htmlFor={day}
                    className={`w-32 text-[15px] font-semibold cursor-pointer select-none transition-colors ${
                      enabled ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {day}
                  </label>

                  {/* Time inputs */}
                  {enabled ? (
                    <div className="flex items-center gap-3 ml-auto">
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all w-[130px]"
                      />
                      <span className="text-[13px] font-medium text-slate-400">to</span>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                        className="border border-slate-200 rounded-xl px-4 py-2 text-[13.5px] font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-slate-300 transition-all w-[130px]"
                      />
                    </div>
                  ) : (
                    <span className="ml-auto text-[13px] text-slate-400 font-medium">Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-7 pb-7 pt-3 space-y-3 border-t border-slate-100 mt-2">
            {message && (
              <div className={`flex items-center gap-2 text-[13px] font-medium rounded-xl px-4 py-3 ${
                message === 'Availability saved!'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {message === 'Availability saved!' ? (
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {message}
              </div>
            )}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 text-[14px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:scale-[0.98]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save availability
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

