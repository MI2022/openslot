'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type Booking = {
  id: string;
  visitor_name: string;
  visitor_email: string;
  start_time: string;
  end_time: string;
  meeting_types: { name: string } | null;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function fetchBookings() {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, visitor_name, visitor_email, start_time, end_time, meeting_types(name)')
        .order('start_time', { ascending: true });

      if (error) {
        console.error(error);
        setFetchError(true);
        setLoading(false);
        return;
      }

      setBookings(data as unknown as Booking[]);
      setLoading(false);
    }

    fetchBookings();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">All upcoming appointments, sorted by date.</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-slate-400 py-12 justify-center">
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading bookings…
        </div>
      ) : fetchError ? (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Could not load bookings — please refresh.
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
            <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">No bookings yet</p>
          <p className="mt-1 text-sm text-slate-400">When someone books a slot, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const initials = booking.visitor_name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const startDate = new Date(booking.start_time);
            const endDate = new Date(booking.end_time);
            const dateLabel = startDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            });
            const timeLabel = `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} – ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

            return (
              <div
                key={booking.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                {/* Blue accent bar — matches meeting types & availability */}
                <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-400" />

                <div className="px-6 pt-5 pb-6">
                  {/* Top row: avatar + name + badge */}
                  <div className="flex items-start gap-4">
                    {/* Monogram avatar */}
                    <div className="flex-shrink-0 h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                      <span className="text-[15px] font-bold text-blue-600 tracking-tight">{initials}</span>
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h2 className="text-[17px] font-bold text-slate-900 leading-snug tracking-tight">
                          {booking.visitor_name}
                        </h2>
                        {/* Meeting type badge */}
                        <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {booking.meeting_types?.name ?? '—'}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="mt-1 flex items-center gap-1.5 text-[13px] text-slate-400">
                        <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{booking.visitor_email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="mt-5 border-t border-slate-100" />

                  {/* Date + time row */}
                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="flex items-center gap-2 text-[13px] text-slate-600">
                      <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-700">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px] text-slate-600">
                      <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-slate-700">{timeLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

