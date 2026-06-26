'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const PHRASE_1 = 'Scheduling Made Simple'
const PHRASE_2 = 'Create a Booking Page'
const DASHBOARD_URL = '/dashboard/meeting-types'

type Phase = 'typing1' | 'pausing' | 'erasing' | 'typing2' | 'done'

export default function Home() {
  const [displayed, setDisplayed] = useState('')
  const [phase, setPhase] = useState<Phase>('typing1')
  const [cursorVisible, setCursorVisible] = useState(true)
  const [demoLink, setDemoLink] = useState('#demo')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let interval: ReturnType<typeof setInterval>
    timer = setTimeout(() => {
      let i = 0
      interval = setInterval(() => {
        i++
        setDisplayed(PHRASE_1.slice(0, i))
        if (i >= PHRASE_1.length) {
          clearInterval(interval)
          setPhase('pausing')
          timer = setTimeout(() => {
            setPhase('erasing')
            let j = PHRASE_1.length
            interval = setInterval(() => {
              j--
              setDisplayed(PHRASE_1.slice(0, j))
              if (j <= 0) {
                clearInterval(interval)
                setPhase('typing2')
                let k = 0
                interval = setInterval(() => {
                  k++
                  setDisplayed(PHRASE_2.slice(0, k))
                  if (k >= PHRASE_2.length) {
                    clearInterval(interval)
                    setPhase('done')
                    let blinks = 0
                    const blink = setInterval(() => {
                      setCursorVisible((v) => !v)
                      blinks++
                      if (blinks > 5) { clearInterval(blink); setCursorVisible(false) }
                    }, 400)
                  }
                }, 75)
              }
            }, 38)
          }, 1100)
        }
      }, 75)
    }, 300)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [])

  useEffect(() => {
    supabase.from('meeting_types').select('id').limit(1).single()
      .then(({ data }) => { if (data?.id) setDemoLink(`/book/${data.id}`) })
  }, [])

  const features = [
    {
      title: 'Set Your Availability',
      desc: 'Pick your working hours once. OpenSlot shows only the times you are free.',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
    {
      title: 'Share Your Booking Link',
      desc: 'Every meeting type gets its own link. Paste it anywhere — email, social, your site.',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>,
    },
    {
      title: 'Zero Double Bookings',
      desc: 'Real-time conflict checks ensure two people can never book the same slot.',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    },
    {
      title: 'Manage All Bookings',
      desc: 'One clean dashboard for every appointment. Who, when, and what — at a glance.',
      icon: <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
  ]

  const mockSlots = ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '2:00 PM']
  const isBlue = phase === 'typing2' || phase === 'done'

  return (
    <div className="min-h-screen bg-white flex flex-col antialiased">

      {/* ── NAVBAR ── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/96 backdrop-blur-xl shadow-[0_1px_16px_rgba(15,23,42,0.08)] border-b border-slate-200/60'
            : 'bg-white/80 backdrop-blur-md border-b border-slate-100'
        }`}
      >
        <div className="mx-auto max-w-6xl flex h-[68px] items-center justify-between px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200/70 group-hover:shadow-lg group-hover:shadow-blue-300/60 transition-shadow">
              <svg viewBox="0 0 24 24" fill="white" className="h-[18px] w-[18px]">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight leading-none">
              <span className="text-slate-800">Open</span><span className="text-blue-600">Slot</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how-it-works' },
              { label: 'Demo', href: '#demo' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative px-4 py-2 text-[13.5px] font-semibold text-slate-500 rounded-lg hover:text-blue-700 hover:bg-blue-50/70 transition-all duration-150 tracking-[0.01em] group"
              >
                {item.label}
                <span className="absolute bottom-[5px] left-4 right-4 h-[2px] rounded-full bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-center" />
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 text-[13.5px] font-semibold text-slate-600 rounded-lg border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 transition-all duration-150"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 px-5 py-[10px] text-[13.5px] font-bold text-white shadow-md shadow-blue-300/50 hover:shadow-lg hover:shadow-blue-300/70 hover:-translate-y-px active:scale-95 transition-all duration-150"
            >
              Get started free
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

        </div>
      </header>

      <main className="flex-1">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,#dbeafe,transparent)] pt-28 pb-24 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#bfdbfe1a_1px,transparent_1px),linear-gradient(to_bottom,#bfdbfe1a_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative mx-auto max-w-3xl px-6">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-[11px] font-bold tracking-widest text-blue-700 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Free during early access
            </div>

            <h1
              className="text-[52px] sm:text-[66px] font-extrabold tracking-[-2.5px] leading-[1.06] min-h-[78px] sm:min-h-[82px] transition-colors duration-300"
              style={{ color: isBlue ? '#1d4ed8' : '#0f172a' }}
            >
              {displayed}
              <span
                className="inline-block w-[3px] h-[50px] sm:h-[62px] ml-0.5 align-middle rounded-full transition-all duration-200"
                style={{ opacity: cursorVisible ? 1 : 0, backgroundColor: isBlue ? '#1d4ed8' : '#0f172a' }}
              />
            </h1>

            <p className="mt-6 text-[18px] text-slate-500 leading-[1.7] max-w-[420px] mx-auto">
              Stop the back-and-forth. Share a link.
              <br className="hidden sm:block" />
              <span className="text-slate-700 font-medium">Let people book time with you instantly.</span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 px-8 py-4 text-[15px] font-bold text-white shadow-xl shadow-blue-300/40 hover:shadow-2xl hover:shadow-blue-400/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
              >
                Create Your Booking Page
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href={demoLink}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-8 py-4 text-[15px] font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-150 shadow-sm"
              >
                <svg className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Demo
              </a>
            </div>

            <p className="mt-5 text-[12.5px] text-slate-400 tracking-wide font-medium">
              No credit card needed &middot; Up and running in under 5 minutes
            </p>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-y border-slate-100">
          <div className="mx-auto max-w-5xl px-6 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              'No sign-up required for visitors',
              'Works on any device',
              'Live in under 5 minutes',
              'Conflicts blocked automatically',
            ].map((t) => (
              <span key={t} className="flex items-center gap-2 text-[12.5px] font-semibold text-slate-500 tracking-wide">
                <svg className="h-[15px] w-[15px] text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="features" className="py-28 bg-white">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.18em] mb-4">Features</p>
              <h2 className="text-[38px] font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 bg-clip-text text-transparent leading-tight">
                Everything you need,<br className="hidden sm:block" /> nothing you don&apos;t
              </h2>
              <p className="mt-4 text-[17px] text-slate-500 max-w-sm mx-auto leading-relaxed">
                Built to be simple. Set it up once and it just works.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl bg-white border border-slate-100 p-7 shadow-[0_2px_16px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)] hover:border-blue-200/80 hover:-translate-y-1 transition-all duration-200"
                >
                  <div className="mb-5 h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-200">
                    {f.icon}
                  </div>
                  <h3 className="text-[14.5px] font-bold text-slate-800 mb-2 tracking-[-0.01em]">{f.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="py-28 bg-gradient-to-b from-slate-50/80 to-white">
          <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center">
            <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.18em] mb-4">How it works</p>
            <h2 className="text-[38px] font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 bg-clip-text text-transparent leading-tight">
              Up and running in 3 steps
            </h2>
            <p className="mt-4 text-[17px] text-slate-500">No technical knowledge needed.</p>

            <div className="mt-16 grid sm:grid-cols-3 gap-10 relative">
              <div className="hidden sm:block absolute top-[26px] left-[calc(16.66%+24px)] right-[calc(16.66%+24px)] h-px bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200" />
              {[
                { n: '1', title: 'Set your hours', desc: 'Pick which days and times you are available to accept bookings.' },
                { n: '2', title: 'Create a meeting type', desc: 'Name it, set a duration, and your booking page is instantly live.' },
                { n: '3', title: 'Share your link', desc: 'Send it to anyone. They pick a slot and you get a confirmed booking.' },
              ].map((s) => (
                <div key={s.n} className="relative flex flex-col items-center text-center">
                  <div className="z-10 mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 text-xl font-black text-white shadow-lg shadow-blue-200/70">
                    {s.n}
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO MOCKUP ── */}
        <section id="demo" className="py-28 bg-white">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-[0.18em] mb-4">Live preview</p>
              <h2 className="text-[38px] font-extrabold tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 bg-clip-text text-transparent leading-tight">
                This is what your visitors see
              </h2>
              <p className="mt-4 text-[17px] text-slate-500">Clean, focused, and distraction-free.</p>
            </div>

            <div className="mx-auto max-w-[440px] overflow-hidden rounded-3xl border border-slate-200/80 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
              {/* Browser chrome */}
              <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <div className="ml-3 flex-1 bg-white rounded-md px-3 py-1 text-[11px] text-slate-400 text-center font-semibold tracking-wide">
                  openslot.app/book/intro-call
                </div>
              </div>

              <div className="bg-white px-8 py-7">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    JS
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 font-semibold tracking-wide uppercase">Jane Smith</p>
                    <h3 className="text-[17px] font-bold text-slate-900 tracking-tight leading-tight">30-min Intro Call</h3>
                  </div>
                </div>

                <p className="text-[13px] text-slate-500 mb-5 font-medium">Pick a time that works for you.</p>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-slate-700 tracking-tight">June 2026</span>
                  <div className="flex gap-1 text-slate-400 text-[11px]">
                    <span className="px-2 py-1 rounded-md hover:bg-slate-100 cursor-default font-semibold">&lt;</span>
                    <span className="px-2 py-1 rounded-md hover:bg-slate-100 cursor-default font-semibold">&gt;</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-6">
                  {mockSlots.map((t, i) => (
                    <div
                      key={t}
                      className={`rounded-xl border py-2.5 text-center text-[13px] font-semibold transition-colors ${
                        i === 2
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {t}
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5 space-y-3">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your details</p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Name</label>
                    <div className="h-9 bg-white border border-slate-200 rounded-xl px-3 flex items-center text-[13px] text-slate-300 italic shadow-sm">Alex Johnson</div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email</label>
                    <div className="h-9 bg-white border border-slate-200 rounded-xl px-3 flex items-center text-[13px] text-slate-300 italic shadow-sm">alex@example.com</div>
                  </div>
                  <button disabled className="w-full rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 py-2.5 text-[13px] font-bold text-white shadow-md shadow-blue-200">
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,255,255,0.07),transparent)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="relative mx-auto max-w-2xl px-6 text-center">
            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-[0.2em] mb-5">Get started today</p>
            <h2 className="text-[40px] sm:text-[52px] font-extrabold text-white tracking-tight leading-[1.08]">
              Your booking page is
              <br />one click away
            </h2>
            <p className="mt-5 text-[17px] text-blue-100/90 max-w-sm mx-auto leading-relaxed">
              Stop asking clients when they are free.
              Send a link instead.
            </p>
            <Link
              href={DASHBOARD_URL}
              className="mt-10 inline-flex items-center gap-2 rounded-2xl bg-white px-9 py-4 text-[15px] font-bold text-blue-700 shadow-2xl hover:bg-blue-50 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
            >
              Create Your Booking Page
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <p className="mt-4 text-[12.5px] text-blue-300 font-medium">Free to start &middot; No credit card needed</p>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-6xl px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="white" className="h-3.5 w-3.5">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
            </div>
            <span className="text-[14px] font-bold tracking-tight">
              <span className="text-slate-700">Open</span><span className="text-blue-600">Slot</span>
            </span>
          </div>
          <p className="text-[12px] text-slate-400 font-medium">2026 OpenSlot. All rights reserved.</p>
          <div className="flex items-center gap-6 text-[12.5px] font-semibold text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
