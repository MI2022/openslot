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
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Set Availability</h1>
        <form className="space-y-4" onSubmit={handleSave}>
          {DAYS.map((day, index) => {
            const { enabled, startTime, endTime } = availability[index];
            return (
              <div key={day} className="flex items-center gap-4">
                <input
                  type="checkbox"
                  id={day}
                  checked={enabled}
                  onChange={() => toggleDay(index)}
                  className="h-4 w-4 accent-blue-600"
                />
                <label htmlFor={day} className="w-28 text-gray-700 font-medium">
                  {day}
                </label>
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    type="time"
                    value={startTime}
                    disabled={!enabled}
                    onChange={(e) => updateTime(index, 'startTime', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={endTime}
                    disabled={!enabled}
                    onChange={(e) => updateTime(index, 'endTime', e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            );
          })}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Save
            </button>
          </div>
          {message && (
            <p className={`text-sm font-medium text-center pt-2 ${
              message === 'Availability saved!' ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

