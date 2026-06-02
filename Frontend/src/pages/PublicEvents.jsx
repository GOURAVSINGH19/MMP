import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Calendar, ClipboardList, LayoutDashboard, MapPin, ShieldAlert, Trophy, Users, X } from 'lucide-react';
import { toast } from 'react-toastify';

const fallbackEvents = [
  {
    id: 'metropolis-marathon-2026',
    name: 'Metropolis Marathon 2026',
    description: 'City-wide marathon with 5K, 10K, half marathon, and full marathon categories.',
    date: '2026-05-28T05:30:00.000Z',
    registrationDeadline: '2026-05-15T23:59:00.000Z',
    location: 'Metropolis Central Park',
    eventStatus: 'REGISTRATION_OPEN',
    distances: ['5K', '10K', '21K', '42K'],
    _count: { registrations: 0, volunteers: 0, sponsors: 0 },
  },
];

const volunteerTypes = [
  { value: 'CHECK_IN', label: 'Check-In' },
  { value: 'REGISTRATION_DESK', label: 'Registration Desk' },
  { value: 'FINISH_LINE', label: 'Finish Line' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'WATER_STATION', label: 'Water Station' },
  { value: 'ROUTE_MARSHAL', label: 'Route Marshal' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'LOGISTICS', label: 'Logistics' },
];

const formatDate = (value) => {
  if (!value) return 'To be announced';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
};

const eventGroup = (event) => {
  if (event.eventStatus === 'RACE_DAY') return 'Active';
  if (['COMPLETED', 'ARCHIVED'].includes(event.eventStatus) || new Date(event.date) < new Date()) return 'Completed';
  return 'Upcoming';
};

const statusVariant = (status) => {
  if (status === 'REGISTRATION_OPEN' || status === 'PUBLISHED') return 'success';
  if (status === 'RACE_DAY') return 'warning';
  if (status === 'COMPLETED') return 'secondary';
  return 'default';
};

function VolunteerApplicationModal({ event, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    volunteerType: 'CHECK_IN',
    availability: '',
    experience: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/volunteer-applications', {
        eventId: event.id,
        ...form,
      });
      toast.success('Volunteer application submitted.');
      onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit volunteer application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <Card className="w-full max-w-lg border-slate-200 shadow-2xl">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Apply as volunteer</CardTitle>
              <CardDescription className="mt-1">{event.name}</CardDescription>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={submit}>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <Label htmlFor="volunteerType">Volunteer type</Label>
              <Select
                id="volunteerType"
                value={form.volunteerType}
                onChange={(e) => setForm({ ...form, volunteerType: e.target.value })}
                disabled={submitting}
              >
                {volunteerTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                placeholder="Example: race day 5 AM to 11 AM"
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience</Label>
              <textarea
                id="experience"
                className="min-h-24 w-full rounded-lg border border-slate-250 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                placeholder="Share relevant experience, certifications, or preferred responsibilities."
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                disabled={submitting}
              />
            </div>
          </CardContent>
          <div className="flex justify-end gap-2 border-t border-slate-100 p-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button type="submit" variant="glow" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function EventCard({ event, application, onApply, user, organizer }) {
  const isCompleted = ['COMPLETED', 'ARCHIVED'].includes(event.eventStatus) || new Date(event.date) < new Date();
  const canRegister = !isCompleted && ['PUBLISHED', 'REGISTRATION_OPEN'].includes(event.eventStatus);
  const canApplyAsVolunteer = !isCompleted;
  const applicationStatus = application?.approvalStatus;

  return (
    <Card className="group overflow-hidden border-slate-200/80 transition hover:-translate-y-0.5 hover:border-brand-primary/15 hover:shadow-lg">
      <div className="h-2 bg-gradient-to-r from-brand-primary via-brand-accent to-strip-primary" />
      <CardHeader className="border-b border-slate-100 bg-gradient-to-b from-white to-brand-light/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl transition-colors group-hover:text-brand-primary">{event.name}</CardTitle>
            <CardDescription className="mt-2">
              {event.description || 'Official marathon event details and registration categories.'}
            </CardDescription>
          </div>
          <Badge variant={statusVariant(event.eventStatus)}>{event.eventStatus.replaceAll('_', ' ')}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200/80 bg-brand-light/40 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <Calendar className="h-4 w-4 text-brand-primary" />
              Race date
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900">{formatDate(event.date)}</div>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-brand-light/40 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <MapPin className="h-4 w-4 text-brand-primary" />
              Location
            </div>
            <div className="mt-2 text-sm font-bold text-slate-900">{event.location}</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Race categories</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(event.distances || []).map((distance) => (
              <Badge key={distance} variant="default">{distance}</Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-primary" />
              {event._count?.registrations || 0} registrations
            </span>
            <span>{event._count?.volunteers || 0} assigned volunteers</span>
            {applicationStatus && <Badge variant={applicationStatus === 'APPROVED' ? 'success' : applicationStatus === 'REJECTED' ? 'danger' : 'warning'}>Volunteer {applicationStatus.toLowerCase()}</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {organizer ? (
              <Link to={`/admin?eventId=${event.id}`}>
                <Button size="sm" variant="glow">
                  Manage Marathon
                </Button>
              </Link>
            ) : (
              <Link to={`/events/${event.id}`}>
                <Button size="sm" variant={isCompleted ? 'glow' : 'outline'}>
                  {isCompleted ? 'View' : 'Details'}
                </Button>
              </Link>
            )}
            {!organizer && canRegister && (
              <Link to={user ? `/register-marathon?eventId=${event.id}` : '/login'}>
                <Button size="sm" variant="glow" className="gap-1.5">
                  Register as participant
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            {!organizer && canApplyAsVolunteer && user ? (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onApply(event)} disabled={applicationStatus === 'PENDING' || applicationStatus === 'APPROVED'}>
                <ClipboardList className="h-3.5 w-3.5" />
                {applicationStatus ? 'Application saved' : 'Apply as volunteer'}
              </Button>
            ) : !organizer && canApplyAsVolunteer ? (
              <Link to="/login">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Apply as volunteer
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PublicEvents() {
  const { user, isOrganizer, isVolunteer, isParticipant } = useAuth();
  const organizer = user && isOrganizer();
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadApplications = async () => {
    if (!user) {
      setApplications([]);
      return;
    }

    try {
      const response = await api.get('/volunteer-applications/my');
      setApplications(response.data || []);
    } catch {
      setApplications([]);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/participant/events');
        setEvents(response.data.length ? response.data : fallbackEvents);
        setError('');
      } catch {
        setEvents(fallbackEvents);
        setError('Live events could not be loaded, so sample public event details are shown.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    loadApplications();
  }, [user]);

  const applicationsByEvent = useMemo(() => {
    return applications.reduce((map, application) => {
      map[application.eventId] = application;
      return map;
    }, {});
  }, [applications]);

  const groupedEvents = useMemo(() => {
    return events.reduce((groups, event) => {
      const group = eventGroup(event);
      groups[group].push(event);
      return groups;
    }, { Upcoming: [], Active: [], Completed: [] });
  }, [events]);

  const dashboardLink = isOrganizer() ? '/admin' : isVolunteer() ? '/volunteer' : isParticipant() ? '/dashboard' : null;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        icon={Trophy}
        badge="Event discovery"
        title="Choose your marathon path"
        description="Browse events, register as a participant, or apply as a volunteer from the same event card."
      />

      {dashboardLink && (
        <div className="flex justify-end">
          <Link to={dashboardLink}>
            <Button variant="outline" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              My dashboard
            </Button>
          </Link>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading events...</p>
        </div>
      ) : (
        <>
          {Object.entries(groupedEvents).map(([group, groupEvents]) => (
            groupEvents.length > 0 && (
              <section key={group} className="space-y-4">
                <div>
                  <h2 className="m-0 text-lg font-black tracking-tight text-slate-900">{group} events</h2>
                  <p className="m-0 mt-1 text-sm text-slate-500">
                    {group === 'Upcoming' && 'Open and future races where users can decide how they want to participate.'}
                    {group === 'Active' && 'Race-day events that may need scanner-enabled volunteers and live operations.'}
                    {group === 'Completed' && 'Finished races kept available for records, certificates, and history.'}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {groupEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      application={applicationsByEvent[event.id]}
                      onApply={setSelectedEvent}
                      user={user}
                      organizer={organizer}
                    />
                  ))}
                </div>
              </section>
            )
          ))}
        </>
      )}

      {selectedEvent && (
        <VolunteerApplicationModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onSubmitted={loadApplications}
        />
      )}
    </div>
  );
}
