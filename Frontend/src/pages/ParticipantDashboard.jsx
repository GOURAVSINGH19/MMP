import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { API_BASE_URL } from '../services/api';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Select } from '../components/ui';
import { Trophy, CheckCircle, ShieldAlert, Award, FileText, QrCode, Check, Phone, User, Activity, MessageCircle, CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';

const STATUS_STEPS = ["REGISTERED", "APPROVED", "CONFIRMED", "BIB_COLLECTED", "COMPLETED"];

const PAYMENT_STATUS_META = {
  PAYMENT_PENDING: { label: 'Payment pending', desc: 'Complete payment to confirm your registration', color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  PAYMENT_FAILED: { label: 'Payment failed', desc: 'Retry payment from your dashboard', color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' },
};

const STATUS_METADATA = {
  REGISTERED:    { label: "Registered",    desc: "Submitted & awaiting organizer approval",        color: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
  APPROVED:      { label: "Approved",      desc: "Approved! Click Confirm below to claim your spot", color: "text-amber-600",  bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  CONFIRMED:     { label: "Confirmed",     desc: "Confirmed! Waiting for BIB allocation",           color: "text-brand-primary", bg: "bg-brand-primary/10",  border: "border-brand-primary/20"  },
  BIB_COLLECTED: { label: "BIB Collected", desc: "Kit collected! Get ready for race day!",          color: "text-strip-primary",  bg: "bg-strip-primary/10",   border: "border-strip-primary/20"   },
  COMPLETED:     { label: "Completed",     desc: "Finished! Download your official certificate",    color: "text-emerald-600",bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

export default function ParticipantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [payment, setPayment] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedRegId, setSelectedRegId] = useState('');
  const [whatsappLink, setWhatsappLink] = useState(import.meta.env.VITE_WHATSAPP_LINK || '');
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const [eventsRes, myEventsRes] = await Promise.allSettled([
        api.get('/events'),
        api.get('/participant/my-events')
      ]);

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value.data);
      }

      if (myEventsRes.status === 'fulfilled') {
        const myEvents = myEventsRes.value.data;
        const allRegs = [
          ...(myEvents.current ? [myEvents.current] : []),
          ...(myEvents.history || [])
        ];
        setRegistrations(allRegs);
        setError('');

        if (allRegs.length > 0) {
          const defaultReg = myEvents.current || allRegs[0];
          setSelectedRegId(defaultReg.id);
        } else {
          setLoading(false);
        }
      } else {
        setError('Could not fetch registrations list. Please make sure you are logged in.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred while loading your profile.');
      setLoading(false);
    }
  };

  const fetchRegistrationDetails = async (regId) => {
    if (!regId) return;
    setDetailsLoading(true);
    try {
      const statusRes = await api.get(`/participant/status/${regId}`);
      const reg = statusRes.data;
      setRegistration(reg);
      setError('');

      // Extract payment info
      if (reg?.payments?.length > 0) {
        const successPay = reg.payments.find(p => p.status === 'SUCCESSFUL');
        setPayment(successPay || reg.payments[0]);
      } else {
        setPayment(null);
      }

      // Try to load WhatsApp community link from backend
      if (reg?.eventId) {
        try {
          const waRes = await api.get(`/payments/whatsapp-groups/${reg.eventId}`);
          const communityGroup = waRes.data?.find(g => g.groupType === 'COMMUNITY');
          if (communityGroup?.link) setWhatsappLink(communityGroup.link);
          else setWhatsappLink('');
        } catch (_) {
          setWhatsappLink(import.meta.env.VITE_WHATSAPP_LINK || '');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not fetch registration details for the selected marathon.');
    } finally {
      setDetailsLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchStatus();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRegId) {
      fetchRegistrationDetails(selectedRegId);
    }
  }, [selectedRegId]);

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      const response = await api.post('/participant/confirm', {
        userId: user.id,
        eventId: registration.eventId,
        registrationId: registration.id,
      });
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <p className="mt-4 text-sm text-slate-500">Loading your runner profile...</p>
      </div>
    );
  }

  const isPaymentState = registration && ['PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(registration.status);
  const currentStatusIndex =
    registration && !isPaymentState ? Math.max(0, STATUS_STEPS.indexOf(registration.status)) : -1;
  const currentMeta =
    registration && PAYMENT_STATUS_META[registration.status]
      ? PAYMENT_STATUS_META[registration.status]
      : registration
        ? STATUS_METADATA[registration.status]
        : null;

  const downloadCertificate = async () => {
    try {
      const res = await api.get(`/certificate/${registration.id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch {
      setError('Could not download certificate. Please try again.');
    }
  };
  const bibNumber = typeof registration?.bib === 'string' ? registration.bib : registration?.bib?.bibNumber;
  const bibQrUrl = registration?.bibQrUrl || registration?.bib?.QRCode;

  // Payment display helpers
  const paymentStatusColor = {
    SUCCESSFUL: 'success',
    PENDING: 'warning',
    FAILED: 'danger',
    PAYMENT_PENDING: 'warning',
    REFUNDED: 'secondary',
  };

  const completedReg = registrations.find(r => r.status === 'COMPLETED');
  const canShowParticipantLeaderboard = registration?.status === 'COMPLETED';
  const defaultLeaderboardEventId = canShowParticipantLeaderboard
    ? registration.eventId
    : (completedReg ? completedReg.eventId : undefined);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-brand-primary/8 blur-2xl" />
        <h1 className="relative m-0 text-2xl sm:text-3xl font-black tracking-tight text-slate-950">Runner Dashboard</h1>
        <p className="relative mt-2 text-slate-500">
          Welcome back, <span className="font-semibold text-brand-primary">{user?.name}</span> — ready for race day?
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-250 p-4 text-sm text-amber-700 dark:text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Registration Selector (Multi-registration support) */}
      {registrations.length > 1 && (
        <Card className="border border-slate-200/60 dark:border-slate-800/40 shadow-sm bg-gradient-to-r from-brand-primary/5 to-transparent">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Select Marathon Entry</div>
                <div className="text-sm font-bold text-slate-850 dark:text-white">
                  Switch between your registered marathon events to view status & timings.
                </div>
              </div>
            </div>
            <div className="w-full sm:w-[280px]">
              <Select
                value={selectedRegId}
                onChange={(e) => setSelectedRegId(e.target.value)}
                className="w-full"
                disabled={detailsLoading}
              >
                {registrations.map(reg => (
                  <option key={reg.id} value={reg.id}>
                    {reg.event?.name} ({reg.distance})
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {registration ? (
        <>
          {/* Payment Status Banner (only for paid events) */}
          {payment && (
            <Card className="border border-slate-200/60 dark:border-slate-800/40 shadow-md">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    payment.status === 'SUCCESSFUL' ? 'bg-green-100 dark:bg-green-950/50 text-green-600' :
                    payment.status === 'FAILED' ? 'bg-red-100 dark:bg-red-950/50 text-red-500' :
                    'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
                  }`}>
                    {payment.status === 'SUCCESSFUL' ? <CheckCircle className="h-5 w-5" /> :
                     payment.status === 'FAILED' ? <AlertCircle className="h-5 w-5" /> :
                     <CreditCard className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Registration Payment</div>
                    <div className="font-bold text-slate-800 dark:text-white">
                      ₹{payment.amount?.toLocaleString('en-IN') || '0'}
                      {payment.currency && <span className="text-xs text-slate-400 ml-1">{payment.currency}</span>}
                    </div>
                    {payment.transactionId && (
                      <div className="text-xs text-slate-400 font-mono mt-0.5">TXN: {payment.transactionId}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={paymentStatusColor[payment.status] || 'secondary'}>
                    {payment.status?.replace(/_/g, ' ')}
                  </Badge>
                  {payment.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="glow"
                      onClick={() => navigate(`/paytm-checkout/${payment.id}`)}
                      className="text-xs"
                    >
                      Complete Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Status + Specs */}
            <div className="lg:col-span-2 space-y-8">              {/* PROGRESS TRACKER */}
              <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-brand-primary animate-pulse" />
                    <CardTitle>Event Milestones</CardTitle>
                  </div>
                  <CardDescription>Your current marathon registration milestones status</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="relative flex flex-col md:flex-row justify-between items-center gap-6 md:gap-2 px-2 py-4">
                    <div className="absolute top-[28px] left-[5%] right-[5%] h-[4px] bg-slate-200 dark:bg-slate-800 -z-10 hidden md:block" />
                    <div
                      className="absolute top-[28px] left-[5%] h-[4px] bg-gradient-to-r from-brand-primary to-strip-primary -z-10 hidden md:block transition-all duration-500"
                      style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 90}%` }}
                    />
                    {STATUS_STEPS.map((stepName, idx) => {
                      const isCompleted = currentStatusIndex > idx;
                      const isActive = currentStatusIndex === idx;
                      return (
                        <div key={stepName} className="flex md:flex-col items-center md:text-center gap-4 md:gap-2 flex-1 relative w-full md:w-auto">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isActive
                              ? 'border-brand-primary bg-brand-primary text-white shadow-[0_0_15px_rgba(232,89,60,0.4)] scale-110'
                              : isCompleted
                              ? 'border-strip-primary bg-strip-primary text-white shadow-[0_0_15px_rgba(59,109,17,0.2)]'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-400'
                          }`}>
                            {isCompleted ? <Check className="h-5 w-5" /> : idx + 1}
                          </div>
                          <div className="flex flex-col md:items-center">
                            <span className={`text-sm font-semibold tracking-tight ${
                              isActive ? 'text-brand-primary font-extrabold' : isCompleted ? 'text-strip-primary' : 'text-slate-400'
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

                  <div className={`mt-8 rounded-xl border border-dashed p-5 text-center flex flex-col items-center justify-center space-y-2 ${currentMeta.bg} ${currentMeta.border}`}>
                    <div className={`font-extrabold text-lg ${currentMeta.color}`}>{currentMeta.label} Status</div>
                    <div className="text-sm text-slate-650 dark:text-slate-350 max-w-lg">{currentMeta.desc}</div>
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

              {/* RUNNER SPECS */}
              <Card className="shadow-lg border-slate-200/60 dark:border-slate-800/40">
                <CardHeader>
                  <CardTitle className="text-lg">Event & Registration Settings</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3 md:col-span-2">
                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Event</div>
                      <div className="text-base font-bold text-slate-800 dark:text-white">{registration.event?.name || 'Marathon Event'}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-strip-primary/10 text-strip-primary flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Marathon Category</div>
                      <div className="text-base font-bold text-slate-800 dark:text-white">{registration.distance} Category</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">T-Shirt Finisher Size</div>
                      <div className="text-base font-bold text-slate-800 dark:text-white">Unisex Size {registration.tshirtSize}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Emergency Contact Person</div>
                      <div className="text-base font-bold text-slate-800 dark:text-white">{registration.emergencyName}</div>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Emergency Phone</div>
                      <div className="text-base font-bold text-slate-800 dark:text-white">{registration.emergencyPhone}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WHATSAPP COMMUNITY CARD */}
              {whatsappLink && (
                <Card className="border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 shadow-md">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-green-500 flex items-center justify-center shrink-0 shadow-lg">
                      <MessageCircle className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="font-extrabold text-slate-800 dark:text-white text-base">Join Our Runner Community</div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Connect with fellow marathoners, get real-time race updates and tips in the official WhatsApp group.
                      </p>
                    </div>
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <Button variant="glow" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Join WhatsApp</span>
                        <ExternalLink className="h-3 w-3 opacity-70" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: BIB + Certificate */}
            <div className="space-y-8">

              {/* OFFICIAL BIB DISPLAY CARD */}
              <div className="overflow-hidden border-4 border-strip-dark bg-white text-slate-900 rounded-3xl shadow-xl transition-all duration-500 hover:scale-[1.02] relative flex flex-col min-h-[380px]">
                {/* Top strip banner */}
                <div className="bg-strip-primary text-white py-3.5 px-6 flex justify-between items-center border-b-2 border-strip-dark">
                  <span className="text-[10px] font-black tracking-widest uppercase">METROPOLIS RUNNER</span>
                  <span className="text-[10px] font-mono tracking-widest uppercase font-black bg-white/20 px-2 py-0.5 rounded">{registration.distance}</span>
                </div>

                <div className="p-6 flex flex-col items-center justify-center flex-grow space-y-5 bg-gradient-to-b from-white to-strip-light/20">
                  {bibNumber ? (
                    <>
                      <div className="text-center">
                        <div className="text-[72px] font-black font-mono leading-none tracking-tighter text-strip-dark drop-shadow-sm select-none">
                          {bibNumber}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Official BIB Number</div>
                      </div>

                      {bibQrUrl ? (
                        <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200/80 transition-transform duration-500 hover:scale-105">
                          <img src={bibQrUrl} alt="Marathon Checkin QR Code" className="h-36 w-36 block" />
                        </div>
                      ) : (
                        <div className="h-36 w-36 flex items-center justify-center rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
                          QR Pending
                        </div>
                      )}

                      <p className="text-[9px] font-bold text-slate-500 max-w-[200px] leading-relaxed text-center uppercase tracking-wide">
                        Present this BIB check-in QR code at the counter to claim your pack.
                      </p>
                    </>
                  ) : (
                    <div className="py-10 flex flex-col items-center space-y-4">
                      <QrCode className="h-14 w-14 text-slate-400 animate-pulse" />
                      <div className="space-y-1.5 text-center">
                        <div className="text-sm font-black text-slate-700 uppercase tracking-wide">BIB Pending Allocation</div>
                        <p className="text-xs text-slate-500 max-w-[190px] leading-relaxed mx-auto">
                          Once registration is verified and attendance is confirmed, your custom runner BIB will load here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom safety & timing strip */}
                <div className="bg-strip-dark text-strip-light py-2.5 px-6 flex justify-between items-center text-[9px] font-mono tracking-widest uppercase mt-auto">
                  <span>TIMING CHIP DETECTED</span>
                  <span>SERIES 2026</span>
                </div>
              </div>

              {/* FINISHER CERTIFICATE */}
              {registration.status === 'COMPLETED' && (
                <Card className="border border-green-500/20 dark:border-green-800/20 bg-green-500/5 shadow-lg">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 mb-2">
                      <Award className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Congratulations Finisher!</CardTitle>
                    <CardDescription>Official marathon certificate issued</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2 flex flex-col items-center gap-3">
                    <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      Officially clocked at: <strong className="text-green-600 text-sm">{registration.finishTime}</strong>
                    </div>
                    <Button
                      type="button"
                      variant="glow"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2"
                      onClick={downloadCertificate}
                    >
                      <FileText className="h-4 w-4" />
                      <span>Download Certificate</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
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

      {/* Leaderboard Section */}
      {canShowParticipantLeaderboard && (
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Leaderboard 
            events={registrations.filter(r => r.status === 'COMPLETED').map(r => r.event).filter(Boolean)} 
            defaultEventId={defaultLeaderboardEventId} 
          />
        </div>
      )}
    </div>
  );
}
