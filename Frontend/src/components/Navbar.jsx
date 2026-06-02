import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import { Trophy, LogOut, LayoutGrid, ClipboardList, LogIn, UserPlus, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isOrganizer, isVolunteer, isParticipant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = location.pathname === '/';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const linkClass = (path) =>
    `text-sm font-semibold tracking-wide transition-all duration-200 relative py-1.5 ${
      isActive(path)
        ? isHome
          ? 'text-brand-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-primary after:rounded-full'
          : 'text-brand-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-brand-primary after:rounded-full'
        : isHome
          ? 'text-white/80 hover:text-white'
          : 'text-slate-500 hover:text-brand-primary'
    }`;

  const navShell = isHome
    ? 'relative z-50 border-b border-white/10 bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm'
    : 'sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-sm';

  const logoText = isHome ? 'text-white' : 'text-slate-900';

  return (
    <nav className={navShell}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className={`flex items-center gap-2.5 hover:opacity-90 transition-opacity ${logoText}`}>
          <Trophy className="h-6 w-6 text-brand-primary shrink-0" />
          <span className="font-extrabold text-sm sm:text-base tracking-wider uppercase">Metropolis Marathon</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className={linkClass('/events')}>
            {!user ? 'Events' : isOrganizer() ? 'Manage Events' : isVolunteer() || isParticipant() ? 'My Events' : 'Events'}
          </Link>

          {user ? (
            <>
              {isParticipant() && (
                <Link to="/dashboard" className={linkClass('/dashboard')}>
                  Dashboard
                </Link>
              )}

              {isOrganizer() && (
                <>
                  <Link to="/admin" className={linkClass('/admin')}>
                    <span className="flex items-center gap-1.5">
                      <LayoutGrid className="h-4 w-4" />
                      Admin
                    </span>
                  </Link>
                  <Link to="/kanban" className={linkClass('/kanban')}>
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4" />
                      Tasks
                    </span>
                  </Link>
                </>
              )}

              {isVolunteer() && !isOrganizer() && (
                <>
                  <Link to="/volunteer" className={linkClass('/volunteer')}>
                    <span className="flex items-center gap-1.5">
                      <LayoutGrid className="h-4 w-4" />
                      Portal
                    </span>
                  </Link>
                  <Link to="/kanban" className={linkClass('/kanban')}>
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4" />
                      Tasks
                    </span>
                  </Link>
                </>
              )}

              <div className={`flex items-center gap-3 pl-4 border-l ${isHome ? 'border-white/20' : 'border-slate-200'}`}>
                <div className="text-right hidden lg:block">
                  <div className={`text-xs font-extrabold ${isHome ? 'text-white' : 'text-slate-800'}`}>{user.name}</div>
                  <div className="text-[9px] text-brand-primary font-bold tracking-widest uppercase">
                    {user.role?.replace('_', ' ')}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className={`h-9 w-9 rounded-xl ${isHome ? 'text-white/70 hover:text-red-300 hover:bg-white/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50/80'}`}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className={`flex items-center gap-1.5 ${isHome ? 'text-white hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:text-brand-primary'}`}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </Button>
              </Link>
              <Link to="/register-marathon">
                <Button variant="glow" className="flex items-center gap-1.5 shadow-[0_4px_20px_rgba(232,89,60,0.35)]">
                  <UserPlus className="h-4 w-4" />
                  <span>Enter Race</span>
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className={`md:hidden p-2 rounded-lg ${isHome ? 'text-white hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100'}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className={`md:hidden border-t px-4 py-4 space-y-3 animate-fade-in-up ${
            isHome ? 'border-white/10 bg-brand-dark/95 backdrop-blur-lg' : 'border-slate-200 bg-white'
          }`}
        >
          <Link to="/events" className={`block py-2 ${linkClass('/events')}`} onClick={() => setMobileOpen(false)}>
            {isOrganizer() ? 'Manage Events' : isVolunteer() || isParticipant() ? 'My Events' : 'Events'}
          </Link>
          {user ? (
            <>
              {isParticipant() && (
                <Link to="/dashboard" className={`block py-2 ${linkClass('/dashboard')}`} onClick={() => setMobileOpen(false)}>
                  Dashboard
                </Link>
              )}
              {isOrganizer() && (
                <>
                  <Link to="/admin" className={`block py-2 ${linkClass('/admin')}`} onClick={() => setMobileOpen(false)}>
                    Admin Panel
                  </Link>
                  <Link to="/kanban" className={`block py-2 ${linkClass('/kanban')}`} onClick={() => setMobileOpen(false)}>
                    Kanban Tasks
                  </Link>
                </>
              )}
              {isVolunteer() && !isOrganizer() && (
                <>
                  <Link to="/volunteer" className={`block py-2 ${linkClass('/volunteer')}`} onClick={() => setMobileOpen(false)}>
                    Volunteer Portal
                  </Link>
                  <Link to="/kanban" className={`block py-2 ${linkClass('/kanban')}`} onClick={() => setMobileOpen(false)}>
                    Kanban Tasks
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className={`w-full text-left py-2 text-sm font-semibold ${isHome ? 'text-red-300' : 'text-red-600'}`}
              >
                Sign out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Log In</Button>
              </Link>
              <Link to="/register-marathon" onClick={() => setMobileOpen(false)}>
                <Button variant="glow" className="w-full">Enter Race</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
