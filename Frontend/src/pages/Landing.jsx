import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Card, CardContent } from '../components/ui';
import { Trophy, Calendar, MapPin, Users, Heart, Award, ArrowRight } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-[85vh] flex flex-col justify-center px-4 overflow-hidden bg-slate-50 dark:bg-slate-900/10">
      
      {/* Dynamic graphic blobs */}
      <div className="absolute top-10 left-10 h-96 w-96 rounded-full bg-purple-500/15 blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-green-500/5 blur-3xl -z-10" />

      {/* HERO SECTION */}
      <div className="max-w-4xl mx-auto text-center space-y-8 py-16">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-xs uppercase tracking-widest animate-bounce">
          🏆 Registrations Now Active
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter m-0">
          Metropolis Marathon <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-650 to-green-555">2026</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-550 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Challenge your limits, cross the ultimate finish line, and secure your place in city history. Experience the premiere running event of the year.
        </p>

        {/* Action button triggers */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {user ? (
            <Link to={user.role === 'ORGANIZER' ? '/admin' : user.role === 'VOLUNTEER' ? '/volunteer' : '/dashboard'}>
              <Button variant="glow" size="lg" className="flex items-center gap-2">
                <span>Enter Your Dashboard</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register-marathon">
                <Button variant="glow" size="lg" className="flex items-center gap-2">
                  <span>Register for the Marathon</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Access Runner Portal
                </Button>
              </Link>
            </>
          )}
        </div>

      </div>

      {/* HIGHLIGHT DETAILS GRID */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 py-12 w-full">
        
        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/50 hover:border-purple-500/20 hover:scale-[1.01]">
          <CardContent className="p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-650 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-lg">Race Day Timeline</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Official flag-off commences May 28, 2026. BIB kit handouts and routing maps will be issued via scanner check-ins.
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/50 hover:border-purple-500/20 hover:scale-[1.01]">
          <CardContent className="p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-650 flex items-center justify-center">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-lg">Four Iconic Categories</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Catering to all abilities with Fun Run (5K), Quarter (10K), Half Marathon (21K), and the challenging Full Marathon (42K).
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/50 hover:border-purple-500/20 hover:scale-[1.01]">
          <CardContent className="p-6 space-y-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-purple-650 flex items-center justify-center">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="font-extrabold text-lg">Finisher Medals & PDFs</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Every participant crossing the line receives an athletic finisher tee, Timing chip data and a dynamically generated PDF certificate!
            </p>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
