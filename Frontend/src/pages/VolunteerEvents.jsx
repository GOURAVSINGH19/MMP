import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';
import {
  Calendar,
  History,
  MapPin,
  QrCode,
  ShieldAlert,
  Trophy,
  ClipboardList,
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

const formatRole = (role) => role?.replaceAll('_', ' ') || 'Volunteer';

const statusVariant = (status) => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'COMPLETED') return 'secondary';
  if (status === 'CANCELLED') return 'danger';
  return 'default';
};

function AssignmentCard({ assignment, isCurrent }) {
  const { event, volunteerRole, status, assignedAt, scanCount, canScan } = assignment;

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
            {isCurrent && <Badge variant="success">Current assignment</Badge>}
            <Badge variant={statusVariant(status)}>{status}</Badge>
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
          <Badge variant="default">{formatRole(volunteerRole)}</Badge>
          {canScan && (
            <Badge variant="secondary" className="gap-1">
              <QrCode className="h-3 w-3" />
              Scanner access
            </Badge>
          )}
          <span className="text-slate-500 self-center text-xs">
            Joined {formatDate(assignedAt)}
          </span>
          {scanCount > 0 && (
            <span className="text-slate-500 self-center text-xs">
              · {scanCount} scan{scanCount !== 1 ? 's' : ''} logged
            </span>
          )}
        </div>

        {isCurrent && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <Link to="/volunteer">
              <Button variant="glow" size="sm" className="gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Open volunteer portal
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function VolunteerEvents() {
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/volunteer/my-events');
        setCurrent(data.current);
        setHistory(data.history || []);
        setError('');
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load your marathon assignments.');
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
        title="Your marathon assignment"
        description="View the event you are assigned to and your volunteer history with past races."
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
          <p className="text-sm text-slate-500">Loading your assignments…</p>
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="m-0 text-lg font-black tracking-tight text-slate-900">Current marathon</h2>
            {current ? (
              <AssignmentCard assignment={current} isCurrent />
            ) : (
              <Card className="border-dashed border-slate-300 bg-slate-50/50">
                <CardContent className="py-12 text-center">
                  <Trophy className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-slate-700">No active marathon assignment</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Contact the race organizer to be assigned to an upcoming event.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-brand-primary" />
              <h2 className="m-0 text-lg font-black tracking-tight text-slate-900">Previous history</h2>
            </div>

            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map((assignment) => (
                  <AssignmentCard key={assignment.id} assignment={assignment} />
                ))}
              </div>
            ) : (
              <Card className="border-slate-200/80">
                <CardContent className="py-8 text-center text-sm text-slate-500">
                  No past marathon assignments yet. Completed or ended events will appear here.
                </CardContent>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
