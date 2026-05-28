import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL } from '../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui';
import { Trophy, CheckCircle, ShieldAlert, Award, FileText, QrCode, LogOut, Check, Phone, User, Activity } from 'lucide-react';

const STATUS_STEPS = ["REGISTERED", "APPROVED", "CONFIRMED", "BIB_COLLECTED", "COMPLETED"];

const STATUS_METADATA = {
  REGISTERED: { label: "Registered", desc: "Submitted & awaiting organizer approval", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  APPROVED: { label: "Approved", desc: "Approved! Click Confirm below to claim your spot", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  CONFIRMED: { label: "Confirmed", desc: "Confirmed! Waiting for BIB allocation", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  BIB_COLLECTED: { label: "BIB Collected", desc: "Kit collected! Get ready for race day!", color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  COMPLETED: { label: "Completed", desc: "Finished! Download your official certificate", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
};

export default function ParticipantDashboard() {
  const { user, logout } = useAuth();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Fetch participant status
  const fetchStatus = async () => {
    try {
      const response = await api.get(`/participant/status/${user.id}`);
      setRegistration(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Could not fetch registration details. Please make sure you are registered.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStatus();
    }
  }, [user]);

  // Confirm attendance action (APPROVED -> CONFIRMED)
  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const response = await api.post('/participant/confirm', { userId: user.id });
      setRegistration(response.data.registration);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm attendance');
    } finally {
      setConfirmLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading your runner profile...</p>
      </div>
    );
  }

  const currentStatusIndex = registration ? STATUS_STEPS.indexOf(registration.status) : 0;
  const currentMeta = registration ? STATUS_METADATA[registration.status] : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white m-0 tracking-tight">Runner Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <span className="font-semibold text-purple-650">{user?.name}</span>! Ready for race day?
          </p>
        </div>
        <Button variant="outline" onClick={logout} className="flex items-center gap-2 border-red-500/20 hover:bg-red-500/10 text-red-650 hover:border-red-500/30">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-250 p-4 text-sm text-amber-700 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {registration ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Status and Progress (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* PROGRESS TRACKER */}
            <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <CardTitle>Event Milestones</CardTitle>
                </div>
                <CardDescription>
                  Your current marathon registration milestones status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                
                {/* Horizontal Progress Timeline */}
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-2 px-2 py-4">
                  {/* Background Progress line */}
                  <div className="absolute top-[28px] left-[5%] right-[5%] h-[4px] bg-slate-200 dark:bg-slate-800 -z-10 hidden md:block" />
                  {/* Foreground active line */}
                  <div 
                    className="absolute top-[28px] left-[5%] h-[4px] bg-gradient-to-r from-purple-500 to-green-500 -z-10 hidden md:block transition-all duration-500" 
                    style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 90}%` }}
                  />

                  {STATUS_STEPS.map((stepName, idx) => {
                    const isCompleted = currentStatusIndex > idx;
                    const isActive = currentStatusIndex === idx;
                    const isPending = currentStatusIndex < idx;
                    
                    return (
                      <div key={stepName} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 flex-1 relative w-full md:w-auto">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isActive 
                            ? 'border-purple-600 bg-purple-600 text-white shadow-[0_0_15px_rgba(170,59,255,0.5)] scale-110'
                            : isCompleted
                            ? 'border-green-500 bg-green-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400'
                        }`}>
                          {isCompleted ? <Check className="h-5 w-5" /> : idx + 1}
                        </div>
                        <div className="flex flex-col md:items-center">
                          <span className={`text-sm font-semibold tracking-tight ${
                            isActive ? 'text-purple-600 dark:text-purple-400 font-extrabold' : isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                          }`}>
                            {STATUS_METADATA[stepName].label}
                          </span>
                          <span className="text-[10px] text-slate-400 hidden md:block max-w-[120px]">
                            {idx === 0 && "Submissions"}
                            {idx === 1 && "Verifications"}
                            {idx === 2 && "Secured Entries"}
                            {idx === 3 && "Kit Handover"}
                            {idx === 4 && "Timing Official"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Milestone Summary Display */}
                <div className={`mt-8 rounded-xl border border-dashed p-5 text-center flex flex-col items-center justify-center space-y-2 ${currentMeta.bg} ${currentMeta.border}`}>
                  <div className={`font-extrabold text-lg ${currentMeta.color}`}>{currentMeta.label} Status</div>
                  <div className="text-sm text-slate-600 dark:text-slate-350 max-w-lg">{currentMeta.desc}</div>
                  
                  {/* Self-Confirmation Button (Phase 4) */}
                  {registration.status === 'APPROVED' && (
                    <Button 
                      variant="glow" 
                      onClick={handleConfirm} 
                      disabled={confirmLoading}
                      className="mt-3 flex items-center gap-2 animate-pulse hover:animate-none"
                    >
                      {confirmLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Confirm My Attendance</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>

              </CardContent>
            </Card>

            {/* RUNNER SPECS SUMMARY */}
            <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40">
              <CardHeader>
                <CardTitle className="text-lg">Event & Registration Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Marathon Category</div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">{registration.distance} Category</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">T-Shirt Finisher Size</div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">Unisex Size {registration.tshirtSize}</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Emergency Contact Person</div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">{registration.emergencyName}</div>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400">Emergency Phone</div>
                    <div className="text-base font-bold text-slate-800 dark:text-white">{registration.emergencyPhone}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* BIB Tag Display (Right 1 col) */}
          <div className="space-y-8">
            
            {/* OFFICIAL BIB DISPLAY CARD */}
            <Card className="overflow-hidden border-2 border-purple-550 dark:border-purple-800 shadow-2xl relative bg-linear-to-b from-purple-950/50 to-slate-950/90 text-white rounded-2xl group transition-all duration-500 hover:scale-[1.02]">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl group-hover:bg-purple-500/20 transition-all duration-500" />
              
              <div className="p-6 flex flex-col items-center text-center space-y-6">
                <div className="text-xs uppercase font-extrabold tracking-widest text-purple-400 border border-purple-500/20 bg-purple-500/10 px-3 py-1 rounded-full">
                  Official BIB Card
                </div>

                {registration.bib ? (
                  <>
                    <div className="space-y-1">
                      <div className="text-[64px] font-black leading-none text-white tracking-tight drop-shadow-md">
                        {registration.bib}
                      </div>
                      <div className="text-xs font-bold text-purple-400 uppercase tracking-widest">{registration.distance} Finisher Kit</div>
                    </div>

                    {/* QR Code Container (Phase 6) */}
                    {registration.bibQrUrl ? (
                      <div className="bg-white p-3 rounded-2xl shadow-xl border border-white/20 transition-transform duration-500 group-hover:scale-105">
                        <img 
                          src={registration.bibQrUrl} 
                          alt="Marathon Checkin QR Code" 
                          className="h-40 w-40 block" 
                        />
                      </div>
                    ) : (
                      <div className="h-40 w-40 flex items-center justify-center rounded-2xl border border-dashed border-white/20 text-slate-500 text-xs">
                        QR Pending
                      </div>
                    )}
                    
                    <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">
                      Present this official checkin QR code at the bib collection counter to receive your runner pack.
                    </p>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center space-y-4">
                    <QrCode className="h-16 w-16 text-slate-600 animate-pulse" />
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-400 uppercase">BIB Pending Approval</div>
                      <p className="text-xs text-slate-500 max-w-[180px] leading-relaxed">
                        Once you confirm your attendance, your official BIB number and Checkin QR will appear here.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* FINISHER CORNER / CERTIFICATES (Phase 7) */}
            {registration.status === 'COMPLETED' && (
              <Card className="border border-green-500/20 dark:border-green-800/20 bg-green-500/5 shadow-lg">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 mb-2">
                    <Award className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Congratulations Finisher!</CardTitle>
                  <CardDescription>
                    Official marathon certificate issued
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2 flex flex-col items-center gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Officially clocked at: <strong className="text-green-600 text-sm">{registration.finishTime}</strong>
                  </div>
                  {/* Dynamic Stream Certificate Link */}
                  <a 
                    href={`${API_BASE_URL}/certificate/${user.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center"
                  >
                    <Button variant="glow" className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Download Certificate</span>
                    </Button>
                  </a>
                </CardContent>
              </Card>
            )}

          </div>

        </div>
      ) : (
        <Card className="text-center p-8 border-dashed">
          <CardContent className="space-y-4">
            <Trophy className="h-16 w-16 mx-auto text-slate-350" />
            <h3 className="text-xl font-bold">No Active Marathon Entry</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              We couldn't locate a marathon registration linked to your runner account. Fill in the official event form to secure your spot.
            </p>
            <Button onClick={() => navigate('/register-marathon')} variant="glow">
              Register for Marathon
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
