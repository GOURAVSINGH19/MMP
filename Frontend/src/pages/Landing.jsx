import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Calendar, MapPin, Medal, Timer, Users, Zap } from 'lucide-react';
import heroImage from '../assets/hero1.png';
import Countdown from '../components/Countdown';

const NEXT_RACE_DATE = '2026-05-28T05:30:00.000Z';

const sponsors = ['Athletech', 'STRAVA', 'NIKE', 'GARMIN'];

const features = [
  {
    icon: Timer,
    title: 'Live race tracking',
    desc: 'Follow your status from registration through bib collection to finish line.',
  },
  {
    icon: Medal,
    title: 'Digital certificates',
    desc: 'Download official completion certificates the moment you cross the line.',
  },
  {
    icon: Users,
    title: 'Community first',
    desc: 'Join WhatsApp groups, volunteer crews, and training meetups across the city.',
  },
];

const stats = [
  { value: '500+', label: 'Active runners' },
  { value: '4', label: 'Race distances' },
  { value: '12', label: 'Events yearly' },
  { value: '98%', label: 'Satisfaction' },
];

export default function Landing() {
  const { user } = useAuth();
  const dashboardPath = ['ORGANIZER', 'EVENT_MANAGER', 'SUPER_ADMIN'].includes(user?.role)
    ? '/admin'
    : user?.role === 'VOLUNTEER'
      ? '/volunteer'
      : '/dashboard';

  return (
    <div className="w-full text-white -mt-16">
      {/* Hero */}
      <section className="relative isolate min-h-[100svh] flex flex-col overflow-hidden">
        <img
          src={heroImage}
          alt="Runners on race day"
          className="absolute inset-0 h-full w-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,89,60,0.2),transparent_45%),linear-gradient(180deg,rgba(29,29,27,0.15),rgba(29,29,27,0.92))]" />

        <div className="relative z-10 mx-auto flex flex-1 w-full max-w-6xl flex-col items-center justify-center px-4 pt-28 pb-16 text-center sm:px-6">
          <p className="animate-fade-in-up mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-sm">
            <Zap className="h-3 w-3 text-brand-primary" />
            Bay Area&apos;s premier running club
          </p>

          <h1
            className="animate-fade-in-up m-0 max-w-4xl text-[clamp(2.75rem,10vw,6.5rem)] font-black uppercase leading-[0.88] tracking-tighter"
            style={{ animationDelay: '0.05s' }}
          >
            <span className="text-white">Run</span>{' '}
            <span className="bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary bg-clip-text text-transparent">
              Together
            </span>
          </h1>

          <p
            className="animate-fade-in-up mt-6 max-w-xl text-base text-white/75 sm:text-lg"
            style={{ animationDelay: '0.1s' }}
          >
            Join the most vibrant marathon community. Register for events, track your bib, and celebrate every finish.
          </p>

          <Countdown targetDate={NEXT_RACE_DATE} className="mt-8 animate-fade-in-up" />

          <div
            className="animate-fade-in-up mt-10 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center"
            style={{ animationDelay: '0.15s' }}
          >
            <Link
              to={user ? dashboardPath : '/register-marathon'}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 text-xs font-bold uppercase tracking-widest text-white shadow-[0_8px_30px_rgba(232,89,60,0.45)] transition hover:scale-[1.02] hover:bg-brand-primary/90 active:scale-[0.98]"
            >
              {user ? 'Go to Dashboard' : 'Join the club'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/events"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-8 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm transition hover:bg-white hover:text-brand-dark hover:scale-[1.02] active:scale-[0.98]"
            >
              Browse events
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4 sm:px-6">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-black text-brand-primary sm:text-3xl">{value}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-brand-light px-4 py-16 sm:px-6 sm:py-24 text-slate-900">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">Why run with us</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Built for every runner</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              From first 5K to full marathon — one platform for registration, payments, and race-day logistics.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:border-brand-primary/20"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition group-hover:bg-brand-primary group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming CTA */}
      <section className="relative overflow-hidden bg-brand-dark px-4 py-16 sm:px-6 sm:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(232,89,60,0.15),transparent_50%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:flex-row sm:justify-between sm:p-10">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-2 text-brand-primary">
              <Calendar className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Next race</span>
            </div>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Metropolis Marathon 2026</h2>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/60 sm:justify-start">
              <MapPin className="h-4 w-4 shrink-0" />
              Metropolis Central Park · 5K to 42K
            </p>
          </div>
          <Link
            to="/register-marathon"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-primary px-8 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:scale-[1.02]"
          >
            Register now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Sponsors */}
      <section className="bg-white px-4 py-12 sm:py-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Proudly supported by leaders in fitness
        </p>
        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor}
              className="text-lg font-black uppercase tracking-widest text-slate-300 transition hover:text-brand-primary sm:text-xl"
            >
              {sponsor}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
