import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui';
import { Trophy, LogOut, User, LayoutGrid, ClipboardList, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isOrganizer, isVolunteer, isParticipant } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-white hover:opacity-90 transition-opacity">
          <Trophy className="h-6 w-6 text-purple-650" />
          <span className="font-extrabold text-base tracking-tight uppercase">Metropolis Marathon 2026</span>
        </Link>

        {/* NAVIGATION LINKS */}
        <div className="flex items-center gap-6">
          
          {user ? (
            <>
              {/* Participant Pages */}
              {isParticipant() && (
                <>
                  <Link to="/dashboard" className="text-sm font-semibold text-slate-650 hover:text-purple-650 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/register-marathon" className="text-sm font-semibold text-slate-650 hover:text-purple-650 transition-colors">
                    Race Form
                  </Link>
                </>
              )}

              {/* Organizer Pages */}
              {isOrganizer() && (
                <>
                  <Link to="/admin" className="text-sm font-semibold text-slate-650 hover:text-purple-650 transition-colors flex items-center gap-1">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                  <Link to="/kanban" className="text-sm font-semibold text-slate-650 hover:text-purple-650 transition-colors flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>Kanban Tasks</span>
                  </Link>
                </>
              )}

              {/* Volunteer Pages */}
              {isVolunteer() && (
                <>
                  <Link to="/volunteer" className="text-sm font-semibold text-slate-650 hover:text-purple-650 transition-colors flex items-center gap-1">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Volunteer Portal</span>
                  </Link>
                  <Link to="/kanban" className="text-sm font-semibold text-slate-650 hover:text-purple-650 transition-colors flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    <span>Kanban Tasks</span>
                  </Link>
                </>
              )}

              {/* Logged in User Profile Info */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-850 dark:text-slate-100">{user.name}</div>
                  <div className="text-[10px] text-purple-650 font-mono tracking-wider uppercase font-bold">{user.role}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout} 
                  className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 border"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            // GUEST PAGES
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>Log In</span>
                </Button>
              </Link>
              <Link to="/register-marathon">
                <Button variant="glow" className="flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  <span>Enter Race</span>
                </Button>
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
  );
}
