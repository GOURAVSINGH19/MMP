import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import heroImage from '../assets/hero1.png';

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-brand-dark p-10 text-white">
        <img
          src={heroImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-dark/90 to-brand-primary/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(232,89,60,0.25),transparent_55%)]" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <Trophy className="h-7 w-7 text-brand-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">Metropolis Marathon</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4 max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-accent">Run together</p>
          <h2 className="m-0 text-4xl font-black uppercase leading-[0.95] tracking-tight text-white">
            {title || 'Your race day starts here'}
          </h2>
          <p className="text-sm leading-relaxed text-white/70">
            {subtitle || 'Register, track your bib, and join thousands of runners across the bay area.'}
          </p>
        </div>

        <div className="relative z-10 flex gap-8 text-[10px] font-bold uppercase tracking-widest text-white/50">
          <span>500+ runners / mo</span>
          <span>4 race distances</span>
          <span>Live tracking</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8 bg-gradient-to-b from-brand-light/80 to-white">
        <div className="w-full max-w-md animate-fade-in-up">{children}</div>
      </div>
    </div>
  );
}
