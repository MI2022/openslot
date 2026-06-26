'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type MeetingType = {
  id: string;
  name: string;
  duration_minutes: number;
  is_active: boolean;
};

export default function MeetingTypesPage() {
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [newName, setNewName] = useState('');
  const [newDuration, setNewDuration] = useState(30);
  const [addError, setAddError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEmbedId, setExpandedEmbedId] = useState<string | null>(null);
  const [copiedEmbedId, setCopiedEmbedId] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  function getBookingUrl(id: string) {
    return `${origin}/book/${id}`;
  }

  function getEmbedSnippet(id: string) {
    return `<iframe src="${origin}/book/${id}" width="100%" height="700" frameborder="0" style="border:none;border-radius:12px;"></iframe>`;
  }

  async function copyToClipboard(text: string, onSuccess: () => void) {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess();
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      onSuccess();
    }
  }

  function handleCopyLink(id: string) {
    copyToClipboard(getBookingUrl(id), () => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleCopyEmbed(id: string) {
    copyToClipboard(getEmbedSnippet(id), () => {
      setCopiedEmbedId(id);
      setTimeout(() => setCopiedEmbedId(null), 2000);
    });
  }

  useEffect(() => {
    async function fetchMeetingTypes() {
      const { data, error } = await supabase
        .from('meeting_types')
        .select('id, name, duration_minutes, is_active')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching meeting types:', error);
        return;
      }

      setMeetingTypes(data ?? []);
    }

    fetchMeetingTypes();
  }, []);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAddError(null);

    const { data, error } = await supabase
      .from('meeting_types')
      .insert({ name: newName.trim(), duration_minutes: newDuration, is_active: true })
      .select('id, name, duration_minutes, is_active')
      .single();

    if (error) {
      console.error('Error adding meeting type:', error);
      setAddError(error.message);
      return;
    }

    setMeetingTypes((prev) => [...prev, data]);
    setNewName('');
    setNewDuration(30);
  }

  async function handleToggle(id: string, currentIsActive: boolean) {
    const { error } = await supabase
      .from('meeting_types')
      .update({ is_active: !currentIsActive })
      .eq('id', id);

    if (error) {
      console.error('Error toggling meeting type:', error);
      return;
    }

    setMeetingTypes((prev) =>
      prev.map((mt) => (mt.id === id ? { ...mt, is_active: !currentIsActive } : mt))
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Meeting Types</h1>
        <p className="mt-1 text-sm text-slate-500">Create and share booking pages for each type of meeting you offer.</p>
      </div>

      {/* Meeting Types List */}
      <section className="mb-6 space-y-3">
        {meetingTypes.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-700">No meeting types yet</p>
            <p className="mt-1 text-sm text-slate-400">Add your first one below to get a shareable booking link.</p>
          </div>
        ) : (
          meetingTypes.map((mt) => (
            <div
              key={mt.id}
              className={`bg-white border rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden ${
                mt.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'
              }`}
            >
              {/* Coloured left accent bar */}
              <div className={`h-1 w-full ${mt.is_active ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-slate-200'}`} />

              {/* Card body */}
              <div className="px-6 pt-5 pb-4">
                {/* Title row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Icon */}
                    <div className={`flex-shrink-0 mt-0.5 h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm ${
                      mt.is_active ? 'bg-blue-50 border border-blue-100' : 'bg-slate-100 border border-slate-200'
                    }`}>
                      <svg className={`h-5 w-5 ${mt.is_active ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {/* Title + duration */}
                    <div className="min-w-0">
                      <h2 className="text-[18px] font-bold text-slate-900 leading-snug tracking-tight truncate">{mt.name}</h2>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-500">
                        <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{mt.duration_minutes} minutes</span>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold border ${
                    mt.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${mt.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {mt.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

              </div>

              {/* Card footer — actions */}
              <div className="px-6 pb-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {/* Copy link — primary action */}
                <button
                  onClick={() => handleCopyLink(mt.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all duration-150 ${
                    copiedId === mt.id
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                  }`}
                >
                  {copiedId === mt.id ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy booking link
                    </>
                  )}
                </button>

                {/* Activate / Deactivate */}
                <button
                  onClick={() => handleToggle(mt.id, mt.is_active)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all duration-150 shadow-sm"
                >
                  {mt.is_active ? (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Deactivate
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Activate
                    </>
                  )}
                </button>

                {/* Embed code toggle */}
                <button
                  onClick={() => setExpandedEmbedId(expandedEmbedId === mt.id ? null : mt.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-all duration-150 shadow-sm"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  {expandedEmbedId === mt.id ? 'Hide embed' : 'Embed code'}
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${expandedEmbedId === mt.id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Embed code panel */}
              {expandedEmbedId === mt.id && (
                <div className="mx-6 mb-6 bg-slate-900 rounded-2xl p-5 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Embed snippet</span>
                    <button
                      onClick={() => handleCopyEmbed(mt.id)}
                      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
                        copiedEmbedId === mt.id ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {copiedEmbedId === mt.id ? (
                        <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                      ) : (
                        <><svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy snippet</>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11.5px] text-emerald-300 whitespace-pre-wrap break-all font-mono leading-relaxed">{getEmbedSnippet(mt.id)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {/* Add Meeting Type Form */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-[15px] font-semibold text-slate-800">Add a meeting type</h2>
          <p className="text-[12.5px] text-slate-400 mt-0.5">It will get its own shareable booking link.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="meeting-name" className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Meeting name
            </label>
            <input
              id="meeting-name"
              type="text"
              placeholder="e.g. 30-Minute Call"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13.5px] text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="duration" className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Duration (minutes)
            </label>
            <input
              id="duration"
              type="number"
              placeholder="30"
              min={1}
              value={newDuration}
              onChange={(e) => setNewDuration(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-[13.5px] text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
            />
          </div>
          {addError && (
            <p className="flex items-center gap-1.5 text-[13px] text-red-600">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {addError}
            </p>
          )}
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13.5px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add meeting type
          </button>
        </div>
      </section>
    </div>
  );
}
