'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type MeetingType = {
  id: string;
  name: string;
  duration_minutes: number;
};

type Slot = {
  start: Date;
  end: Date;
};

function generateNext7Days(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function formatDateButton(date: Date): { weekday: string; day: string; month: string } {
  return {
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    day: String(date.getDate()),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
  };
}

function formatSlotTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function generateSlots(
  availStart: string,
  availEnd: string,
  date: Date,
  durationMinutes: number
): Slot[] {
  const [startH, startM] = availStart.split(':').map(Number);
  const [endH, endM] = availEnd.split(':').map(Number);

  const windowStart = new Date(date);
  windowStart.setHours(startH, startM, 0, 0);

  const windowEnd = new Date(date);
  windowEnd.setHours(endH, endM, 0, 0);

  const slots: Slot[] = [];
  let cursor = new Date(windowStart);

  while (true) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd > windowEnd) break;
    slots.push({ start: new Date(cursor), end: slotEnd });
    cursor = slotEnd;
  }

  return slots;
}

// ── Shimmer skeleton for the slot grid while slots load ───────────────────────
function SlotSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-xl skeleton-shimmer"
          style={{ animationDelay: `${i * 35}ms` }}
        />
      ))}
    </div>
  );
}

// ── Full-page structural skeleton shown while meeting type fetches ─────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 px-4 py-10 sm:py-14">
      <div className="max-w-xl mx-auto">
        {/* Step indicator skeleton */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full skeleton-shimmer" />
                  <div className="w-8 h-2 rounded mt-1.5 skeleton-shimmer" />
                </div>
                {i < 2 && (
                  <div className="h-px w-12 sm:w-20 mx-1 mb-5 bg-slate-100" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Header card skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-7 py-6 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl skeleton-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-44 rounded-lg skeleton-shimmer" />
              <div className="h-3.5 w-20 rounded-full skeleton-shimmer" />
            </div>
          </div>
        </div>

        {/* Date picker skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-6 mb-5">
          <div className="h-2.5 w-20 rounded skeleton-shimmer mb-5" />
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 py-3"
              >
                <div className="h-2 w-6 rounded skeleton-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                <div className="h-4 w-5 rounded skeleton-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
                <div className="h-2 w-5 rounded skeleton-shimmer" style={{ animationDelay: `${i * 50}ms` }} />
              </div>
            ))}
          </div>
        </div>

        {/* Time slots skeleton */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-6">
          <div className="h-2.5 w-28 rounded skeleton-shimmer mb-5" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-xl skeleton-shimmer"
                style={{ animationDelay: `${i * 35}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Date' },
    { n: 2, label: 'Time' },
    { n: 3, label: 'Details' },
  ];
  return (
    <div className="flex items-center gap-0 mb-6">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? 'bg-blue-600 text-white'
                    : active
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <span className={`text-[10px] font-semibold mt-1 tracking-wide uppercase ${active ? 'text-blue-600' : done ? 'text-blue-400' : 'text-slate-300'}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-12 sm:w-20 mx-1 mb-4 transition-all duration-300 ${done ? 'bg-blue-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BookingPage({ params }: { params: { meetingTypeId: string } }) {
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const days = generateNext7Days();
  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);

  const step: 1 | 2 | 3 = selectedSlot ? 3 : 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!visitorName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(visitorEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!selectedSlot) return;

    setSubmitting(true);

    const { error } = await supabase.from('bookings').insert({
      meeting_type_id: params.meetingTypeId,
      visitor_name: visitorName.trim(),
      visitor_email: visitorEmail.trim(),
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
    });

    if (error) {
      console.error('Booking insert error:', error);
      if (error.code === '23P01' || error.code === '23505') {
        setFormError('This time was just booked by someone else. Please pick another slot.');
      } else {
        setFormError('Something went wrong — please try again.');
      }
      setSubmitting(false);
      return;
    }

    setSlotsRefreshKey((k) => k + 1);
    setBookingConfirmed(true);
    setSubmitting(false);
  }

  useEffect(() => {
    async function fetchMeetingType() {
      const { data, error } = await supabase
        .from('meeting_types')
        .select('id, name, duration_minutes')
        .eq('id', params.meetingTypeId)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoadingMeeting(false);
        return;
      }

      setMeetingType(data);
      setLoadingMeeting(false);
    }

    fetchMeetingType();
  }, [params.meetingTypeId]);

  useEffect(() => {
    if (!meetingType) return;

    async function fetchSlots() {
      setLoadingSlots(true);
      setSlotsError(false);

      const dayOfWeek = selectedDate.getDay();
      const dateStr = [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0'),
      ].join('-');

      const [availResult, bookedRes] = await Promise.all([
        supabase
          .from('availability')
          .select('start_time, end_time')
          .eq('day_of_week', dayOfWeek),
        fetch(`/api/booked-slots?date=${dateStr}`).then((r) => r.json()),
      ]);

      if (availResult.error || bookedRes.error) {
        setSlotsError(true);
        setLoadingSlots(false);
        return;
      }

      if (!availResult.data || availResult.data.length === 0) {
        setSlots([]);
        setLoadingSlots(false);
        return;
      }

      const existingBookings: { start_time: string; end_time: string }[] = bookedRes.slots ?? [];

      const allSlots = availResult.data.flatMap((avail) =>
        generateSlots(avail.start_time, avail.end_time, selectedDate, meetingType!.duration_minutes)
      );

      const openSlots = allSlots.filter((slot) =>
        existingBookings.every((booking) => {
          const bStart = new Date(booking.start_time);
          const bEnd = new Date(booking.end_time);
          return slot.end <= bStart || slot.start >= bEnd;
        })
      );

      setSlots(openSlots);
      setLoadingSlots(false);
    }

    fetchSlots();
  }, [selectedDate, meetingType, slotsRefreshKey]);

  // Scroll form into view smoothly when slot is chosen
  useEffect(() => {
    if (selectedSlot && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedSlot]);

  // ── Full-page structural skeleton while meeting type fetches ───────────────
  if (loadingMeeting) {
    return <PageSkeleton />;
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center max-w-sm w-full animate-scale-in">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Link not found</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            This booking link doesn&apos;t exist or may have been removed by the host.
          </p>
        </div>
      </div>
    );
  }

  // ── Confirmation screen ────────────────────────────────────────────────────
  if (bookingConfirmed && selectedSlot) {
    const bookedStart = new Date(selectedSlot.start);
    const bookedEnd = new Date(selectedSlot.end);
    const formattedDate = bookedStart.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = formatSlotTime(bookedStart) + ' – ' + formatSlotTime(bookedEnd);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-scale-in">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="px-10 py-10 text-center">
              {/* Animated checkmark circle */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-green-100" />
                <div className="absolute inset-1 rounded-full bg-green-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Confirmed</p>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">You&apos;re booked!</h1>
              <p className="text-slate-500 text-sm mb-8">
                Hi <span className="font-semibold text-slate-700">{visitorName}</span> — your meeting is all set.
              </p>

              {/* Meeting detail rows */}
              <div className="bg-slate-50 rounded-2xl p-5 text-left space-y-3.5 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Date</p>
                    <p className="text-sm font-semibold text-slate-800">{formattedDate}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100" />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Time</p>
                    <p className="text-sm font-semibold text-slate-800">{formattedTime}</p>
                  </div>
                </div>
                <div className="border-t border-slate-100" />
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Confirmation sent to</p>
                    <p className="text-sm font-semibold text-slate-800">{visitorEmail}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400">You&apos;ll receive a confirmation email shortly.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main booking page ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 px-4 py-10 sm:py-14">
      <div className="max-w-xl mx-auto">

        {/* Step indicator */}
        <div className="flex justify-center mb-8">
          <StepIndicator step={step} />
        </div>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-7 py-6 mb-5 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">{meetingType!.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {meetingType!.duration_minutes} min
                </span>
                <span className="text-xs text-slate-400">Video / Phone call</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date picker card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-6 mb-5 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4 px-1">Select a date</p>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const { weekday, day, month } = formatDateButton(date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  className={`relative flex flex-col items-center py-3 rounded-xl text-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected
                      ? 'bg-blue-600 shadow-lg shadow-blue-200/60'
                      : 'hover:bg-blue-50 border border-transparent hover:border-blue-100'
                  }`}
                >
                  <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    {weekday}
                  </span>
                  <span className={`text-sm font-bold leading-none ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {day}
                  </span>
                  <span className={`text-[9px] mt-1 font-medium ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                    {month}
                  </span>
                  {isToday && !isSelected && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time slots card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-6 mb-5 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Available times</p>
            {!loadingSlots && slots.length > 0 && (
              <span className="text-[11px] font-semibold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                {slots.length} open
              </span>
            )}
          </div>

          {loadingSlots ? (
            /* ── Shimmer skeleton while slots load ── */
            <SlotSkeleton />
          ) : slotsError ? (
            /* ── Error state ── */
            <div className="py-8 flex flex-col items-center gap-4 text-center animate-fade-in-up">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Couldn&apos;t load available times</p>
                <p className="text-xs text-slate-400 leading-relaxed">This is usually a network blip. Give it another try.</p>
              </div>
              <button
                onClick={() => setSlotsRefreshKey((k) => k + 1)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try again
              </button>
            </div>
          ) : slots.length === 0 ? (
            /* ── Empty state ── */
            <div className="py-8 flex flex-col items-center gap-4 text-center animate-fade-in-up">
              {/* Illustrated calendar icon */}
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center relative">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {/* Small 'no' badge */}
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-1">No openings on this day</p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[220px] mx-auto">
                  The host isn&apos;t available here. Select a different date to see open slots.
                </p>
              </div>
              {/* Hint dots */}
              <div className="flex gap-1.5 mt-1">
                {[0, 1, 2].map((d) => (
                  <div key={d} className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                ))}
              </div>
            </div>
          ) : (
            /* ── Slot grid with staggered fade-in ── */
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((slot, index) => {
                const isSelected = selectedSlot?.start === slot.start.toISOString();
                return (
                  <button
                    key={slot.start.toISOString()}
                    onClick={() =>
                      setSelectedSlot({
                        start: slot.start.toISOString(),
                        end: slot.end.toISOString(),
                      })
                    }
                    style={{ animationDelay: `${index * 30}ms` }}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 animate-fade-in-up ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200/60 scale-105'
                        : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 hover:scale-105'
                    }`}
                  >
                    {formatSlotTime(slot.start)}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Booking form — slides + fades in when a slot is selected */}
        <div
          ref={formRef}
          className={`transition-all duration-500 ease-out overflow-hidden ${
            selectedSlot ? 'max-h-[900px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-2'
          }`}
        >
          {selectedSlot && (
            <div id="booking-form" className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-6 animate-fade-in-up">
              {/* Section label */}
              <div className="flex items-center gap-2 mb-5 px-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Your details</p>
              </div>

              {/* Selected slot summary pill */}
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wide mb-0.5">Selected time</p>
                  <p className="text-sm font-bold text-blue-700 truncate">
                    {new Date(selectedSlot.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' · '}
                    {formatSlotTime(new Date(selectedSlot.start))}
                    {' – '}
                    {formatSlotTime(new Date(selectedSlot.end))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="ml-auto text-blue-300 hover:text-blue-500 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-blue-100"
                  aria-label="Clear selected time"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name input */}
                <div>
                  <label htmlFor="visitor-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="visitor-name"
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="Jane Smith"
                      autoComplete="name"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Email input */}
                <div>
                  <label htmlFor="visitor-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Your Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="visitor-email"
                      type="email"
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="jane@example.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Error banner */}
                {formError && (
                  <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 animate-fade-in-up">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-sm text-red-600 leading-snug">{formError}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200/60 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none mt-1"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-blue-300/60 border-t-white rounded-full animate-spin" />
                      Booking your slot…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Confirm Booking
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 pt-1">
                  Your details are only used to confirm this meeting.
                </p>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
