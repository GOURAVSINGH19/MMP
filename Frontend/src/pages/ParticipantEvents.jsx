import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';
import {
  Award,
  Calendar,
  History,
  MapPin,
  ShieldAlert,
  Trophy,
  LayoutDashboard,
  ArrowRight,
  Shirt,
} from 'lucide-react';

const formatDate = (value) => {
  if (!value) return 'TBA';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const statusVariant = (status) => {
  if (status === 'COMPLETED') return 'success';
  if (['APPROVED', 'CONFIRMED', 'BIB_COLLECTED'].includes(status)) return 'default';
  if (['REGISTERED', 'PAYMENT_SUCCESSFUL'].includes(status)) return 'secondary';
  if (['PAYMENT_PENDING', 'PAYMENT_FAILED'].includes(status)) return 'warning';
  if (status === 'WITHDRAWN' || status === 'REFUNDED') return 'danger';
  return 'secondary';
};

const formatStatus = (status) => status?.replaceAll('_', ' ') || 'Unknown';

function RegistrationCard({ registration, isCurrent }) {
  const { event, status, distance, tshirtSize, bibNumber, finishTime, registeredAt } = registration;

  return (
    <Card
      className={`overflow-hidden transition hover:shadow-md ${
        isCurrent ? 'border-brand-primary/30 shadow-md ring-1 ring-brand-primary/10' : 'border-slate-200/80'
      }`}
    >
      {isCurrent && <div className="h-1.5 bg-gradient-to-r from-brand-primary via-brand-accent to-strip-primary" />}
      <CardHeader className={isCurrent ? 'bg-gradient-to-b from-brand-light/50 to-white' : ''}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{event.name}</CardTitle>
            <CardDescription className="mt-1">{event.description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {isCurrent && <Badge variant="success">Your registration</Badge>}
            <Badge variant={statusVariant(status)}>{formatStatus(status)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-brand-light/30 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-4 w-4 text-brand-primary" />
              Race date
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">{formatDate(event.date)}</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-brand-light/30 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <MapPin className="h-4 w-4 text-brand-primary" />
              Location
            </div>
            <p className="mt-2 text-sm font-bold text-slate-900">{event.location}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="default">{distance}</Badge>
          <Badge variant="secondary" className="gap-1">
            <Shirt className="h-3 w-3" />
            {tshirtSize}
          </Badge>
          {bibNumber && <Badge variant="secondary">BIB {bibNumber}</Badge>}
          {finishTime && (
            <Badge variant="success" className="gap-1">
              <Award className="h-3 w-3" />
              {finishTime}
            </Badge>
          )}
          <span className="self-center text-xs text-slate-500">Registered {formatDate(registeredAt)}</span>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {isCurrent && (
            <Link to="/dashboard">
              <Button variant="glow" size="sm" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Open runner dashboard
              </Button>
            </Link>
          )}
          <Link to={`/events/${event.id}`}>
            <Button variant={isCurrent ? 'outline' : 'glow'} size="sm">
              {isCurrent ? 'Event details' : 'View'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function AvailableEventCard({ event }) {
  return (
    <Card className="border-slate-200/80">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-900">{event.name}</h3>
          <p className="text-sm text-slate-500 mt-1">{formatDate(event.date)} · {event.location}</p>
        </div>
        <Link to={`/register-marathon?eventId=${event.id}`}>
          <Button variant="glow" size="sm" className="gap-1.5">
            Register now
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function ParticipantEvents() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/participant/my-events');
        setCurrent(data.current);
        setHistory(data.history || []);
        setAvailable(data.availableToRegister || []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load your marathon registrations.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        icon={Trophy}
        badge="My events"
        title="Your marathon registrations"
        description="See the event you are registered for and your race history. You will not be prompted to register again for the same event."
      />

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading your registrations…</p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-brand-primary" />
              <h2 className="m-0 text-lg font-black tracking-tight text-slate-900">Previous events</h2>
            </div>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((reg) => (
                  <RegistrationCard key={reg.id} registration={reg} />
                ))}
              </div>
            ) : (
              <Card className="border-slate-200/80">
                <CardContent className="py-8 text-center text-sm text-slate-500">
                  No past events yet. Finished or ended races will appear here.
                </CardContent>
              </Card>
            )}
          </section>

          {available.length > 0 && (
            <section className="space-y-4">
              <h2 className="m-0 text-lg font-black tracking-tight text-slate-900">Other open events</h2>
              <p className="text-sm text-slate-500 m-0">
                Events you are not registered for yet.
              </p>
              <div className="space-y-3">
                {available.map((event) => (
                  <AvailableEventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
